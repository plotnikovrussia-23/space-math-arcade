import Phaser from "phaser";
import { PLANET_BY_ID } from "../config/planets";
import type { PlanetId, QuestionOutcome } from "../types";

const SCENE_WIDTH = 414;
const SCENE_HEIGHT = 500;
const BASE_SCENE_HEIGHT = 620;
const scaleY = (value: number) => (value / BASE_SCENE_HEIGHT) * SCENE_HEIGHT;

export interface SceneQuestionPayload {
  questionId: string;
  questionIndex: number;
  totalQuestions: number;
  planetId: PlanetId;
  weaponLevel: number;
  timeLimitMs: number;
  isBoss: boolean;
}

export class BattleScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Graphics;
  private station!: Phaser.GameObjects.Container;
  private enemy!: Phaser.GameObjects.Arc;
  private enemyHalo!: Phaser.GameObjects.Arc;
  private enemyCore!: Phaser.GameObjects.Arc;
  private enemyEye!: Phaser.GameObjects.Arc;
  private enemyPupil!: Phaser.GameObjects.Arc;
  private beam!: Phaser.GameObjects.Graphics;
  private stars: Phaser.GameObjects.Arc[] = [];
  private lastQuestionId = "";
  private weaponLevel = 0;
  private currentPlanetId: PlanetId = "earth";
  private ready = false;
  private pendingQuestion: SceneQuestionPayload | null = null;
  private pendingOutcome: QuestionOutcome | null = null;
  private enemyApproachActive = false;
  private enemyApproachStartTime = 0;
  private enemyApproachDuration = 1;
  private enemyStartX = 207;
  private enemyStartY = -80;
  private enemyTargetX = 207;
  private enemyTargetY = scaleY(470);

  constructor() {
    super("BattleScene");
  }

  create() {
    this.background = this.add.graphics();
    this.beam = this.add.graphics();

    this.drawBackground("earth");
    this.createStars();
    this.createStation();
    this.createEnemy(false);
    this.ready = true;

    if (this.pendingQuestion) {
      const payload = this.pendingQuestion;
      this.pendingQuestion = null;
      this.presentQuestion(payload);
    }

    if (this.pendingOutcome) {
      const outcome = this.pendingOutcome;
      this.pendingOutcome = null;
      this.resolveOutcome(outcome);
    }
  }

  private createStars() {
    this.stars.forEach((star) => star.destroy());
    this.stars = [];

    for (let index = 0; index < 24; index += 1) {
      const star = this.add.circle(
        Phaser.Math.Between(24, 390),
        Phaser.Math.Between(20, Math.round(scaleY(580))),
        Phaser.Math.Between(1, 3),
        0xffffff,
        0.7
      );
      this.stars.push(star);
      this.tweens.add({
        targets: star,
        alpha: 0.2,
        duration: Phaser.Math.Between(1200, 2600),
        yoyo: true,
        repeat: -1
      });
    }
  }

  private createStation() {
    const glow = this.add.ellipse(207, scaleY(542), 132, 84, 0x59d6ff, 0.12);
    const platform = this.add.rectangle(207, scaleY(556), 138, 26, 0xe8f7ff, 0.96);
    platform.setStrokeStyle(4, 0x92dfff, 0.9);
    const shadow = this.add.ellipse(207, scaleY(566), 114, 18, 0x7ab9ff, 0.18);
    const wingLeft = this.add.triangle(
      170,
      scaleY(548),
      -26,
      0,
      10,
      -14,
      10,
      14,
      0x31a9ff,
      0.92
    );
    wingLeft.setStrokeStyle(3, 0xffffff, 0.65);
    const wingRight = this.add.triangle(
      244,
      scaleY(548),
      26,
      0,
      -10,
      -14,
      -10,
      14,
      0x31a9ff,
      0.92
    );
    wingRight.setStrokeStyle(3, 0xffffff, 0.65);
    const column = this.add.rectangle(207, scaleY(522), 24, 54, 0x2b8cff, 1);
    column.setStrokeStyle(4, 0xffffff, 0.72);
    const cannonBase = this.add.rectangle(207, scaleY(488), 46, 20, 0x163b9f, 1);
    cannonBase.setStrokeStyle(3, 0x8ee6ff, 0.9);
    const cannon = this.add.rectangle(207, scaleY(462), 16, 52, 0x2fe1ff, 1);
    cannon.setStrokeStyle(4, 0xffffff, 0.92);
    const muzzle = this.add.rectangle(207, scaleY(440), 28, 12, 0xfff6a0, 0.98);
    muzzle.setStrokeStyle(2, 0xffffff, 0.92);
    const core = this.add.circle(207, scaleY(520), 10, 0xfff7bf, 0.98);
    const coreHalo = this.add.circle(207, scaleY(520), 22, 0x7ce6ff, 0.22);

    this.station = this.add.container(0, 0, [
      glow,
      shadow,
      platform,
      wingLeft,
      wingRight,
      coreHalo,
      column,
      cannonBase,
      cannon,
      muzzle,
      core
    ]);
  }

  private createEnemy(isBoss: boolean) {
    if (this.enemy) {
      this.enemy.destroy();
      this.enemyHalo.destroy();
      this.enemyCore.destroy();
      this.enemyEye.destroy();
      this.enemyPupil.destroy();
    }

    const tint = PLANET_BY_ID[this.currentPlanetId].enemyTint;
    this.enemyHalo = this.add.circle(207, -80, isBoss ? 62 : 48, tint, 0.2);
    this.enemy = this.add.circle(207, -80, isBoss ? 42 : 32, tint, 1);
    this.enemy.setStrokeStyle(7, 0x1038a6, 0.95);
    this.enemyCore = this.add.circle(207, -80, isBoss ? 18 : 12, 0xffffff, 0.92);
    this.enemyEye = this.add.circle(207, -80, isBoss ? 10 : 7, 0xff5577, 0.95);
    this.enemyPupil = this.add.circle(207, -80, isBoss ? 4 : 3, 0xffffff, 0.92);

    this.enemyHalo.setDepth(3);
    this.enemy.setDepth(4);
    this.enemyCore.setDepth(5);
    this.enemyEye.setDepth(6);
    this.enemyPupil.setDepth(7);
  }

  private drawBackground(planetId: PlanetId) {
    this.currentPlanetId = planetId;
    const planet = PLANET_BY_ID[planetId];
    const [top, bottom] = planet.background;
    this.background.clear();

    this.background.fillGradientStyle(
      Phaser.Display.Color.HexStringToColor(top).color,
      Phaser.Display.Color.HexStringToColor(top).color,
      Phaser.Display.Color.HexStringToColor(bottom).color,
      Phaser.Display.Color.HexStringToColor(bottom).color,
      1
    );
    this.background.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    this.background.fillStyle(0xffffff, 0.18);
    this.background.fillCircle(332, 88, 70);
    this.background.fillStyle(0xffffff, 0.12);
    this.background.fillCircle(82, scaleY(120), 50);
  }

  presentQuestion(payload: SceneQuestionPayload) {
    if (!this.ready) {
      this.pendingQuestion = payload;
      return;
    }

    this.lastQuestionId = payload.questionId;
    this.weaponLevel = payload.weaponLevel;
    this.drawBackground(payload.planetId);
    this.createEnemy(payload.isBoss);

    this.enemyStartX = Phaser.Math.Between(120, 294);
    this.enemyStartY = scaleY(112);
    this.enemyTargetX = 207;
    this.enemyTargetY = scaleY(450);
    this.enemyApproachStartTime = this.time.now;
    this.enemyApproachDuration = payload.timeLimitMs;
    this.enemyApproachActive = true;

    this.setEnemyTransform(
      this.enemyStartX,
      this.enemyStartY,
      payload.isBoss ? 1.12 : 1,
      1
    );

    this.tweens.add({
      targets: this.station.list,
      scale: 1 + payload.weaponLevel * 0.06,
      duration: 280
    });
  }

  resolveOutcome(outcome: QuestionOutcome) {
    if (!this.ready) {
      this.pendingOutcome = outcome;
      return;
    }

    if (!this.enemy || outcome.questionId !== this.lastQuestionId) {
      return;
    }

    this.enemyApproachActive = false;
    this.beam.clear();

    if (outcome.status === "wrong" || outcome.status === "timeout") {
      this.playDamageAnimation();
      return;
    }

    const beamColor =
      this.weaponLevel >= 3
        ? 0xfff06e
        : this.weaponLevel >= 2
          ? 0x80f4ff
          : this.weaponLevel >= 1
            ? 0x7ee1ff
            : 0xffffff;

    this.beam.lineStyle(10 + this.weaponLevel * 4, beamColor, 0.95);
    this.beam.beginPath();
    this.beam.moveTo(207, scaleY(496));
    this.beam.lineTo(this.enemy.x, this.enemy.y);
    this.beam.strokePath();

    this.cameras.main.flash(100, 255, 255, 255, true);
    this.time.delayedCall(80, () => {
      this.beam.clear();
    });

    this.tweens.add({
      targets: [
        this.enemyHalo,
        this.enemy,
        this.enemyCore,
        this.enemyEye,
        this.enemyPupil
      ],
      scale: 1.4,
      alpha: 0,
      duration: 280,
      onComplete: () => {
        const burst = this.add.circle(this.enemy.x, this.enemy.y, 12, 0xffffff, 0.95);
        this.tweens.add({
          targets: burst,
          scale: 6,
          alpha: 0,
          duration: 360,
          onComplete: () => burst.destroy()
        });
      }
    });
  }

  private playDamageAnimation() {
    this.enemyApproachActive = false;
    this.tweens.killTweensOf([
      this.enemyHalo,
      this.enemy,
      this.enemyCore,
      this.enemyEye,
      this.enemyPupil
    ]);
    this.tweens.add({
      targets: [
        this.enemyHalo,
        this.enemy,
        this.enemyCore,
        this.enemyEye,
        this.enemyPupil
      ],
      x: 207,
      y: scaleY(506),
      duration: 220,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.cameras.main.shake(260, 0.012);
        this.cameras.main.flash(180, 255, 96, 96, true);
        const impact = this.add.circle(207, scaleY(520), 26, 0xff6f6f, 0.45);
        this.tweens.add({
          targets: impact,
          scale: 4,
          alpha: 0,
          duration: 300,
          onComplete: () => impact.destroy()
        });
      }
    });
  }

  update(time: number) {
    if (!this.enemy || !this.enemyApproachActive) {
      return;
    }

    const rawProgress =
      (time - this.enemyApproachStartTime) / Math.max(this.enemyApproachDuration, 1);
    const progress = Phaser.Math.Clamp(rawProgress, 0, 1);
    const eased = progress * progress;
    const x = Phaser.Math.Linear(this.enemyStartX, this.enemyTargetX, progress);
    const y = Phaser.Math.Linear(this.enemyStartY, this.enemyTargetY, eased);
    const alpha = 1 - progress * 0.04;

    this.setEnemyTransform(x, y, this.enemy.scaleX, alpha);
    this.enemyHalo.setScale(1.18 + Math.sin(time / 180) * 0.06);
    this.enemyHalo.setAlpha(0.18 + Math.sin(time / 220) * 0.04);

    if (progress >= 1) {
      this.enemyApproachActive = false;
    }
  }

  private setEnemyTransform(x: number, y: number, scale: number, alpha: number) {
    this.enemyHalo.setPosition(x, y);
    this.enemy.setPosition(x, y);
    this.enemyCore.setPosition(x, y);
    this.enemyEye.setPosition(x, y);
    this.enemyPupil.setPosition(x, y);

    this.enemyHalo.setScale(scale * 1.12);
    this.enemy.setScale(scale);
    this.enemyCore.setScale(scale);
    this.enemyEye.setScale(scale);
    this.enemyPupil.setScale(scale);

    this.enemyHalo.setAlpha(alpha * 0.22);
    this.enemy.setAlpha(alpha);
    this.enemyCore.setAlpha(alpha);
    this.enemyEye.setAlpha(alpha);
    this.enemyPupil.setAlpha(alpha);
  }
}
