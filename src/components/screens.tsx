import { PLANETS, PLANET_BY_ID, getPlanetIndex } from "../config/planets";
import { QUESTION_TIME_LIMIT_MS, RESPONSE_WINDOW_LEVELS, getStreakLabel } from "../domain/session";
import { PhaserBattle } from "./PhaserBattle";
import { getBannerText, getCurrentQuestion, useGameStore } from "../store/gameStore";
import type { GameMode, PlanetId, ResponseWindowLevel } from "../types";

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
  const playerName = useGameStore((state) => state.playerName);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const selectedPlanetId = useGameStore((state) => state.selectedPlanetId);
  const responseWindowLevel = useGameStore((state) => state.responseWindowLevel);
  const setResponseWindowLevel = useGameStore((state) => state.setResponseWindowLevel);
  const responseWindowMs = QUESTION_TIME_LIMIT_MS(
    selectedPlanetId,
    responseWindowLevel
  );

  return (
    <section className="screen home-screen">
      <div className="hero-card">
        <span className="eyebrow">Светлая arcade-тренировка</span>
        <h1>{playerName ? `${playerName}, к полёту готов?` : "Космическая таблица"}</h1>
        <p>
          {playerName
            ? `Защищай станцию, ${playerName}, отвечай быстро и прокачивай таблицу умножения как суперпилот.`
            : "Защищай станцию, отвечай быстро и запоминай таблицу умножения как суперпилот."}
        </p>
        <label className="player-name-field">
          <span className="player-name-label">Имя пилота</span>
          <input
            className="player-name-input"
            type="text"
            inputMode="text"
            autoComplete="given-name"
            maxLength={24}
            placeholder="Например, Алексей"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
          />
        </label>
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
      <div className="response-tuning-panel home-response-tuning">
        <div className="response-tuning-copy">
          <strong>Сложность по времени</strong>
          <span>
            Уровень {responseWindowLevel} · {responseWindowMs} мс на ответ
          </span>
        </div>
        <input
          className="response-tuning-slider"
          type="range"
          min={1}
          max={6}
          step={1}
          value={responseWindowLevel}
          onChange={(event) =>
            setResponseWindowLevel(Number(event.target.value) as ResponseWindowLevel)
          }
          aria-label="Уровень скорости падения"
          list="response-window-levels"
        />
        <div className="response-tuning-labels" aria-hidden="true">
          {RESPONSE_WINDOW_LEVELS.map((level) => (
            <span
              key={level}
              className={level === responseWindowLevel ? "is-active" : undefined}
            >
              {level}
            </span>
          ))}
        </div>
        <datalist id="response-window-levels">
          {RESPONSE_WINDOW_LEVELS.map((level) => (
            <option key={level} value={level} />
          ))}
        </datalist>
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
  const startPlanetBattle = useGameStore((state) => state.startPlanetBattle);
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
            <div
              key={planet.id}
              className={`planet-card ${isActive ? "is-active" : ""} ${isUnlocked ? "" : "is-locked"}`}
            >
              <span>{index + 1}</span>
              <div>
                <button
                  type="button"
                  className="planet-title-button"
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (isUnlocked) {
                      startPlanetBattle(planet.id as PlanetId);
                    }
                  }}
                >
                  <strong>{planet.name}</strong>
                </button>
                <p>{planet.subtitle}</p>
              </div>
              <button
                type="button"
                className="planet-status-button"
                disabled={!isUnlocked}
                onClick={() => selectPlanet(planet.id as PlanetId)}
              >
                <em>{isCompleted ? "Очищено" : isUnlocked ? "Доступно" : "Закрыто"}</em>
              </button>
            </div>
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
          <span className="battle-weapon">
            Оружие: {["Базовый лазер", "Двойной лазер", "Плазма", "Суперлуч"][battle.weaponLevel]}
          </span>
        </div>
      </div>

      <div className="battle-panel">
        <div className="status-ribbon" style={{ "--planet-accent": planet.accent } as React.CSSProperties}>
          <span>{planet.subtitle}</span>
          <strong>{streakLabel || "БОЕВАЯ ГОТОВНОСТЬ"}</strong>
        </div>
        <PhaserBattle />
        <div className="question-panel">
          <div className="formula">
            {battle.currentOutcome?.revealText ?? question?.text ?? "Готовься"}
          </div>
          <div className={`feedback-banner ${battle.currentOutcome ? "is-visible" : ""}`}>
            {banner}
          </div>
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
        <p>{result.encouragementText}</p>
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
            <h3>{result.difficultFactsTitle}</h3>
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
