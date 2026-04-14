import type { PlanetConfig, PlanetId } from "../types";

export const PLANETS: PlanetConfig[] = [
  {
    id: "earth",
    name: "Земля",
    subtitle: "Стартовая станция",
    fact: "Земля — наш космический дом и первая точка старта миссии.",
    accent: "#37d8ff",
    background: ["#dcfbff", "#7fbfff"],
    enemyTint: 0x4f9fff,
    baseSpeed: 1,
    questionTimeMs: 3700
  },
  {
    id: "orbit",
    name: "Орбита",
    subtitle: "Кольцо спутников",
    fact: "Орбита — путь, по которому спутник движется вокруг планеты.",
    accent: "#00e2b8",
    background: ["#e7f9ff", "#88dde2"],
    enemyTint: 0x23b8c5,
    baseSpeed: 1.06,
    questionTimeMs: 3620
  },
  {
    id: "moon",
    name: "Луна",
    subtitle: "Серебряная пыль",
    fact: "Луна всегда показывает Земле почти одну и ту же сторону.",
    accent: "#ffd166",
    background: ["#fff9e7", "#c0d7ff"],
    enemyTint: 0xf6bc42,
    baseSpeed: 1.12,
    questionTimeMs: 3540
  },
  {
    id: "mars",
    name: "Марс",
    subtitle: "Красный рубеж",
    fact: "Марс называют красной планетой из-за железа в грунте.",
    accent: "#ff7a59",
    background: ["#fff1ea", "#ffb38a"],
    enemyTint: 0xf56f57,
    baseSpeed: 1.18,
    questionTimeMs: 3460
  },
  {
    id: "asteroids",
    name: "Пояс астероидов",
    subtitle: "Каменный поток",
    fact: "Астероиды — это древние космические камни между орбитами планет.",
    accent: "#6b9cff",
    background: ["#edf3ff", "#92aef4"],
    enemyTint: 0x7484ff,
    baseSpeed: 1.24,
    questionTimeMs: 3380
  },
  {
    id: "saturn",
    name: "Сатурн",
    subtitle: "Кольца бури",
    fact: "Кольца Сатурна состоят из льда, пыли и камней.",
    accent: "#ffaf45",
    background: ["#fff2e4", "#ffd18a"],
    enemyTint: 0xff9640,
    baseSpeed: 1.3,
    questionTimeMs: 3300
  },
  {
    id: "blackHole",
    name: "Чёрная дыра",
    subtitle: "Зона искажений",
    fact: "Чёрная дыра так сильна, что даже свету трудно уйти от неё.",
    accent: "#8e7dff",
    background: ["#f0ebff", "#7471d5"],
    enemyTint: 0x694bdb,
    baseSpeed: 1.36,
    questionTimeMs: 3220
  },
  {
    id: "core",
    name: "Галактическое ядро",
    subtitle: "Финальный сектор",
    fact: "Ядро галактики — самое плотное и энергичное место на карте.",
    accent: "#ff4f92",
    background: ["#fff0f7", "#ff9cc1"],
    enemyTint: 0xff3f7d,
    baseSpeed: 1.44,
    questionTimeMs: 3140
  }
];

export const PLANET_BY_ID: Record<PlanetId, PlanetConfig> = PLANETS.reduce(
  (acc, planet) => {
    acc[planet.id] = planet;
    return acc;
  },
  {} as Record<PlanetId, PlanetConfig>
);

export const getPlanetIndex = (planetId: PlanetId) =>
  PLANETS.findIndex((planet) => planet.id === planetId);
