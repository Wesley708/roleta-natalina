import * as THREE from 'three';
import { SpinPhase } from '../types/wheel';

export type GnomeRole =
  | 'pusher'
  | 'rimWatcher'
  | 'groundHelper'
  | 'elderOnLog'
  | 'stumpSitter'
  | 'stumpStanding'
  | 'stumpFriend';

export interface GnomeOptions {
  role: GnomeRole;
  hasBeard?: boolean;
  seated?: boolean;
  holdsBrush?: boolean;
  hatPrimaryHex?: number;
  tunicHex?: number;
  phaseOffset?: number;
}

export interface GnomeRig {
  group: THREE.Group;
  bodyPivot: THREE.Group;
  headPivot: THREE.Group;
  hatTipPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  baseY: number;
  options: GnomeOptions;
}

export function createGnome(
  options: GnomeOptions,
  sockTex: THREE.Texture,
  isSoftwareGl: boolean
): GnomeRig {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffcaa0,
    roughness: 0.58,
    metalness: 0.02,
  });
  const rosyMat = new THREE.MeshStandardMaterial({
    color: 0xef7a6c,
    roughness: 0.52,
    emissive: 0x6e1b12,
    emissiveIntensity: 0.1,
  });
  const tunicMat = new THREE.MeshStandardMaterial({
    color: options.tunicHex ?? 0x1e6f3d,
    roughness: 0.72,
    metalness: 0.05,
  });
  const crimsonMat = new THREE.MeshStandardMaterial({
    color: options.hatPrimaryHex ?? 0xc82227,
    roughness: 0.68,
    metalness: 0.05,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x3d2012,
    roughness: 0.52,
    metalness: 0.1,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf5ca65,
    roughness: 0.25,
    metalness: 0.88,
  });
  const sockMat = new THREE.MeshStandardMaterial({
    map: sockTex,
    roughness: 0.72,
  });
  const fleeceMat = new THREE.MeshStandardMaterial({
    color: 0xfcf8f2,
    roughness: 0.88,
  });
  const eyeDarkMat = new THREE.MeshStandardMaterial({
    color: 0x160f09,
    roughness: 0.15,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: options.hasBeard ? 0xfbf8f3 : 0x7a3e1b,
    roughness: 0.82,
  });

  // Legs (Striped Stockings + Curled Elf Boots with Jingle Bells)
  const leftLegPivot = new THREE.Group();
  const rightLegPivot = new THREE.Group();
  const hipY = options.seated ? 0.36 : 0.44;
  leftLegPivot.position.set(-0.12, hipY, 0);
  rightLegPivot.position.set(0.12, hipY, 0);
  group.add(leftLegPivot, rightLegPivot);

  [leftLegPivot, rightLegPivot].forEach((legPivot) => {
    if (options.seated) {
      // Natural sitting leg posture
      const thighCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.060, 0.20, 12), sockMat);
      thighCyl.position.set(0, 0, 0.10);
      thighCyl.rotation.x = Math.PI / 2;
      thighCyl.castShadow = !isSoftwareGl;
      legPivot.add(thighCyl);

      const shinCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.060, 0.054, 0.22, 12), sockMat);
      shinCyl.position.set(0, -0.11, 0.20);
      shinCyl.castShadow = !isSoftwareGl;
      legPivot.add(shinCyl);

      const bootGroup = new THREE.Group();
      bootGroup.position.set(0, -0.23, 0.20);
      legPivot.add(bootGroup);

      const bootFoot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), leatherMat);
      bootFoot.scale.set(0.95, 0.72, 1.45);
      bootFoot.position.set(0, -0.02, 0.05);
      bootFoot.castShadow = !isSoftwareGl;
      bootGroup.add(bootFoot);

      const bootCuff = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.02, 8, 14), fleeceMat);
      bootCuff.rotation.x = Math.PI / 2;
      bootCuff.position.set(0, 0.04, 0);
      bootGroup.add(bootCuff);

      const bootToe = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.13, 10), leatherMat);
      bootToe.position.set(0, 0.03, 0.17);
      bootToe.rotation.x = Math.PI * 0.32;
      bootGroup.add(bootToe);

      const toeBell = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), goldMat);
      toeBell.position.set(0, 0.08, 0.21);
      bootGroup.add(toeBell);
    } else {
      // Standing leg
      const legCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.36, 12), sockMat);
      legCyl.position.y = -0.18;
      legCyl.castShadow = !isSoftwareGl;
      legPivot.add(legCyl);

      const bootGroup = new THREE.Group();
      bootGroup.position.set(0, -0.37, 0);
      legPivot.add(bootGroup);

      const bootFoot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), leatherMat);
      bootFoot.scale.set(0.95, 0.72, 1.45);
      bootFoot.position.set(0, -0.02, 0.05);
      bootFoot.castShadow = !isSoftwareGl;
      bootGroup.add(bootFoot);

      const bootCuff = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.02, 8, 14), fleeceMat);
      bootCuff.rotation.x = Math.PI / 2;
      bootCuff.position.set(0, 0.04, 0);
      bootGroup.add(bootCuff);

      const bootToe = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.13, 10), leatherMat);
      bootToe.position.set(0, 0.03, 0.17);
      bootToe.rotation.x = Math.PI * 0.32;
      bootGroup.add(bootToe);

      const toeBell = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), goldMat);
      toeBell.position.set(0, 0.08, 0.21);
      bootGroup.add(toeBell);
    }
  });

  // Upper Body Pivot
  const bodyPivot = new THREE.Group();
  bodyPivot.position.set(0, hipY, 0);
  group.add(bodyPivot);

  // Tunic flared coat skirt
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.34, 16), tunicMat);
  skirt.position.y = 0.08;
  skirt.castShadow = !isSoftwareGl;
  bodyPivot.add(skirt);

  // White fleece hem
  const skirtHem = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.032, 8, 20), fleeceMat);
  skirtHem.rotation.x = Math.PI / 2;
  skirtHem.position.y = -0.07;
  bodyPivot.add(skirtHem);

  // Rounded torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 0.38, 16), tunicMat);
  torso.position.y = 0.25;
  torso.castShadow = !isSoftwareGl;
  bodyPivot.add(torso);

  // Leather belt & golden buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.222, 0.232, 0.075, 16), leatherMat);
  belt.position.y = 0.16;
  bodyPivot.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.095, 0.035), goldMat);
  buckle.position.set(0, 0.16, 0.225);
  bodyPivot.add(buckle);

  // Festive crimson scalloped collar
  const collar = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.12, 10), crimsonMat);
  collar.position.y = 0.41;
  collar.rotation.x = Math.PI;
  bodyPivot.add(collar);

  // Articulated Arms
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.2, 0.4, 0.02);
  bodyPivot.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.2, 0.4, 0.02);
  bodyPivot.add(rightArmPivot);

  [leftArmPivot, rightArmPivot].forEach((armPivot, idx) => {
    const isLeft = idx === 0;
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.24, 8, 10), tunicMat);
    sleeve.position.set(isLeft ? -0.04 : 0.04, -0.14, 0.03);
    sleeve.rotation.z = isLeft ? 0.22 : -0.22;
    sleeve.castShadow = !isSoftwareGl;
    armPivot.add(sleeve);

    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.022, 8, 12), fleeceMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(isLeft ? -0.065 : 0.065, -0.26, 0.04);
    armPivot.add(cuff);

    const mitten = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), crimsonMat);
    mitten.scale.set(0.95, 1.15, 0.9);
    mitten.position.set(isLeft ? -0.075 : 0.075, -0.33, 0.05);
    mitten.castShadow = !isSoftwareGl;
    armPivot.add(mitten);

    // Equip brush if holdsBrush is set
    if (!isLeft && options.holdsBrush) {
      const brushGroup = new THREE.Group();
      brushGroup.position.set(0.08, -0.36, 0.08);
      brushGroup.rotation.x = 0.42;
      brushGroup.rotation.y = -0.55;

      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.26, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 })
      );
      handle.position.y = 0.08;
      brushGroup.add(handle);

      const bristles = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.14, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xe6cfad, roughness: 0.9 })
      );
      bristles.position.y = 0.24;
      brushGroup.add(bristles);

      armPivot.add(brushGroup);
    }
  });

  // Expressive Gnome/Elf Head
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.47, 0);
  bodyPivot.add(headPivot);

  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.225, 20, 18), skinMat);
  headSphere.position.y = 0.18;
  headSphere.scale.set(1.04, 0.98, 0.98);
  headSphere.castShadow = !isSoftwareGl;
  headPivot.add(headSphere);

  // Rosy nose & blushing cheeks
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), rosyMat);
  nose.position.set(0, 0.165, 0.22);
  nose.scale.set(1.1, 0.9, 1.0);
  headPivot.add(nose);

  [-1, 1].forEach((side) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), rosyMat);
    cheek.position.set(side * 0.125, 0.135, 0.175);
    cheek.scale.set(1.1, 0.75, 0.5);
    headPivot.add(cheek);

    // Pointed elf ears
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.15, 8), skinMat);
    ear.position.set(side * 0.235, 0.18, 0.01);
    ear.rotation.z = side * -1.12;
    ear.rotation.y = side * 0.25;
    headPivot.add(ear);

    // Glossy eyes + specular catchlight dots
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), eyeDarkMat);
    eye.position.set(side * 0.078, 0.215, 0.198);
    headPivot.add(eye);

    const catchlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    catchlight.position.set(side * 0.078 + 0.01, 0.226, 0.226);
    headPivot.add(catchlight);

    // Arched eyebrows
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.016, 0.018), hairMat);
    brow.position.set(side * 0.082, 0.268, 0.198);
    brow.rotation.z = side * -0.14;
    headPivot.add(brow);
  });

  // Joyful smile arc
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.048, 0.011, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x8f2d22, roughness: 0.5 })
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.125, 0.205);
  headPivot.add(smile);

  // Hair fringe or Elder Fluffy Beard
  if (options.hasBeard) {
    const beardMain = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.34, 14), fleeceMat);
    beardMain.rotation.x = Math.PI - 0.18;
    beardMain.position.set(0, 0.01, 0.13);
    beardMain.scale.set(1.1, 1, 0.72);
    headPivot.add(beardMain);

    [-1, 1].forEach((side) => {
      const mustache = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.075, 6, 8), fleeceMat);
      mustache.rotation.z = Math.PI / 2 + side * 0.28;
      mustache.position.set(side * 0.055, 0.125, 0.215);
      headPivot.add(mustache);
    });
  } else {
    // Chestnut hair tuft
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), hairMat);
    tuft.scale.set(1.6, 0.65, 0.8);
    tuft.position.set(0.03, 0.31, 0.165);
    headPivot.add(tuft);
  }

  // 3D Classic Stocking Cap
  const hatMat = new THREE.MeshStandardMaterial({
    color: options.hatPrimaryHex ?? (options.tunicHex ?? 0x1e6f3d),
    roughness: 0.62,
    metalness: 0.04,
  });

  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.30, -0.01);
  hatGroup.rotation.x = -0.12;
  headPivot.add(hatGroup);

  // Thick plush white fleece cuff
  const hatBrim = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.058, 12, 28), fleeceMat);
  hatBrim.rotation.x = Math.PI / 2;
  hatBrim.position.y = 0.02;
  hatGroup.add(hatBrim);

  // Decorative crimson ribbon trim
  const hatTrim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.015, 8, 24), crimsonMat);
  hatTrim.rotation.x = Math.PI / 2;
  hatTrim.position.y = 0.055;
  hatGroup.add(hatTrim);

  // Base Cap Segment
  const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.228, 0.16, 20), hatMat);
  hatBase.position.y = 0.09;
  hatBase.castShadow = !isSoftwareGl;
  hatGroup.add(hatBase);

  // Mid Taper Segment
  const hatMid = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.185, 0.16, 18), hatMat);
  hatMid.position.set(0, 0.22, -0.025);
  hatMid.rotation.x = -0.28;
  hatMid.rotation.z = 0.18;
  hatMid.castShadow = !isSoftwareGl;
  hatGroup.add(hatMid);

  // Articulated Floppy Tail
  const hatTipPivot = new THREE.Group();
  hatTipPivot.position.set(0.02, 0.32, -0.065);
  hatTipPivot.rotation.x = -0.38;
  hatTipPivot.rotation.z = 0.45;
  hatGroup.add(hatTipPivot);

  const hatDroop = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.13, 0.18, 16), hatMat);
  hatDroop.position.y = 0.09;
  hatDroop.castShadow = !isSoftwareGl;
  hatTipPivot.add(hatDroop);

  const hatTipCone = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.14, 14), hatMat);
  hatTipCone.position.y = 0.22;
  hatTipCone.castShadow = !isSoftwareGl;
  hatTipPivot.add(hatTipCone);

  // Soft fluffy white fleece pom-pom
  const pomPom = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), fleeceMat);
  pomPom.position.set(0, 0.30, 0);
  pomPom.castShadow = !isSoftwareGl;
  hatTipPivot.add(pomPom);

  return {
    group,
    bodyPivot,
    headPivot,
    hatTipPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    baseY: 0,
    options,
  };
}

export function updateGnomeAnimation(
  rig: GnomeRig,
  elapsed: number,
  spinPhase: SpinPhase,
  pushTimer: number,
  wheelSpeedRatio: number
) {
  const phase = rig.options.phaseOffset ?? 0;
  const t = elapsed + phase;
  const role = rig.options.role;

  // Hat tip secondary motion
  const excitement = spinPhase === 'idle' ? 0.2 : 1.0;
  rig.hatTipPivot.rotation.z = 0.48 + Math.sin(t * (spinPhase === 'idle' ? 2.2 : 7.5)) * 0.14 * excitement;

  if (role === 'pusher') {
    // Ladder Pusher Gnome
    if (spinPhase === 'pushing') {
      const p = THREE.MathUtils.clamp(pushTimer / 0.42, 0, 1);
      if (p < 0.35) {
        const w = p / 0.35;
        rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(-0.1, 0.14, w);
        rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(0.05, -0.18, w);
        rig.leftArmPivot.rotation.x = THREE.MathUtils.lerp(-0.9, -2.35, w);
        rig.rightArmPivot.rotation.x = THREE.MathUtils.lerp(-1.1, -2.45, w);
        rig.rightArmPivot.rotation.z = -0.35;
      } else {
        const h = (p - 0.35) / 0.65;
        const ease = 1 - Math.pow(1 - h, 3);
        rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(0.14, -0.32, ease);
        rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(-0.18, 0.36, ease);
        rig.leftArmPivot.rotation.x = THREE.MathUtils.lerp(-2.35, -0.45, ease);
        rig.rightArmPivot.rotation.x = THREE.MathUtils.lerp(-2.45, -0.35, ease);
      }
      rig.headPivot.rotation.y = 0.35;
      rig.group.position.y = rig.baseY;
    } else if (spinPhase === 'spinning' || spinPhase === 'revealing' || spinPhase === 'revealed') {
      const bounce = Math.abs(Math.sin(t * 7.2)) * 0.08 * (0.45 + wheelSpeedRatio * 0.55);
      rig.group.position.y = rig.baseY + bounce;
      rig.bodyPivot.rotation.z = -0.08 + Math.sin(t * 5.0) * 0.08;
      rig.bodyPivot.rotation.x = 0.06;
      rig.leftArmPivot.rotation.x = -2.3 + Math.sin(t * 8.5) * 0.35;
      rig.rightArmPivot.rotation.x = -2.3 + Math.cos(t * 8.5) * 0.35;
      rig.leftArmPivot.rotation.z = 0.25;
      rig.rightArmPivot.rotation.z = -0.25;
      rig.headPivot.rotation.y = 0.25 + Math.sin(t * 3.2) * 0.15;
    } else {
      rig.group.position.y = rig.baseY + Math.sin(t * 2.0) * 0.015;
      rig.bodyPivot.rotation.z = -0.1 + Math.sin(t * 1.6) * 0.04;
      rig.bodyPivot.rotation.x = 0.05;
      rig.leftArmPivot.rotation.x = -0.85 + Math.sin(t * 2.2) * 0.12;
      rig.rightArmPivot.rotation.x = -1.35 + Math.cos(t * 2.4) * 0.16;
      rig.leftArmPivot.rotation.z = 0.15;
      rig.rightArmPivot.rotation.z = -0.35;
      rig.headPivot.rotation.y = 0.22 + Math.sin(t * 1.1) * 0.18;
    }
    return;
  }

  if (role === 'rimWatcher') {
    const waveSpeed = spinPhase === 'idle' ? 2.6 : 9.0;
    const waveAmp = spinPhase === 'idle' ? 0.18 : 0.45;
    rig.bodyPivot.rotation.z = 0.18 + Math.sin(t * 2.2) * 0.06;
    rig.rightArmPivot.rotation.x = -2.25 + Math.sin(t * waveSpeed) * waveAmp;
    rig.rightArmPivot.rotation.z = -0.45 + Math.cos(t * waveSpeed) * 0.22;
    rig.leftArmPivot.rotation.x = -1.1;
    rig.headPivot.rotation.z = 0.1 + Math.sin(t * 2.5) * 0.08;
    rig.group.position.y =
      rig.baseY + (spinPhase === 'idle' ? Math.sin(t * 2.0) * 0.02 : Math.abs(Math.sin(t * 7.5)) * 0.07);
    return;
  }

  if (role === 'elderOnLog') {
    const legSpeed = spinPhase === 'idle' ? 1.6 : 4.8;
    rig.leftLegPivot.rotation.x = Math.sin(t * legSpeed) * 0.08;
    rig.rightLegPivot.rotation.x = -Math.sin(t * legSpeed) * 0.08;

    if (spinPhase === 'idle') {
      rig.bodyPivot.rotation.z = Math.sin(t * 1.4) * 0.04;
      rig.headPivot.rotation.y = Math.sin(t * 0.9) * 0.18;
      rig.leftArmPivot.rotation.x = -0.45 + Math.sin(t * 1.8) * 0.08;
      rig.rightArmPivot.rotation.x = -0.65 + Math.cos(t * 1.8) * 0.1;
      rig.leftArmPivot.rotation.z = 0.12;
      rig.rightArmPivot.rotation.z = -0.12;
    } else {
      rig.bodyPivot.rotation.z = Math.sin(t * 5.5) * 0.08;
      rig.headPivot.rotation.y = 0.25 + Math.sin(t * 4.0) * 0.12;
      rig.leftArmPivot.rotation.x = -1.85 + Math.sin(t * 9.5) * 0.35;
      rig.rightArmPivot.rotation.x = -1.85 + Math.cos(t * 9.5) * 0.35;
      rig.leftArmPivot.rotation.z = 0.22 + Math.sin(t * 9.5) * 0.18;
      rig.rightArmPivot.rotation.z = -0.22 - Math.sin(t * 9.5) * 0.18;
    }
    return;
  }

  // Ground gnomes
  if (spinPhase === 'idle') {
    rig.group.position.y = rig.baseY;
    rig.bodyPivot.rotation.z = Math.sin(t * 1.5) * 0.04;
    rig.headPivot.rotation.y = Math.sin(t * 1.1) * 0.24;
    rig.leftArmPivot.rotation.x = -0.35 + Math.sin(t * 2.0) * 0.1;
    rig.rightArmPivot.rotation.x = -0.95 + Math.sin(t * 2.3) * 0.18;
    rig.leftArmPivot.rotation.z = 0.16;
    rig.rightArmPivot.rotation.z = -0.28;
  } else {
    const jump = Math.abs(Math.sin(t * 6.8)) * 0.16;
    rig.group.position.y = rig.baseY + jump;
    rig.bodyPivot.rotation.z = Math.sin(t * 6.8) * 0.09;
    rig.headPivot.rotation.y = (role === 'groundHelper' ? 0.2 : -0.22) + Math.sin(t * 3.8) * 0.14;
    rig.leftArmPivot.rotation.x = -2.45 + Math.sin(t * 9.0) * 0.38;
    rig.rightArmPivot.rotation.x = -2.45 - Math.sin(t * 9.0) * 0.38;
    rig.leftArmPivot.rotation.z = 0.32;
    rig.rightArmPivot.rotation.z = -0.32;
  }
}

// ============================================================================
// ENHANCED 3D REINDEER (CHRISTMAS HARNESS WITH GOLD BRASS BELLS & 3D ANTLERS)
// ============================================================================

export interface ReindeerRig {
  group: THREE.Group;
  neckPivot: THREE.Group;
  headPivot: THREE.Group;
  leftEarPivot: THREE.Group;
  rightEarPivot: THREE.Group;
  tailPivot: THREE.Group;
  grazingStyle: boolean;
  phaseOffset: number;
}

export function createReindeer(
  grazingStyle: boolean,
  phaseOffset: number,
  isSoftwareGl: boolean
): ReindeerRig {
  const group = new THREE.Group();

  const coatMat = new THREE.MeshStandardMaterial({
    color: 0x7c4e33,
    roughness: 0.82,
    metalness: 0.02,
  });
  const creamFurMat = new THREE.MeshStandardMaterial({
    color: 0xe0cca8,
    roughness: 0.85,
  });
  const hoofMat = new THREE.MeshStandardMaterial({
    color: 0x22160f,
    roughness: 0.42,
  });
  const antlerMat = new THREE.MeshStandardMaterial({
    color: 0xe4d7bf,
    roughness: 0.62,
    metalness: 0.05,
  });
  const crimsonHarnessMat = new THREE.MeshStandardMaterial({
    color: 0xc82227,
    roughness: 0.55,
    metalness: 0.08,
  });
  const goldBellMat = new THREE.MeshStandardMaterial({
    color: 0xf5ca65,
    roughness: 0.22,
    metalness: 0.88,
  });

  // Main Body
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.74, 10, 14), coatMat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0.92, 0);
  body.castShadow = !isSoftwareGl;
  body.receiveShadow = !isSoftwareGl;
  group.add(body);

  // Soft Cream Chest Tuft
  const chestTuft = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), creamFurMat);
  chestTuft.scale.set(0.85, 1.18, 0.85);
  chestTuft.position.set(0.38, 0.88, 0);
  group.add(chestTuft);

  // Festive Crimson Harness Ribbon around Chest/Neck with Brass Jingle Bells!
  const harnessRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.032, 8, 20), crimsonHarnessMat);
  harnessRing.rotation.y = Math.PI / 2;
  harnessRing.rotation.x = 0.35;
  harnessRing.position.set(0.28, 0.94, 0);
  group.add(harnessRing);

  // 4 Golden Jingle Bells along the harness
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + 0.2;
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), goldBellMat);
    bell.position.set(
      0.28 + Math.cos(angle) * 0.05,
      0.88 + Math.sin(angle) * 0.26,
      Math.sin(angle) * 0.28
    );
    group.add(bell);
  }

  // 4 Slender Legs + Polished Hooves
  const legCoords = [
    { x: 0.34, z: 0.15 },
    { x: 0.34, z: -0.15 },
    { x: -0.34, z: 0.15 },
    { x: -0.34, z: -0.15 },
  ];
  legCoords.forEach((lc) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.042, 0.86, 10), coatMat);
    leg.position.set(lc.x, 0.45, lc.z);
    leg.castShadow = !isSoftwareGl;
    group.add(leg);

    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.09, 10), hoofMat);
    hoof.position.set(lc.x, 0.045, lc.z);
    group.add(hoof);
  });

  // Tail
  const tailPivot = new THREE.Group();
  tailPivot.position.set(-0.58, 1.02, 0);
  group.add(tailPivot);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.22, 8), creamFurMat);
  tail.rotation.z = 1.1;
  tail.position.set(-0.08, 0.04, 0);
  tailPivot.add(tail);

  // Neck Pivot
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0.38, 1.02, 0);
  neckPivot.rotation.z = grazingStyle ? -0.85 : -0.32;
  group.add(neckPivot);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.56, 12), coatMat);
  neck.position.set(0.08, 0.26, 0);
  neck.castShadow = !isSoftwareGl;
  neckPivot.add(neck);

  // Head Pivot
  const headPivot = new THREE.Group();
  headPivot.position.set(0.12, 0.52, 0);
  neckPivot.add(headPivot);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 12), coatMat);
  cranium.scale.set(1.25, 0.95, 0.9);
  headPivot.add(cranium);

  const snout = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.2, 8, 10), coatMat);
  snout.rotation.z = Math.PI / 2;
  snout.position.set(0.2, -0.03, 0);
  headPivot.add(snout);

  const muzzlePatch = new THREE.Mesh(new THREE.SphereGeometry(0.088, 10, 8), creamFurMat);
  muzzlePatch.position.set(0.24, -0.04, 0);
  muzzlePatch.scale.set(0.9, 0.75, 0.85);
  headPivot.add(muzzlePatch);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), hoofMat);
  noseTip.position.set(0.33, -0.02, 0);
  headPivot.add(noseTip);

  // Eyes with specular catchlights
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), hoofMat);
    eye.position.set(0.08, 0.04, side * 0.13);
    headPivot.add(eye);

    const catchlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    catchlight.position.set(0.095, 0.05, side * 0.145);
    headPivot.add(catchlight);
  });

  // Articulated Ears
  const leftEarPivot = new THREE.Group();
  leftEarPivot.position.set(-0.04, 0.11, 0.11);
  headPivot.add(leftEarPivot);

  const rightEarPivot = new THREE.Group();
  rightEarPivot.position.set(-0.04, 0.11, -0.11);
  headPivot.add(rightEarPivot);

  [leftEarPivot, rightEarPivot].forEach((ep, idx) => {
    const side = idx === 0 ? 1 : -1;
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 8), coatMat);
    ear.position.set(-0.03, 0.08, side * 0.07);
    ear.rotation.x = side * 0.65;
    ear.rotation.z = 0.35;
    ep.add(ear);
  });

  // Detailed 3D Multi-Branch Antlers
  [-1, 1].forEach((side) => {
    const antlerRoot = new THREE.Group();
    antlerRoot.position.set(-0.02, 0.14, side * 0.08);
    antlerRoot.rotation.x = side * 0.38;
    antlerRoot.rotation.z = 0.28;
    headPivot.add(antlerRoot);

    const mainBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.58, 8), antlerMat);
    mainBeam.position.y = 0.27;
    antlerRoot.add(mainBeam);

    const browTine = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.24, 6), antlerMat);
    browTine.position.set(0.08, 0.2, 0);
    browTine.rotation.z = -0.68;
    antlerRoot.add(browTine);

    const upperTine1 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.016, 0.22, 6), antlerMat);
    upperTine1.position.set(-0.06, 0.37, side * 0.04);
    upperTine1.rotation.z = 0.58;
    antlerRoot.add(upperTine1);

    const upperTine2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.18, 6), antlerMat);
    upperTine2.position.set(0.05, 0.48, 0);
    upperTine2.rotation.z = -0.52;
    antlerRoot.add(upperTine2);
  });

  return {
    group,
    neckPivot,
    headPivot,
    leftEarPivot,
    rightEarPivot,
    tailPivot,
    grazingStyle,
    phaseOffset,
  };
}

export function updateReindeerIdle(rig: ReindeerRig, elapsed: number) {
  const t = elapsed + rig.phaseOffset;

  if (rig.grazingStyle) {
    const grazeWave = Math.sin(t * 0.65);
    rig.neckPivot.rotation.z = -0.82 + grazeWave * 0.28;
    rig.headPivot.rotation.y = Math.sin(t * 0.95) * 0.24;
    rig.headPivot.rotation.z = 0.35 - grazeWave * 0.16;
  } else {
    rig.neckPivot.rotation.z = -0.28 + Math.sin(t * 0.8) * 0.06;
    rig.headPivot.rotation.y = Math.sin(t * 0.72) * 0.34;
    rig.headPivot.rotation.x = Math.cos(t * 0.9) * 0.08;
  }

  const earTwitchL = Math.pow(Math.max(0, Math.sin(t * 2.7)), 8) * 0.38;
  const earTwitchR = Math.pow(Math.max(0, Math.sin(t * 3.1 + 1.9)), 8) * 0.38;
  rig.leftEarPivot.rotation.z = earTwitchL;
  rig.rightEarPivot.rotation.z = -earTwitchR;
  rig.tailPivot.rotation.x = Math.sin(t * 2.4) * 0.14;
}

// ============================================================================
// 3D CHRISTMAS GIFT BOX (EMERGES CENTERED FROM BEHIND WHEEL & OPENS WITH GLOW)
// ============================================================================

export interface GiftBoxRig {
  group: THREE.Group;
  lidPivot: THREE.Group;
  glowLight: THREE.PointLight;
  glowSprite: THREE.Sprite;
  sparkles: THREE.Points;
  update: (elapsed: number, delta: number, revealProgress: number, openProgress: number) => void;
}

export function createGiftBox(
  giftWrapTex: THREE.Texture,
  glowTex: THREE.Texture,
  isSoftwareGl: boolean
): GiftBoxRig {
  const group = new THREE.Group();

  const wrapMat = new THREE.MeshStandardMaterial({
    map: giftWrapTex,
    roughness: 0.36,
    metalness: 0.12,
  });

  const goldRibbonMat = new THREE.MeshStandardMaterial({
    color: 0xf6ca65,
    roughness: 0.22,
    metalness: 0.82,
    emissive: 0x6b4708,
    emissiveIntensity: 0.2,
  });

  const innerGlowLiningMat = new THREE.MeshStandardMaterial({
    color: 0xffe49c,
    emissive: 0xffb838,
    emissiveIntensity: 1.4,
    roughness: 0.3,
  });

  const boxSize = 1.08;
  const boxHeight = 0.86;
  const wallThick = 0.065;

  // Hollow 5-wall gift box
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(boxSize, wallThick, boxSize), wrapMat);
  bottom.position.y = wallThick / 2;
  bottom.castShadow = !isSoftwareGl;
  group.add(bottom);

  const innerFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(boxSize - wallThick * 2, boxSize - wallThick * 2),
    innerGlowLiningMat
  );
  innerFloor.rotation.x = -Math.PI / 2;
  innerFloor.position.y = wallThick + 0.01;
  group.add(innerFloor);

  // 4 Side Walls
  const fbWallGeo = new THREE.BoxGeometry(boxSize, boxHeight, wallThick);
  const lrWallGeo = new THREE.BoxGeometry(wallThick, boxHeight, boxSize - wallThick * 2);

  const frontWall = new THREE.Mesh(fbWallGeo, wrapMat);
  frontWall.position.set(0, boxHeight / 2, boxSize / 2 - wallThick / 2);
  frontWall.castShadow = !isSoftwareGl;
  group.add(frontWall);

  const backWall = new THREE.Mesh(fbWallGeo, wrapMat);
  backWall.position.set(0, boxHeight / 2, -boxSize / 2 + wallThick / 2);
  backWall.castShadow = !isSoftwareGl;
  group.add(backWall);

  const leftWall = new THREE.Mesh(lrWallGeo, wrapMat);
  leftWall.position.set(-boxSize / 2 + wallThick / 2, boxHeight / 2, 0);
  leftWall.castShadow = !isSoftwareGl;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(lrWallGeo, wrapMat);
  rightWall.position.set(boxSize / 2 - wallThick / 2, boxHeight / 2, 0);
  rightWall.castShadow = !isSoftwareGl;
  group.add(rightWall);

  // Gold Ribbons on Box
  const ribbonWidth = 0.19;
  const fbRibbon = new THREE.Mesh(
    new THREE.BoxGeometry(ribbonWidth, boxHeight + 0.01, boxSize + 0.025),
    goldRibbonMat
  );
  fbRibbon.position.y = boxHeight / 2;
  group.add(fbRibbon);

  const lrRibbon = new THREE.Mesh(
    new THREE.BoxGeometry(boxSize + 0.025, boxHeight + 0.01, ribbonWidth),
    goldRibbonMat
  );
  lrRibbon.position.y = boxHeight / 2;
  group.add(lrRibbon);

  // Hinged Lid Pivot at Back Top Edge
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, boxHeight, -boxSize / 2);
  group.add(lidPivot);

  const lidSize = boxSize + 0.09;
  const lidHeight = 0.2;
  const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(lidSize, lidHeight, lidSize), wrapMat);
  lidMesh.position.set(0, lidHeight / 2, boxSize / 2);
  lidMesh.castShadow = !isSoftwareGl;
  lidPivot.add(lidMesh);

  // Crossed Gold Ribbons on Lid
  const lidRibbon1 = new THREE.Mesh(
    new THREE.BoxGeometry(ribbonWidth + 0.02, lidHeight + 0.02, lidSize + 0.025),
    goldRibbonMat
  );
  lidRibbon1.position.set(0, lidHeight / 2, boxSize / 2);
  lidPivot.add(lidRibbon1);

  const lidRibbon2 = new THREE.Mesh(
    new THREE.BoxGeometry(lidSize + 0.025, lidHeight + 0.02, ribbonWidth + 0.02),
    goldRibbonMat
  );
  lidRibbon2.position.set(0, lidHeight / 2, boxSize / 2);
  lidPivot.add(lidRibbon2);

  // Sculpted 3D Golden Ribbon Bow
  const bowGroup = new THREE.Group();
  bowGroup.position.set(0, lidHeight + 0.02, boxSize / 2);
  lidPivot.add(bowGroup);

  const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), goldRibbonMat);
  bowKnot.scale.set(1, 0.75, 1);
  bowKnot.position.y = 0.05;
  bowGroup.add(bowKnot);

  for (let i = 0; i < 4; i++) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.042, 10, 22), goldRibbonMat);
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    loop.position.set(Math.cos(angle) * 0.14, 0.11, Math.sin(angle) * 0.14);
    loop.rotation.y = -angle;
    loop.rotation.x = 0.52;
    bowGroup.add(loop);
  }

  // Interior Light + Volumetric Halo + Golden Sparkles
  const glowLight = new THREE.PointLight(0xffcb57, 0, 8.5, 1.6);
  glowLight.position.set(0, boxHeight * 0.75, 0);
  group.add(glowLight);

  const glowSpriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xffe28a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glowSprite = new THREE.Sprite(glowSpriteMat);
  glowSprite.position.set(0, boxHeight + 0.15, 0.05);
  glowSprite.scale.setScalar(2.6);
  group.add(glowSprite);

  // Golden magic sparkles fountaining upwards
  const spCount = 42;
  const spPos = new Float32Array(spCount * 3);
  const spMeta = new Float32Array(spCount * 3);
  for (let i = 0; i < spCount; i++) {
    spPos[i * 3] = (Math.random() - 0.5) * 0.6;
    spPos[i * 3 + 1] = Math.random() * 1.6;
    spPos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    spMeta[i * 3] = 0.75 + Math.random() * 1.1;
    spMeta[i * 3 + 1] = Math.random() * Math.PI * 2;
    spMeta[i * 3 + 2] = 0.12 + Math.random() * 0.45;
  }
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  const spMat = new THREE.PointsMaterial({
    map: glowTex,
    color: 0xfff0a8,
    size: 0.24,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sparkles = new THREE.Points(spGeo, spMat);
  sparkles.position.set(0, boxHeight * 0.6, 0);
  sparkles.frustumCulled = false;
  group.add(sparkles);

  function update(
    elapsed: number,
    delta: number,
    revealProgress: number,
    openProgress: number
  ) {
    const smoothOpen = THREE.MathUtils.smoothstep(openProgress, 0, 1);
    lidPivot.rotation.x = -smoothOpen * 2.02;

    if (revealProgress > 0.78 && openProgress < 0.22) {
      const shakeAmt = Math.sin(elapsed * 46) * 0.055 * (1 - openProgress * 4);
      group.rotation.z = shakeAmt;
    } else {
      group.rotation.z = Math.sin(elapsed * 1.8) * 0.02 * smoothOpen;
    }

    glowLight.intensity = smoothOpen * 5.2 * (0.92 + 0.08 * Math.sin(elapsed * 4.5));
    glowSpriteMat.opacity = smoothOpen * 0.88;
    const pulseScale = 2.5 + smoothOpen * 1.1 + Math.sin(elapsed * 3.2) * 0.16;
    glowSprite.scale.setScalar(pulseScale);

    spMat.opacity = smoothOpen * 0.95;
    if (smoothOpen > 0.05) {
      const attr = spGeo.attributes.position as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < spCount; i++) {
        const speed = spMeta[i * 3];
        const ang = spMeta[i * 3 + 1] + elapsed * 1.4;
        const rad = spMeta[i * 3 + 2] * (0.4 + arr[i * 3 + 1] * 0.65);
        arr[i * 3 + 1] += speed * delta;
        arr[i * 3] = Math.cos(ang) * rad;
        arr[i * 3 + 2] = Math.sin(ang) * rad;
        if (arr[i * 3 + 1] > 1.95) {
          arr[i * 3 + 1] = 0.05;
        }
      }
      attr.needsUpdate = true;
    }
  }

  return {
    group,
    lidPivot,
    glowLight,
    glowSprite,
    sparkles,
    update,
  };
}
