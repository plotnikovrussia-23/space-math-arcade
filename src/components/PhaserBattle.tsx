import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BattleScene } from "../game/BattleScene";
import { useGameStore } from "../store/gameStore";
import { QUESTION_TIME_LIMIT_MS } from "../domain/session";

export function PhaserBattle() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<BattleScene | null>(null);
  const lastQuestionIdRef = useRef("");
  const lastOutcomeIdRef = useRef("");
  const battle = useGameStore((state) => state.battle);
  const responseWindowLevel = useGameStore((state) => state.responseWindowLevel);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    const scene = new BattleScene();
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 414,
      height: 560,
      parent: containerRef.current,
      transparent: true,
      backgroundColor: "#00000000",
      scene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !battle) {
      return;
    }

    const question = battle.questions[battle.currentQuestionIndex];

    if (question && question.id !== lastQuestionIdRef.current) {
      lastQuestionIdRef.current = question.id;
      sceneRef.current.presentQuestion({
        questionId: question.id,
        questionIndex: battle.currentQuestionIndex,
        totalQuestions: battle.questions.length,
        planetId: battle.planetId,
        weaponLevel: battle.weaponLevel,
        timeLimitMs: QUESTION_TIME_LIMIT_MS(
          battle.planetId,
          responseWindowLevel
        ),
        isBoss: question.difficultyTier === "boss"
      });
    }

    if (
      battle.currentOutcome &&
      battle.currentOutcome.id !== lastOutcomeIdRef.current
    ) {
      lastOutcomeIdRef.current = battle.currentOutcome.id;
      sceneRef.current.resolveOutcome(battle.currentOutcome);
    }
  }, [battle, responseWindowLevel]);

  return <div className="battle-canvas" ref={containerRef} />;
}
