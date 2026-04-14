import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PLANETS, PLANET_BY_ID, getPlanetIndex } from "../config/planets";
import { createDefaultMastery, updateMastery } from "../domain/mastery";
import {
  QUESTION_TIME_LIMIT_MS,
  buildResultSummary,
  classifyResponse,
  createBattleSession,
  createOutcome,
  getNextPlanetId,
  getStreakLabel,
  getWeaponLevel
} from "../domain/session";
import { audioDirector } from "../utils/audio";
import type {
  AudioSettings,
  BattleSession,
  FactMastery,
  GameMode,
  PlanetId,
  ResultSummary,
  UIScreen
} from "../types";

const defaultAudioSettings: AudioSettings = {
  musicOn: true,
  sfxOn: true,
  voiceOn: true
};

const initialUnlockedPlanetIndex: Record<GameMode, number> = {
  firstFlight: 0,
  galactic: 0
};

const initialCompletedPlanetIndex: Record<GameMode, number> = {
  firstFlight: -1,
  galactic: -1
};

const SUCCESS_REVEAL_MIN_DELAY_MS = 6800;
const FAILURE_REVEAL_DELAY_MS = 840;

let timeoutHandle: number | null = null;
let revealHandle: number | null = null;

const clearHandles = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (timeoutHandle !== null) {
    window.clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }

  if (revealHandle !== null) {
    window.clearTimeout(revealHandle);
    revealHandle = null;
  }

  audioDirector.stopSpeech();
};

interface GameStore {
  screen: UIScreen;
  settingsOpen: boolean;
  selectedMode: GameMode | null;
  selectedPlanetId: PlanetId;
  audioSettings: AudioSettings;
  mastery: Record<string, FactMastery>;
  recentPromptIds: string[];
  unlockedPlanetIndex: Record<GameMode, number>;
  completedPlanetIndex: Record<GameMode, number>;
  battle: BattleSession | null;
  result: ResultSummary | null;
  boot: () => void;
  unlockAudio: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleAudio: (channel: keyof AudioSettings) => void;
  goHome: () => void;
  startModeSelection: () => void;
  selectMode: (mode: GameMode) => void;
  selectPlanet: (planetId: PlanetId) => void;
  startPlanetBattle: (planetId: PlanetId) => void;
  startBattle: () => void;
  submitAnswer: (answer: number) => void;
  retryBattle: () => void;
  nextFromResult: () => void;
}

const beginBattle = (
  set: typeof useGameStore.setState,
  get: typeof useGameStore.getState,
  planetId: PlanetId
) => {
  const { selectedMode, mastery, recentPromptIds } = get();

  if (!selectedMode) {
    return;
  }

  clearHandles();
  audioDirector.unlock();
  audioDirector.playSfx("click");

  const battle = createBattleSession({
    mode: selectedMode,
    planetId,
    masteryMap: mastery,
    recentPromptIds
  });

  battle.phase = "questionActive";
  battle.questionStartedAt = performance.now();
  set({
    screen: "battle",
    selectedPlanetId: planetId,
    battle,
    result: null
  });

  const question = battle.questions[0];
  audioDirector.speak(question.spokenText);
  scheduleQuestionTimeout(planetId, () => {
    const state = get();
    if (
      state.battle &&
      state.battle.phase === "questionActive" &&
      state.battle.questions[state.battle.currentQuestionIndex]?.id === question.id
    ) {
      submitBattleAnswer(set, get, null);
    }
  });
};

const scheduleQuestionTimeout = (planetId: PlanetId, submitTimeout: () => void) => {
  if (typeof window === "undefined") {
    return;
  }

  timeoutHandle = window.setTimeout(
    submitTimeout,
    QUESTION_TIME_LIMIT_MS(planetId) + 40
  );
};

const pushRecentPrompt = (list: string[], promptId: string) => {
  const next = [...list, promptId];
  return next.slice(-12);
};

const resolveOutcomeAndContinue = (
  set: Parameters<typeof useGameStore.setState>[0] extends infer _U
    ? typeof useGameStore.setState
    : typeof useGameStore.setState,
  get: typeof useGameStore.getState,
  outcomeId: string
) => {
  const refreshed = get();
  const activeBattle = refreshed.battle;

  if (!activeBattle || activeBattle.currentOutcome?.id !== outcomeId) {
    return;
  }

  const nextQuestionIndex = activeBattle.currentQuestionIndex + 1;
  const failedMission = activeBattle.shield <= 0;
  const completedMission = nextQuestionIndex >= activeBattle.questions.length;

  if (failedMission || completedMission) {
    const success = completedMission && activeBattle.shield > 0;
    const mode = refreshed.selectedMode ?? activeBattle.mode;
    const currentPlanetIndex = getPlanetIndex(activeBattle.planetId);
    const unlockedPlanetIndex = refreshed.unlockedPlanetIndex[mode];
    const completedPlanetIndex = refreshed.completedPlanetIndex[mode];

    set({
      screen: "result",
      battle: {
        ...activeBattle,
        phase: success ? "battleWon" : "battleLost"
      },
      result: buildResultSummary(activeBattle, success),
      unlockedPlanetIndex: success
        ? {
            ...refreshed.unlockedPlanetIndex,
            [mode]: Math.max(unlockedPlanetIndex, currentPlanetIndex + 1)
          }
        : refreshed.unlockedPlanetIndex,
      completedPlanetIndex: success
        ? {
            ...refreshed.completedPlanetIndex,
            [mode]: Math.max(completedPlanetIndex, currentPlanetIndex)
          }
        : refreshed.completedPlanetIndex
    });
    return;
  }

  const nextQuestion = activeBattle.questions[nextQuestionIndex];
  const updatedBattle: BattleSession = {
    ...activeBattle,
    currentQuestionIndex: nextQuestionIndex,
    questionStartedAt: performance.now(),
    currentOutcome: null,
    phase: "questionActive"
  };

  set({ battle: updatedBattle });
  audioDirector.speak(nextQuestion.spokenText);
  scheduleQuestionTimeout(activeBattle.planetId, () => {
    const snapshot = get();
    if (
      snapshot.battle &&
      snapshot.battle.phase === "questionActive" &&
      snapshot.battle.questions[snapshot.battle.currentQuestionIndex]?.id ===
        nextQuestion.id
    ) {
      submitBattleAnswer(set, get, null);
    }
  });
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      screen: "boot",
      settingsOpen: false,
      selectedMode: null,
      selectedPlanetId: PLANETS[0].id,
      audioSettings: defaultAudioSettings,
      mastery: {},
      recentPromptIds: [],
      unlockedPlanetIndex: initialUnlockedPlanetIndex,
      completedPlanetIndex: initialCompletedPlanetIndex,
      battle: null,
      result: null,
      boot: () => {
        audioDirector.updateSettings(get().audioSettings);
        set({ screen: "home" });
      },
      unlockAudio: () => {
        audioDirector.unlock();
      },
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      toggleAudio: (channel) => {
        const audioSettings = {
          ...get().audioSettings,
          [channel]: !get().audioSettings[channel]
        };

        audioDirector.updateSettings(audioSettings);
        set({ audioSettings });
      },
      goHome: () => {
        clearHandles();
        set({
          screen: "home",
          selectedMode: null,
          battle: null,
          result: null
        });
      },
      startModeSelection: () => {
        audioDirector.playSfx("click");
        set({ screen: "modeSelect" });
      },
      selectMode: (mode) => {
        audioDirector.playSfx("click");
        const unlockedIndex = get().unlockedPlanetIndex[mode];
        set({
          selectedMode: mode,
          selectedPlanetId: PLANETS[unlockedIndex].id,
          screen: "planetMap",
          result: null
        });
      },
      selectPlanet: (planetId) => {
        audioDirector.playSfx("click");
        set({ selectedPlanetId: planetId });
      },
      startPlanetBattle: (planetId) => {
        beginBattle(set, get, planetId);
      },
      startBattle: () => {
        beginBattle(set, get, get().selectedPlanetId);
      },
      submitAnswer: (answer) => {
        submitBattleAnswer(set, get, answer);
      },
      retryBattle: () => {
        clearHandles();
        set({ result: null });
        get().startBattle();
      },
      nextFromResult: () => {
        const { result, selectedMode, unlockedPlanetIndex } = get();

        if (!result) {
          return;
        }

        const mode = selectedMode ?? result.mode;

        if (!result.success) {
          set({
            screen: "planetMap",
            result: null,
            selectedMode: mode
          });
          return;
        }

        const nextPlanetId = getNextPlanetId(result.planetId);
        const nextIndex = getPlanetIndex(nextPlanetId);

        set({
          result: null,
          screen: "planetMap",
          selectedMode: mode,
          selectedPlanetId: nextPlanetId,
          unlockedPlanetIndex: {
            ...unlockedPlanetIndex,
            [mode]: Math.max(unlockedPlanetIndex[mode], nextIndex)
          }
        });
      }
    }),
    {
      name: "space-math-arcade-storage",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        audioSettings: state.audioSettings,
        mastery: state.mastery,
        recentPromptIds: state.recentPromptIds,
        unlockedPlanetIndex: state.unlockedPlanetIndex,
        completedPlanetIndex: state.completedPlanetIndex,
        selectedMode: state.selectedMode,
        selectedPlanetId: state.selectedPlanetId
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          audioDirector.updateSettings(state.audioSettings);
        }
      }
    }
  )
);

const submitBattleAnswer = (
  set: Parameters<typeof useGameStore.setState>[0] extends infer _U ? typeof useGameStore.setState : typeof useGameStore.setState,
  get: typeof useGameStore.getState,
  answer: number | null
) => {
  const state = get();
  const battle = state.battle;

  if (!battle || battle.phase !== "questionActive") {
    return;
  }

  clearHandles();

  const question = battle.questions[battle.currentQuestionIndex];
  const responseTimeMs =
    answer === null
      ? QUESTION_TIME_LIMIT_MS(battle.planetId) + 1
      : performance.now() - battle.questionStartedAt;

  const rawStatus =
    answer === null
      ? "timeout"
      : classifyResponse(responseTimeMs, answer === question.correctAnswer);
  const status = rawStatus === "timeout" && answer !== null ? "slow" : rawStatus;
  const succeeded = status === "instant" || status === "good" || status === "slow";
  const nextStreak = succeeded ? battle.streak + 1 : 0;
  const shieldLost = succeeded ? 0 : 1;
  const updatedMastery = {
    ...state.mastery,
    [question.familyId]: updateMastery(
      state.mastery[question.familyId] ?? createDefaultMastery(question.familyId),
      rawStatus
    )
  };
  const difficultFacts = new Set(battle.sessionStats.difficultFacts);

  if (!succeeded) {
    difficultFacts.add(question.revealText);
  } else if (status === "slow") {
    difficultFacts.add(question.revealText);
  }

  const currentOutcome = createOutcome({
    questionId: question.id,
    familyId: question.familyId,
    status: rawStatus,
    responseTimeMs,
    selectedAnswer: answer,
    streakBefore: battle.streak,
    streakAfter: nextStreak,
    shieldLost,
    revealText: succeeded ? question.revealText : undefined
  });

  const shield = Math.max(0, battle.shield - shieldLost);
  const sessionStats = {
    ...battle.sessionStats,
    destroyed: battle.sessionStats.destroyed + (succeeded ? 1 : 0),
    wrong: battle.sessionStats.wrong + (rawStatus === "wrong" ? 1 : 0),
    timedOut: battle.sessionStats.timedOut + (rawStatus === "timeout" ? 1 : 0),
    instant: battle.sessionStats.instant + (rawStatus === "instant" ? 1 : 0),
    bestStreak: Math.max(battle.sessionStats.bestStreak, nextStreak),
    difficultFacts: [...difficultFacts].slice(-6)
  };

  const nextBattle: BattleSession = {
    ...battle,
    shield,
    streak: nextStreak,
    weaponLevel: getWeaponLevel(nextStreak),
    phase: succeeded ? "factReveal" : "answerResolved",
    currentOutcome,
    sessionStats
  };

  set({
    battle: nextBattle,
    mastery: updatedMastery,
    recentPromptIds: pushRecentPrompt(state.recentPromptIds, question.promptId)
  });

  if (succeeded) {
    audioDirector.playSfx("shoot");
    audioDirector.playSfx("success");
    if (nextBattle.weaponLevel > battle.weaponLevel) {
      audioDirector.playSfx("upgrade");
    }
    void audioDirector
      .speakSequenceAndWait(
        [
          question.spokenText,
          `равно ${question.spokenAnswerText}`,
          `ответ ${question.spokenAnswerText}`
        ],
        {
        minimumDurationMs: SUCCESS_REVEAL_MIN_DELAY_MS,
        postSpeechDelayMs: 1800,
        betweenPartsDelayMs: 420,
        rate: 0.74,
        pitch: 1
      }
      )
      .then(() => {
        resolveOutcomeAndContinue(set, get, currentOutcome.id);
      });
  } else {
    audioDirector.playSfx("damage");
    revealHandle = window.setTimeout(() => {
      resolveOutcomeAndContinue(set, get, currentOutcome.id);
    }, FAILURE_REVEAL_DELAY_MS);
  }
};

export const getCurrentPlanet = (state: GameStore) =>
  PLANET_BY_ID[state.selectedPlanetId];

export const getCurrentQuestion = (battle: BattleSession | null) =>
  battle ? battle.questions[battle.currentQuestionIndex] ?? null : null;

export const getBannerText = (battle: BattleSession | null) => {
  if (!battle) {
    return "";
  }

  if (battle.currentOutcome?.status === "instant") {
    return "ТОЧНО!";
  }

  if (battle.currentOutcome?.status === "good") {
    return "ОТЛИЧНО!";
  }

  if (battle.currentOutcome?.status === "slow") {
    return "ЕСТЬ ПОПАДАНИЕ!";
  }

  return getStreakLabel(battle.streak);
};
