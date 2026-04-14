import { useEffect, useState } from "react";
import { PLANETS, PLANET_BY_ID, getPlanetIndex } from "../config/planets";
import { QUESTION_TIME_LIMIT_MS } from "../domain/session";
import { getStreakLabel } from "../domain/session";
import { PhaserBattle } from "./PhaserBattle";
import { getBannerText, getCurrentQuestion, useGameStore } from "../store/gameStore";
import type { BattleSession, GameMode, PlanetId } from "../types";

const modeMeta: Record<
  GameMode,
  { title: string; description: string; badge: string }
> = {
  firstFlight: {
    title: "Первый полёт",
    description: "Таблица до 5. Спокойный старт и мягкое повторение.",
    badge: "до 5"
  },
  galactic: {
    title: "Галактический режим",
    description: "Полная таблица умножения и деления до 9.",
    badge: "полная таблица"
  }
};

export function HomeScreen() {
  const startModeSelection = useGameStore((state) => state.startModeSelection);
  const openSettings = useGameStore((state) => state.openSettings);
  const unlockAudio = useGameStore((state) => state.unlockAudio);

  return (
    <section className="screen home-screen">
      <div className="hero-card">
        <span className="eyebrow">Светлая arcade-тренировка</span>
        <h1>Космическая таблица</h1>
        <p>
          Защищай станцию, отвечай быстро и запоминай таблицу умножения как
          суперпилот.
        </p>
        <div className="hero-actions">
          <button
            className="primary-button"
            onClick={() => {
              unlockAudio();
              startModeSelection();
            }}
          >
            Играть
          </button>
          <button className="secondary-button" onClick={openSettings}>
            Настройки звука
          </button>
        </div>
      </div>
      <div className="info-strip">
        <div>
          <strong>10 врагов</strong>
          <span>на миссию</span>
        </div>
        <div>
          <strong>5 щитов</strong>
          <span>у базы</span>
        </div>
        <div>
          <strong>3 канала</strong>
          <span>музыка, звуки, голос</span>
        </div>
      </div>
    </section>
  );
}

export function ModeSelectScreen() {
  const selectMode = useGameStore((state) => state.selectMode);
  const goHome = useGameStore((state) => state.goHome);

  return (
    <section className="screen">
      <div className="header-row">
        <button className="ghost-button" onClick={goHome}>
          Назад
        </button>
        <h2>Выбери режим</h2>
      </div>
      <div className="mode-grid">
        {Object.entries(modeMeta).map(([mode, meta]) => (
          <button
            key={mode}
            className="mode-card"
            onClick={() => selectMode(mode as GameMode)}
          >
            <span className="mode-badge">{meta.badge}</span>
            <h3>{meta.title}</h3>
            <p>{meta.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function PlanetMapScreen() {
  const selectedMode = useGameStore((state) => state.selectedMode);
  const selectedPlanetId = useGameStore((state) => state.selectedPlanetId);
  const unlockedPlanetIndex = useGameStore((state) => state.unlockedPlanetIndex);
  const completedPlanetIndex = useGameStore((state) => state.completedPlanetIndex);
  const selectPlanet = useGameStore((state) => state.selectPlanet);
  const startBattle = useGameStore((state) => state.startBattle);
  const goHome = useGameStore((state) => state.goHome);

  if (!selectedMode) {
    return null;
  }

  const activePlanet = PLANET_BY_ID[selectedPlanetId];
  const activeIndex = getPlanetIndex(selectedPlanetId);

  return (
    <section className="screen">
      <div className="header-row">
        <button className="ghost-button" onClick={goHome}>
          Домой
        </button>
        <h2>{modeMeta[selectedMode].title}</h2>
      </div>
      <div className="planet-feature" style={{ "--planet-accent": activePlanet.accent } as React.CSSProperties}>
        <span className="eyebrow">Новая зона</span>
        <h3>{activePlanet.name}</h3>
        <p>{activePlanet.fact}</p>
        <button className="primary-button" onClick={startBattle}>
          Начать миссию
        </button>
      </div>
      <div className="planet-list">
        {PLANETS.map((planet, index) => {
          const isUnlocked = index <= unlockedPlanetIndex[selectedMode];
          const isCompleted = index <= completedPlanetIndex[selectedMode];
          const isActive = planet.id === selectedPlanetId;

          return (
            <button
              key={planet.id}
              className={`planet-card ${isActive ? "is-active" : ""}`}
              disabled={!isUnlocked}
              onClick={() => selectPlanet(planet.id as PlanetId)}
            >
              <span>{index + 1}</span>
              <div>
                <strong>{planet.name}</strong>
                <p>{planet.subtitle}</p>
              </div>
              <em>{isCompleted ? "Очищено" : isUnlocked ? "Доступно" : "Закрыто"}</em>
            </button>
          );
        })}
      </div>
      <div className="planet-progress">
        Пройдено зон: {Math.max(0, completedPlanetIndex[selectedMode] + 1)} / {PLANETS.length}
        <br />
        Текущий сектор: {activeIndex + 1}
      </div>
    </section>
  );
}

export function BattleScreen() {
  const battle = useGameStore((state) => state.battle);
  const submitAnswer = useGameStore((state) => state.submitAnswer);

  if (!battle) {
    return null;
  }

  const question = getCurrentQuestion(battle);
  const planet = PLANET_BY_ID[battle.planetId];
  const streakLabel = getStreakLabel(battle.streak);
  const banner = getBannerText(battle);

  return (
    <section className="screen battle-screen">
      <div className="battle-topbar">
        <div className="shield-bar">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={index < battle.shield ? "shield-segment on" : "shield-segment"}
            />
          ))}
        </div>
        <div className="battle-meta">
          <strong>{planet.name}</strong>
          <span>
            Враг {battle.currentQuestionIndex + 1} / {battle.questions.length}
          </span>
        </div>
      </div>

      <div className="battle-panel">
        <div className="status-ribbon" style={{ "--planet-accent": planet.accent } as React.CSSProperties}>
          <span>{planet.subtitle}</span>
          <strong>{streakLabel || "БОЕВАЯ ГОТОВНОСТЬ"}</strong>
        </div>
        <PhaserBattle />
        <EnemyOverlay battle={battle} />
        <div className="question-panel">
          <div className="formula">
            {battle.currentOutcome?.revealText ?? question?.text ?? "Готовься"}
          </div>
          <div className={`feedback-banner ${battle.currentOutcome ? "is-visible" : ""}`}>
            {banner}
          </div>
        </div>
      </div>

      <div className="weapon-panel">
        <span>Оружие: {["Базовый лазер", "Двойной лазер", "Плазма", "Суперлуч"][battle.weaponLevel]}</span>
        <div className="charge-bar">
          <div style={{ width: `${Math.min(100, (battle.streak / 8) * 100)}%` }} />
        </div>
      </div>

      <div className="answers-grid">
        {question?.options.map((option) => (
          <button
            key={option}
            className="answer-button"
            disabled={battle.phase !== "questionActive"}
            onClick={() => submitAnswer(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

function EnemyOverlay({ battle }: { battle: BattleSession }) {
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    let frameId = 0;

    const update = () => {
      setNow(performance.now());
      frameId = window.requestAnimationFrame(update);
    };

    frameId = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [battle.currentQuestionIndex]);

  const question = getCurrentQuestion(battle);

  if (!question) {
    return null;
  }

  const limit = QUESTION_TIME_LIMIT_MS(battle.planetId);
  const elapsed = Math.max(0, now - battle.questionStartedAt);
  const progress = Math.min(1, elapsed / limit);
  const eased = progress * progress;
  const hash = [...question.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const leftPercent = 22 + (hash % 54);
  const topPercent = 12 + eased * 50;
  const dx = leftPercent - 50;
  const dy = topPercent - 82;
  const turretAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
  const outcome = battle.currentOutcome;
  const stateClass =
    outcome?.status === "wrong" || outcome?.status === "timeout"
      ? "is-crash"
      : outcome
        ? "is-hit"
        : "";

  return (
    <>
      <div
        className="station-overlay"
        style={{ "--gun-angle": `${turretAngle}deg` } as React.CSSProperties}
      >
        <div className="station-glow" />
        <div className="station-platform" />
        <div className="station-wing left" />
        <div className="station-wing right" />
        <div className="station-column" />
        <div className="station-gun" />
        <div className="station-core" />
      </div>
      <div
        className={`enemy-overlay ${question.difficultyTier === "boss" ? "is-boss" : ""} ${stateClass}`}
        style={
          {
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            "--planet-accent": PLANET_BY_ID[battle.planetId].accent
          } as React.CSSProperties
        }
      >
        <div className="enemy-shadow" />
        <div className="enemy-fin left" />
        <div className="enemy-fin right" />
        <div className="enemy-tail" />
        <div className="enemy-body" />
        <div className="enemy-band" />
        <div className="enemy-nose" />
        <div className="enemy-bolt" />
      </div>
    </>
  );
}

export function ResultScreen() {
  const result = useGameStore((state) => state.result);
  const retryBattle = useGameStore((state) => state.retryBattle);
  const nextFromResult = useGameStore((state) => state.nextFromResult);

  if (!result) {
    return null;
  }

  const planet = PLANET_BY_ID[result.planetId];

  return (
    <section className="screen">
      <div className="result-card" style={{ "--planet-accent": planet.accent } as React.CSSProperties}>
        <span className="eyebrow">
          {result.success ? "Сектор очищен" : "Миссия не завершена"}
        </span>
        <h2>{planet.name}</h2>
        <p>{result.success ? "Станция защищена. Переходим дальше." : "Почти получилось. Ещё одна попытка будет лучше."}</p>
        <div className="result-stats">
          <div>
            <strong>{result.destroyed}</strong>
            <span>врагов уничтожено</span>
          </div>
          <div>
            <strong>{result.shieldLeft}</strong>
            <span>щитов осталось</span>
          </div>
          <div>
            <strong>{result.bestStreak}</strong>
            <span>лучшая серия</span>
          </div>
        </div>
        {result.difficultFacts.length > 0 && (
          <div className="difficult-list">
            <h3>Повторить ещё раз</h3>
            <ul>
              {result.difficultFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="hero-actions">
          <button className="secondary-button" onClick={retryBattle}>
            Повторить
          </button>
          <button className="primary-button" onClick={nextFromResult}>
            {result.success ? "Дальше" : "Тренировка"}
          </button>
        </div>
      </div>
    </section>
  );
}

export function SettingsModal() {
  const settingsOpen = useGameStore((state) => state.settingsOpen);
  const closeSettings = useGameStore((state) => state.closeSettings);
  const toggleAudio = useGameStore((state) => state.toggleAudio);
  const audioSettings = useGameStore((state) => state.audioSettings);

  if (!settingsOpen) {
    return null;
  }

  return (
    <div className="settings-overlay" onClick={closeSettings}>
      <div className="settings-card" onClick={(event) => event.stopPropagation()}>
        <div className="header-row">
          <h2>Настройки</h2>
          <button className="ghost-button" onClick={closeSettings}>
            Закрыть
          </button>
        </div>
        {(
          [
            ["musicOn", "Музыка"],
            ["sfxOn", "Звуки"],
            ["voiceOn", "Голос"]
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className="toggle-row"
            onClick={() => toggleAudio(key)}
          >
            <span>{label}</span>
            <strong>{audioSettings[key] ? "Вкл" : "Выкл"}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
