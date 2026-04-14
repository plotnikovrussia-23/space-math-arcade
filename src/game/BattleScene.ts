import Phaser from "phaser";
import { PLANET_BY_ID } from "../config/planets";
import type { PlanetId, QuestionOutcome } from "../types";

const SCENE_WIDTH = 414;
const SCENE_HEIGHT = 560;
const BASE_SCENE_HEIGHT = 620;
const SCENE_COMPACT_SCALE = 0.96;
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
  private enemy!: Phaser.GameObjects.Container;
  private enemyHalo!: Phaser.GameObjects.Ellipse;
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
  private enemyTargetY = scaleY(410);

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
    const glow = this.add.ellipse(207, scaleY(536), 116, 70, 0x59d6ff, 0.12);
    const platform = this.add.rectangle(207, scaleY(548), 118, 22, 0xe8f7ff, 0.96);
    platform.setStrokeStyle(4, 0x92dfff, 0.9);
    const shadow = this.add.ellipse(207, scaleY(556), 98, 16, 0x7ab9ff, 0.18);
    const wingLeft = this.add.triangle(
      176,
      scaleY(541),
      -20,
      0,
      8,
      -11,
      8,
      11,
      0x31a9ff,
      0.92
    );
    wingLeft.setStrokeStyle(3, 0xffffff, 0.65);
    const wingRight = this.add.triangle(
      238,
      scaleY(541),
      20,
      0,
      -8,
      -11,
      -8,
      11,
      0x31a9ff,
      0.92
    );
    wingRight.setStrokeStyle(3, 0xffffff, 0.65);
    const column = this.add.rectangle(207, scaleY(516), 22, 44, 0x2b8cff, 1);
    column.setStrokeStyle(4, 0xffffff, 0.72);
    const cannonBase = this.add.rectangle(207, scaleY(480), 36, 16, 0x163b9f, 1);
    cannonBase.setStrokeStyle(3, 0x8ee6ff, 0.9);
    const cannon = this.add.rectangle(207, scaleY(458), 14, 42, 0x2fe1ff, 1);
    cannon.setStrokeStyle(4, 0xffffff, 0.92);
    const muzzle = this.add.rectangle(207, scaleY(440), 22, 10, 0xfff6a0, 0.98);
    muzzle.setStrokeStyle(2, 0xffffff, 0.92);
    const core = this.add.circle(207, scaleY(516), 9, 0xfff7bf, 0.98);
    const coreHalo = this.add.circle(207, scaleY(516), 18, 0x7ce6ff, 0.22);

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
    }

    const tint = PLANET_BY_ID[this.currentPlanetId].enemyTint;
    this.enemyHalo = this.add.ellipse(207, -80, isBoss ? 74 : 58, isBoss ? 32 : 24, 0x1038a6, 0.2);

    const shadow = this.add.ellipse(0, 42, isBoss ? 54 : 42, isBoss ? 16 : 12, 0x1038a6, 0.24);
    const body = this.add.circle(0, 0, isBoss ? 29 : 23, tint, 1);
    body.setStrokeStyle(4, 0x123a99, 0.95);
    const bodyGloss = this.add.circle(-(isBoss ? 8 : 6), -(isBoss ? 8 : 6), isBoss ? 9 : 7, 0xffffff, 0.22);
    const band = this.add.rectangle(0, 3, isBoss ? 40 : 32, 10, 0xffd76c, 1);
    band.setStrokeStyle(2, 0x123a99, 0.18);
    const fuseCap = this.add.rectangle(0, -(isBoss ? 28 : 22), isBoss ? 18 : 14, 10, 0x73e8ff, 1);
    fuseCap.setStrokeStyle(3, 0xffffff, 0.74);
    const fuseLeft = this.add.rectangle(-(isBoss ? 7 : 5), -(isBoss ? 35 : 28), 4, isBoss ? 16 : 12, 0x73e8ff, 1);
    fuseLeft.setAngle(-18);
    const fuseRight = this.add.rectangle(isBoss ? 7 : 5, -(isBoss ? 35 : 28), 4, isBoss ? 16 : 12, 0x73e8ff, 1);
    fuseRight.setAngle(18);
    const spark = this.add.circle(0, -(isBoss ? 43 : 34), isBoss ? 6 : 5, 0xfff1a1, 0.98);
    spark.setStrokeStyle(2, 0xffffff, 0.92);
    const sparkCore = this.add.circle(0, -(isBoss ? 43 : 34), isBoss ? 3 : 2.5, 0xff7a59, 0.96);
    const nose = this.add.triangle(
      0,
      isBoss ? 31 : 25,
      0,
      18,
      -(isBoss ? 14 : 11),
      -4,
      isBoss ? 14 : 11,
      -4,
      0xff4d7e,
      1
    );
    nose.setStrokeStyle(4, 0x123a99, 0.95);

    this.enemy = this.add.container(207, -80, [
      shadow,
      body,
      bodyGloss,
      band,
      fuseCap,
      fuseLeft,
      fuseRight,
      spark,
      sparkCore,
      nose,
    ]);

    this.enemyHalo.setDepth(3);
    this.enemy.setDepth(4);
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
    this.enemyStartY = scaleY(96);
    this.enemyTargetX = 207;
    this.enemyTargetY = scaleY(398);
    this.enemyApproachStartTime = this.time.now;
    this.enemyApproachDuration = payload.timeLimitMs;
    this.enemyApproachActive = true;

    this.setEnemyTransform(
      this.enemyStartX,
      this.enemyStartY,
      (payload.isBoss ? 1.08 : 0.94) * SCENE_COMPACT_SCALE,
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
    this.beam.moveTo(207, scaleY(474));
    this.beam.lineTo(this.enemy.x, this.enemy.y);
    this.beam.strokePath();

    this.cameras.main.flash(100, 255, 255, 255, true);
    this.time.delayedCall(80, () => {
      this.beam.clear();
    });

    this.tweens.add({
      targets: [this.enemyHalo, this.enemy],
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
      this.enemy
    ]);
    this.tweens.add({
      targets: [this.enemyHalo, this.enemy],
      x: 207,
      y: scaleY(456),
      duration: 220,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.cameras.main.shake(260, 0.012);
        this.cameras.main.flash(180, 255, 96, 96, true);
        const impact = this.add.circle(207, scaleY(474), 22, 0xff6f6f, 0.45);
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

    this.enemyHalo.setScale(scale * 1.08);
    this.enemy.setScale(scale);

    this.enemyHalo.setAlpha(alpha * 0.22);
    this.enemy.setAlpha(alpha);
  }
}
