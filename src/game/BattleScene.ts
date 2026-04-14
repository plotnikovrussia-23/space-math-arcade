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
    const baseSkirt = this.add.ellipse(207, scaleY(500), 60, 30, 0x14357f, 0.96);
    baseSkirt.setStrokeStyle(4, 0x8fe8ff, 0.72);
    const cannonMount = this.add.ellipse(207, scaleY(484), 48, 28, 0x204fb0, 1);
    cannonMount.setStrokeStyle(4, 0xa9f2ff, 0.88);
    const energyRing = this.add.ellipse(207, scaleY(484), 24, 24, 0x9cf6ff, 0.2);
    energyRing.setStrokeStyle(4, 0xc8fbff, 0.88);
    const cannonJoint = this.add.circle(207, scaleY(476), 9, 0xffd97d, 0.98);
    cannonJoint.setStrokeStyle(2, 0xffffff, 0.82);
    const sidePodLeft = this.add.ellipse(189, scaleY(486), 14, 28, 0x23489d, 0.98);
    sidePodLeft.setStrokeStyle(2, 0xa3ebff, 0.84);
    const sidePodRight = this.add.ellipse(225, scaleY(486), 14, 28, 0x23489d, 0.98);
    sidePodRight.setStrokeStyle(2, 0xa3ebff, 0.84);
    const sideFinLeft = this.add.triangle(
      191,
      scaleY(468),
      -10,
      12,
      2,
      -10,
      8,
      16,
      0x5fcfff,
      0.78
    );
    sideFinLeft.setStrokeStyle(2, 0xe9ffff, 0.54);
    const sideFinRight = this.add.triangle(
      223,
      scaleY(468),
      10,
      12,
      -2,
      -10,
      -8,
      16,
      0x5fcfff,
      0.78
    );
    sideFinRight.setStrokeStyle(2, 0xe9ffff, 0.54);
    const barrelCore = this.add.ellipse(207, scaleY(454), 20, 68, 0x1ca6ff, 0.98);
    barrelCore.setStrokeStyle(4, 0xe8ffff, 0.84);
    const barrelShellLeft = this.add.triangle(
      198,
      scaleY(454),
      -12,
      12,
      -4,
      -24,
      2,
      26,
      0x123f95,
      0.98
    );
    barrelShellLeft.setStrokeStyle(2, 0xaef4ff, 0.82);
    const barrelShellRight = this.add.triangle(
      216,
      scaleY(454),
      12,
      12,
      4,
      -24,
      -2,
      26,
      0x123f95,
      0.98
    );
    barrelShellRight.setStrokeStyle(2, 0xaef4ff, 0.82);
    const barrelBandTop = this.add.ellipse(207, scaleY(440), 26, 10, 0xd5fbff, 0.85);
    barrelBandTop.setStrokeStyle(2, 0xffffff, 0.72);
    const barrelBandMid = this.add.ellipse(207, scaleY(458), 30, 10, 0x78efff, 0.55);
    barrelBandMid.setStrokeStyle(2, 0xd9ffff, 0.58);
    const muzzleBody = this.add.ellipse(207, scaleY(421), 30, 20, 0x0e2d77, 1);
    muzzleBody.setStrokeStyle(3, 0xffffff, 0.82);
    const muzzleEmitter = this.add.ellipse(207, scaleY(419), 18, 10, 0xfff3a2, 0.98);
    muzzleEmitter.setStrokeStyle(2, 0xffffff, 0.86);
    const muzzleGlow = this.add.ellipse(207, scaleY(414), 38, 22, 0x8cf7ff, 0.28);
    const muzzleSpikeLeft = this.add.triangle(
      196,
      scaleY(420),
      -12,
      3,
      2,
      -10,
      4,
      12,
      0x1e5dca,
      0.96
    );
    muzzleSpikeLeft.setStrokeStyle(2, 0xcafcff, 0.7);
    const muzzleSpikeRight = this.add.triangle(
      218,
      scaleY(420),
      12,
      3,
      -2,
      -10,
      -4,
      12,
      0x1e5dca,
      0.96
    );
    muzzleSpikeRight.setStrokeStyle(2, 0xcafcff, 0.7);
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
      baseSkirt,
      sidePodLeft,
      sidePodRight,
      sideFinLeft,
      sideFinRight,
      cannonMount,
      energyRing,
      cannonJoint,
      barrelShellLeft,
      barrelShellRight,
      barrelCore,
      barrelBandTop,
      barrelBandMid,
      muzzleBody,
      muzzleGlow,
      muzzleEmitter,
      muzzleSpikeLeft,
      muzzleSpikeRight,
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

    const shadow = this.add.ellipse(0, 46, isBoss ? 58 : 46, isBoss ? 18 : 13, 0x1038a6, 0.24);
    const body = this.add.ellipse(0, 4, isBoss ? 60 : 46, isBoss ? 68 : 54, tint, 1);
    body.setStrokeStyle(4, 0x123a99, 0.95);
    const bodyGloss = this.add.ellipse(
      -(isBoss ? 9 : 7),
      -(isBoss ? 10 : 8),
      isBoss ? 20 : 15,
      isBoss ? 26 : 20,
      0xffffff,
      0.18
    );
    const seam = this.add.ellipse(0, isBoss ? -2 : -1, isBoss ? 50 : 38, isBoss ? 12 : 10, 0x0d2f7a, 0.18);
    seam.setStrokeStyle(2, 0xb7d2ff, 0.4);
    const band = this.add.ellipse(0, 6, isBoss ? 46 : 34, isBoss ? 16 : 12, 0xe4eefc, 0.94);
    band.setStrokeStyle(2, 0x123a99, 0.28);
    const bandBoltLeft = this.add.circle(-(isBoss ? 12 : 9), 6, isBoss ? 3 : 2.5, 0x2442a2, 0.96);
    const bandBoltCenter = this.add.circle(0, 6, isBoss ? 4 : 3, 0x2442a2, 0.96);
    const bandBoltRight = this.add.circle(isBoss ? 12 : 9, 6, isBoss ? 3 : 2.5, 0x2442a2, 0.96);
    const cap = this.add.ellipse(0, -(isBoss ? 28 : 22), isBoss ? 24 : 18, isBoss ? 16 : 12, 0x566fcb, 1);
    cap.setStrokeStyle(3, 0xffffff, 0.74);
    const neck = this.add.ellipse(0, -(isBoss ? 19 : 15), isBoss ? 18 : 14, isBoss ? 8 : 6, 0x294ca8, 0.92);
    const fuseStem = this.add.rectangle(0, -(isBoss ? 40 : 31), 5, isBoss ? 16 : 12, 0x65411d, 1);
    fuseStem.setAngle(10);
    const fuseWrap = this.add.rectangle(1, -(isBoss ? 34 : 27), isBoss ? 8 : 6, isBoss ? 6 : 4, 0xb69053, 0.96);
    fuseWrap.setAngle(14);
    const sparkA = this.add.rectangle(-(isBoss ? 9 : 7), -(isBoss ? 50 : 39), isBoss ? 4 : 3, isBoss ? 14 : 10, 0xfff1a1, 1);
    sparkA.setAngle(-35);
    const sparkB = this.add.rectangle(isBoss ? 2 : 1, -(isBoss ? 50 : 39), isBoss ? 4 : 3, isBoss ? 16 : 11, 0xffa65e, 1);
    sparkB.setAngle(18);
    const sparkCore = this.add.circle(isBoss ? 8 : 6, -(isBoss ? 48 : 38), isBoss ? 5 : 4, 0xff6f4a, 0.98);
    const sparkHalo = this.add.circle(isBoss ? 8 : 6, -(isBoss ? 48 : 38), isBoss ? 10 : 8, 0xffb069, 0.18);
    const finLeft = this.add.triangle(
      -(isBoss ? 26 : 20),
      isBoss ? 16 : 13,
      -4,
      -12,
      -20,
      0,
      -2,
      16,
      0xe1ecff,
      0.92
    );
    finLeft.setStrokeStyle(2, 0x123a99, 0.52);
    const finRight = this.add.triangle(
      isBoss ? 26 : 20,
      isBoss ? 16 : 13,
      4,
      -12,
      20,
      0,
      2,
      16,
      0xe1ecff,
      0.92
    );
    finRight.setStrokeStyle(2, 0x123a99, 0.52);
    const finLeftInner = this.add.triangle(
      -(isBoss ? 23 : 18),
      isBoss ? 14 : 12,
      -2,
      -8,
      -12,
      0,
      -1,
      10,
      0x7cc8ff,
      0.72
    );
    const finRightInner = this.add.triangle(
      isBoss ? 23 : 18,
      isBoss ? 14 : 12,
      2,
      -8,
      12,
      0,
      1,
      10,
      0x7cc8ff,
      0.72
    );
    const bottomCap = this.add.ellipse(0, isBoss ? 30 : 24, isBoss ? 20 : 15, isBoss ? 13 : 10, 0x1c348c, 0.96);
    const bottomBolt = this.add.circle(0, isBoss ? 30 : 24, isBoss ? 4 : 3, 0xffd76c, 0.94);

    this.enemy = this.add.container(207, -80, [
      shadow,
      body,
      bodyGloss,
      seam,
      band,
      bandBoltLeft,
      bandBoltCenter,
      bandBoltRight,
      cap,
      neck,
      fuseStem,
      fuseWrap,
      sparkHalo,
      sparkA,
      sparkB,
      sparkCore,
      finLeft,
      finRight,
      finLeftInner,
      finRightInner,
      bottomCap,
      bottomBolt,
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

    this.playSuccessAnimation();
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

  private playSuccessAnimation() {
    const successFlash = this.add.circle(this.enemy.x, this.enemy.y, 16, 0x7dff9d, 0.42);
    const successRing = this.add.circle(this.enemy.x, this.enemy.y, 12, 0xbaffc8, 0.95);
    successRing.setStrokeStyle(4, 0xd9ffe3, 0.95);
    successRing.setFillStyle(0x7dff9d, 0.18);

    this.tweens.add({
      targets: [successFlash, successRing],
      scale: 4.6,
      alpha: 0,
      duration: 320,
      onComplete: () => {
        successFlash.destroy();
        successRing.destroy();
      }
    });

    for (let index = 0; index < 8; index += 1) {
      const sparkle = this.add.circle(this.enemy.x, this.enemy.y, 4, 0xc7ffd8, 0.96);
      const angle = Phaser.Math.DegToRad(index * 45 + Phaser.Math.Between(-10, 10));
      const distance = Phaser.Math.Between(26, 48);
      this.tweens.add({
        targets: sparkle,
        x: this.enemy.x + Math.cos(angle) * distance,
        y: this.enemy.y + Math.sin(angle) * distance - 8,
        scale: 0.2,
        alpha: 0,
        duration: 360,
        ease: "Quad.easeOut",
        onComplete: () => sparkle.destroy()
      });
    }

    this.tweens.add({
      targets: this.enemyHalo,
      scale: 1.55,
      alpha: 0,
      duration: 240
    });

    this.tweens.add({
      targets: this.enemy,
      y: this.enemy.y - 34,
      scale: this.enemy.scaleX * 0.7,
      alpha: 0,
      duration: 280,
      ease: "Quad.easeOut"
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
