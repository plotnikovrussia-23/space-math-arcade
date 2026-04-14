import { useEffect } from "react";
import {
  BattleScreen,
  HomeScreen,
  ModeSelectScreen,
  PlanetMapScreen,
  ResultScreen,
  SettingsModal
} from "./components/screens";
import { useGameStore } from "./store/gameStore";

export default function App() {
  const screen = useGameStore((state) => state.screen);
  const boot = useGameStore((state) => state.boot);
  const buildLabel = `v${__APP_VERSION__} · ${__APP_COMMIT__}`;

  useEffect(() => {
    boot();
  }, [boot]);

  return (
    <main className="app-shell">
      <div className="build-badge">{buildLabel}</div>
      {screen === "home" && <HomeScreen />}
      {screen === "modeSelect" && <ModeSelectScreen />}
      {screen === "planetMap" && <PlanetMapScreen />}
      {screen === "battle" && <BattleScreen />}
      {screen === "result" && <ResultScreen />}
      <SettingsModal />
    </main>
  );
}
