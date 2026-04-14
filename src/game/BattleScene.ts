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
    const supportCore = this.add.rectangle(207, scaleY(520), 28, 50, 0x1d67d5, 1);
    supportCore.setStrokeStyle(4, 0xffffff, 0.72);
    const supportBraceLeft = this.add.triangle(
      187,
      scaleY(522),
      -18,
      16,
      10,
      -20,
      12,
      20,
      0x184b9f,
      0.98
    );
    supportBraceLeft.setStrokeStyle(3, 0xaff4ff, 0.76);
    const supportBraceRight = this.add.triangle(
      227,
      scaleY(522),
      18,
      16,
      -10,
      -20,
      -12,
      20,
      0x184b9f,
      0.98
    );
    supportBraceRight.setStrokeStyle(3, 0xaff4ff, 0.76);
    const reactorHalo = this.add.circle(207, scaleY(514), 28, 0x6ae6ff, 0.18);
    const reactorBody = this.add.circle(207, scaleY(514), 14, 0x0f2f74, 0.96);
    reactorBody.setStrokeStyle(4, 0x8ff3ff, 0.9);
    const reactorCore = this.add.circle(207, scaleY(514), 7, 0xfff3b3, 0.98);
    const turretBase = this.add.ellipse(207, scaleY(486), 76, 36, 0x102b68, 1);
    turretBase.setStrokeStyle(4, 0xa9f2ff, 0.82);
    const turretBaseInner = this.add.ellipse(207, scaleY(484), 48, 22, 0x1f5dcb, 0.95);
    turretBaseInner.setStrokeStyle(3, 0xd6fdff, 0.62);
    const pivotRing = this.add.ellipse(207, scaleY(480), 28, 28, 0x90f6ff, 0.18);
    pivotRing.setStrokeStyle(4, 0xcdfcff, 0.9);
    const pivotCore = this.add.circle(207, scaleY(478), 10, 0xffdf86, 0.98);
    pivotCore.setStrokeStyle(2, 0xffffff, 0.82);
    const sideEngineLeft = this.add.rectangle(169, scaleY(486), 18, 30, 0x1b4599, 0.98);
    sideEngineLeft.setStrokeStyle(3, 0x9beeff, 0.82);
    const sideEngineRight = this.add.rectangle(245, scaleY(486), 18, 30, 0x1b4599, 0.98);
    sideEngineRight.setStrokeStyle(3, 0x9beeff, 0.82);
    const engineGlowLeft = this.add.ellipse(169, scaleY(499), 12, 10, 0x81f2ff, 0.55);
    const engineGlowRight = this.add.ellipse(245, scaleY(499), 12, 10, 0x81f2ff, 0.55);
    const cannonHousingLeft = this.add.triangle(
      187,
      scaleY(448),
      -18,
      24,
      4,
      -34,
      14,
      28,
      0x153782,
      0.98
    );
    cannonHousingLeft.setStrokeStyle(3, 0xb8f7ff, 0.78);
    const cannonHousingRight = this.add.triangle(
      227,
      scaleY(448),
      18,
      24,
      -4,
      -34,
      -14,
      28,
      0x153782,
      0.98
    );
    cannonHousingRight.setStrokeStyle(3, 0xb8f7ff, 0.78);
    const cannonBody = this.add.rectangle(207, scaleY(450), 30, 84, 0x1bb8ff, 0.98);
    cannonBody.setStrokeStyle(4, 0xf0ffff, 0.88);
    const cannonSpine = this.add.rectangle(207, scaleY(448), 10, 92, 0xe8ffff, 0.48);
    const coilTop = this.add.ellipse(207, scaleY(420), 44, 12, 0xc8fbff, 0.86);
    coilTop.setStrokeStyle(2, 0xffffff, 0.72);
    const coilMid = this.add.ellipse(207, scaleY(446), 52, 14, 0x78efff, 0.62);
    coilMid.setStrokeStyle(2, 0xe1ffff, 0.64);
    const coilBottom = this.add.ellipse(207, scaleY(472), 56, 14, 0x52d8ff, 0.46);
    coilBottom.setStrokeStyle(2, 0xd7feff, 0.54);
    const cannonRailLeft = this.add.rectangle(194, scaleY(436), 8, 74, 0x0c2b67, 0.98);
    cannonRailLeft.setStrokeStyle(2, 0xa9eeff, 0.7);
    const cannonRailRight = this.add.rectangle(220, scaleY(436), 8, 74, 0x0c2b67, 0.98);
    cannonRailRight.setStrokeStyle(2, 0xa9eeff, 0.7);
    const muzzleShell = this.add.ellipse(207, scaleY(396), 44, 30, 0x081f58, 1);
    muzzleShell.setStrokeStyle(4, 0xe2ffff, 0.84);
    const muzzleHalo = this.add.ellipse(207, scaleY(392), 62, 38, 0x89f8ff, 0.24);
    const muzzleCore = this.add.ellipse(207, scaleY(394), 20, 12, 0xfff2a0, 0.98);
    muzzleCore.setStrokeStyle(2, 0xffffff, 0.9);
    const muzzleBladeLeft = this.add.triangle(
      182,
      scaleY(398),
      -16,
      8,
      10,
      -16,
      10,
      18,
      0x225fd1,
      0.96
    );
    muzzleBladeLeft.setStrokeStyle(2, 0xd6feff, 0.7);
    const muzzleBladeRight = this.add.triangle(
      232,
      scaleY(398),
      16,
      8,
      -10,
      -16,
      -10,
      18,
      0x225fd1,
      0.96
    );
    muzzleBladeRight.setStrokeStyle(2, 0xd6feff, 0.7);
    const core = this.add.circle(207, scaleY(516), 9, 0xfff7bf, 0.98);
    const coreHalo = this.add.circle(207, scaleY(516), 18, 0x7ce6ff, 0.22);

    this.station = this.add.container(0, 0, [
      glow,
      shadow,
      platform,
      wingLeft,
      wingRight,
      coreHalo,
      supportBraceLeft,
      supportBraceRight,
      supportCore,
      reactorHalo,
      reactorBody,
      turretBase,
      turretBaseInner,
      sideEngineLeft,
      sideEngineRight,
      engineGlowLeft,
      engineGlowRight,
      pivotRing,
      pivotCore,
      cannonHousingLeft,
      cannonHousingRight,
      cannonBody,
      cannonSpine,
      cannonRailLeft,
      cannonRailRight,
      coilBottom,
      coilMid,
      coilTop,
      muzzleHalo,
      muzzleShell,
      muzzleCore,
      muzzleBladeLeft,
      muzzleBladeRight,
      reactorCore,
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

    const shadow = this.add.ellipse(0, 54, isBoss ? 68 : 52, isBoss ? 20 : 14, 0x1038a6, 0.24);
    const body = this.add.ellipse(0, 0, isBoss ? 70 : 54, isBoss ? 84 : 64, tint, 1);
    body.setStrokeStyle(4, 0x123a99, 0.95);
    const bodyGloss = this.add.ellipse(
      -(isBoss ? 13 : 10),
      -(isBoss ? 16 : 12),
      isBoss ? 24 : 18,
      isBoss ? 34 : 26,
      0xffffff,
      0.16
    );
    const bodyPanel = this.add.ellipse(0, isBoss ? -6 : -4, isBoss ? 58 : 44, isBoss ? 18 : 14, 0x0d2f7a, 0.16);
    bodyPanel.setStrokeStyle(2, 0xb7d2ff, 0.34);
    const frontBand = this.add.ellipse(0, 10, isBoss ? 56 : 42, isBoss ? 18 : 14, 0xe4eefc, 0.94);
    frontBand.setStrokeStyle(2, 0x123a99, 0.28);
    const bandBoltLeft = this.add.circle(-(isBoss ? 16 : 12), 10, isBoss ? 3.5 : 2.5, 0x2442a2, 0.96);
    const bandBoltCenter = this.add.circle(0, 10, isBoss ? 4.5 : 3.2, 0x2442a2, 0.96);
    const bandBoltRight = this.add.circle(isBoss ? 16 : 12, 10, isBoss ? 3.5 : 2.5, 0x2442a2, 0.96);
    const collar = this.add.ellipse(0, -(isBoss ? 24 : 18), isBoss ? 26 : 20, isBoss ? 10 : 8, 0x2449a4, 0.96);
    const cap = this.add.ellipse(0, -(isBoss ? 38 : 29), isBoss ? 34 : 26, isBoss ? 18 : 14, 0x566fcb, 1);
    cap.setStrokeStyle(3, 0xffffff, 0.74);
    const fuseStem = this.add.rectangle(3, -(isBoss ? 56 : 43), 6, isBoss ? 24 : 18, 0x65411d, 1);
    fuseStem.setAngle(18);
    const fuseWrap = this.add.rectangle(1, -(isBoss ? 48 : 36), isBoss ? 10 : 8, isBoss ? 8 : 6, 0xb69053, 0.96);
    fuseWrap.setAngle(20);
    const sparkA = this.add.rectangle(-(isBoss ? 10 : 8), -(isBoss ? 68 : 52), isBoss ? 5 : 4, isBoss ? 18 : 12, 0xfff1a1, 1);
    sparkA.setAngle(-35);
    const sparkB = this.add.rectangle(isBoss ? 3 : 2, -(isBoss ? 68 : 52), isBoss ? 5 : 4, isBoss ? 20 : 14, 0xffa65e, 1);
    sparkB.setAngle(18);
    const sparkC = this.add.rectangle(isBoss ? 12 : 9, -(isBoss ? 66 : 51), isBoss ? 4 : 3, isBoss ? 16 : 12, 0xffd36d, 1);
    sparkC.setAngle(52);
    const sparkCore = this.add.circle(isBoss ? 10 : 7, -(isBoss ? 66 : 50), isBoss ? 6 : 4.5, 0xff6f4a, 0.98);
    const sparkHalo = this.add.circle(isBoss ? 10 : 7, -(isBoss ? 66 : 50), isBoss ? 14 : 10, 0xffb069, 0.22);
    const finLeft = this.add.triangle(
      -(isBoss ? 34 : 26),
      isBoss ? 24 : 18,
      -4,
      -18,
      -24,
      0,
      -2,
      24,
      0xe1ecff,
      0.92
    );
    finLeft.setStrokeStyle(2, 0x123a99, 0.52);
    const finRight = this.add.triangle(
      isBoss ? 34 : 26,
      isBoss ? 24 : 18,
      4,
      -18,
      24,
      0,
      2,
      24,
      0xe1ecff,
      0.92
    );
    finRight.setStrokeStyle(2, 0x123a99, 0.52);
    const tailFin = this.add.triangle(
      0,
      isBoss ? 38 : 30,
      0,
      -8,
      -(isBoss ? 12 : 9),
      20,
      isBoss ? 12 : 9,
      20,
      0xd9f5ff,
      0.94
    );
    tailFin.setStrokeStyle(2, 0x123a99, 0.56);
    const finLeftInner = this.add.triangle(
      -(isBoss ? 29 : 22),
      isBoss ? 22 : 16,
      -2,
      -12,
      -14,
      0,
      -1,
      14,
      0x7cc8ff,
      0.72
    );
    const finRightInner = this.add.triangle(
      isBoss ? 29 : 22,
      isBoss ? 22 : 16,
      2,
      -12,
      14,
      0,
      1,
      14,
      0x7cc8ff,
      0.72
    );
    const tailCap = this.add.ellipse(0, isBoss ? 42 : 32, isBoss ? 24 : 18, isBoss ? 14 : 11, 0x1c348c, 0.96);
    const tailBolt = this.add.circle(0, isBoss ? 42 : 32, isBoss ? 4 : 3, 0xffd76c, 0.94);

    this.enemy = this.add.container(207, -80, [
      shadow,
      body,
      bodyGloss,
      bodyPanel,
      frontBand,
      bandBoltLeft,
      bandBoltCenter,
      bandBoltRight,
      collar,
      cap,
      fuseStem,
      fuseWrap,
      sparkHalo,
      sparkA,
      sparkB,
      sparkC,
      sparkCore,
      finLeft,
      finRight,
      tailFin,
      finLeftInner,
      finRightInner,
      tailCap,
      tailBolt,
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
