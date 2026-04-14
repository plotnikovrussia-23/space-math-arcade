import { useEffect } from "react";
import {
  BattleScreen,
  HomeScreen,
  ModeSelectScreen,
  PlanetMapScreen,
  ResultScreen,
  SettingsModal,
  WelcomeScreen
} from "./components/screens";
import { useGameStore } from "./store/gameStore";

export default function App() {
  const screen = useGameStore((state) => state.screen);
  const boot = useGameStore((state) => state.boot);

  useEffect(() => {
    boot();
  }, [boot]);

  return (
    <main className="app-shell">
      {screen === "welcome" && <WelcomeScreen />}
      {screen === "home" && <HomeScreen />}
      {screen === "modeSelect" && <ModeSelectScreen />}
      {screen === "planetMap" && <PlanetMapScreen />}
      {screen === "battle" && <BattleScreen />}
      {screen === "result" && <ResultScreen />}
      <SettingsModal />
    </main>
  );
}
