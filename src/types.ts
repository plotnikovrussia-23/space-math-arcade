export type UIScreen =
  | "boot"
  | "welcome"
  | "home"
  | "modeSelect"
  | "planetMap"
  | "battle"
  | "result";

export type BattlePhase =
  | "battleIntro"
  | "questionActive"
  | "answerResolved"
  | "factReveal"
  | "waveComplete"
  | "battleWon"
  | "battleLost"
  | "paused";

export type GameMode = "firstFlight" | "galactic";

export type PlanetId =
  | "earth"
  | "orbit"
  | "moon"
  | "mars"
  | "asteroids"
  | "saturn"
  | "blackHole"
  | "core";

export type PromptType = "multiply" | "divideByA" | "divideByB";

export type SpeedClass = "instant" | "good" | "slow" | "timeout" | "wrong";
export type ResponseWindowLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type QuestionDifficulty = "warmup" | "mid" | "tense" | "boss";

export interface PlanetConfig {
  id: PlanetId;
  name: string;
  subtitle: string;
  fact: string;
  accent: string;
  background: [string, string];
  enemyTint: number;
  baseSpeed: number;
  questionTimeMs: number;
}

export interface FactFamily {
  id: string;
  a: number;
  b: number;
  product: number;
  modeAvailability: GameMode[];
}

export interface Question {
  id: string;
  familyId: string;
  promptId: string;
  promptType: PromptType;
  text: string;
  spokenText: string;
  revealText: string;
  spokenRevealText: string;
  spokenAnswerText: string;
  correctAnswer: number;
  options: number[];
  planetId: PlanetId;
  difficultyTier: QuestionDifficulty;
}

export interface QuestionOutcome {
  id: string;
  questionId: string;
  familyId: string;
  status: SpeedClass;
  responseTimeMs: number;
  selectedAnswer: number | null;
  streakBefore: number;
  streakAfter: number;
  damageDealt: number;
  shieldLost: number;
  revealText?: string;
}

export interface FactMastery {
  familyId: string;
  confidence: number;
  lastSpeedClass: SpeedClass | null;
  mistakes: number;
  slowCount: number;
  seenCount: number;
  nextPriority: number;
}

export interface SessionStats {
  destroyed: number;
  wrong: number;
  timedOut: number;
  instant: number;
  bestStreak: number;
  difficultFacts: string[];
}

export interface BattleSession {
  mode: GameMode;
  planetId: PlanetId;
  waveIndex: number;
  shield: number;
  streak: number;
  weaponLevel: number;
  questions: Question[];
  currentQuestionIndex: number;
  phase: BattlePhase;
  startedAt: number;
  questionStartedAt: number;
  currentOutcome: QuestionOutcome | null;
  sessionStats: SessionStats;
}

export interface AudioSettings {
  musicOn: boolean;
  sfxOn: boolean;
  voiceOn: boolean;
}

export interface CampaignProgress {
  unlockedPlanetIndex: Record<GameMode, number>;
  completedPlanetIndex: Record<GameMode, number>;
}

export interface ResultSummary {
  success: boolean;
  planetId: PlanetId;
  mode: GameMode;
  shieldLeft: number;
  destroyed: number;
  bestStreak: number;
  difficultFacts: string[];
  encouragementText: string;
  difficultFactsTitle: string;
}
