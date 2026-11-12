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

export function createSingleSolidHatGeometry(): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.01, 0.12, 0.01),
    new THREE.Vector3(0.02, 0.26, -0.04),
    new THREE.Vector3(0.035, 0.38, -0.10),
    new THREE.Vector3(0.042, 0.48, -0.16),
    new THREE.Vector3(0.045, 0.54, -0.21),
  ], false, 'catmullrom', 0.5);

  const radialSegments = 24;
  const tubularSegments = 36;

  const points = curve.getSpacedPoints(tubularSegments);
  const frames = curve.computeFrenetFrames(tubularSegments, false);

  const positionArray: number[] = [];
  const normalArray: number[] = [];
  const uvArray: number[] = [];
  const indexArray: number[] = [];

  function getRadiusAt(t: number): number {
    const baseR = 0.228;
    const tipR = 0.015;
    const taper = Math.pow(1 - t, 0.88);
    return tipR + (baseR - tipR) * taper;
  }

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const p = points[i];
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const radius = getRadiusAt(u);

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = Math.cos(theta);

      const nx = cos * N.x + sin * B.x;
      const ny = cos * N.y + sin * B.y;
      const nz = cos * N.z + sin * B.z;

      const norm = new THREE.Vector3(nx, ny, nz).normalize();

      const px = p.x + radius * norm.x;
      const py = p.y + radius * norm.y;
      const pz = p.z + radius * norm.z;

      positionArray.push(px, py, pz);
      normalArray.push(norm.x, norm.y, norm.z);
      uvArray.push(v, u);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);

      indexArray.push(a, b, d);
      indexArray.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalArray, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
  geometry.setIndex(indexArray);

  return geometry;
}

export function createGnome(
  options: GnomeOptions,
  sockTex: THREE.Texture,
  isSoftwareGl: boolean
): GnomeRig {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffcaa0,
    roughness: 0.52,
    metalness: 0.02,
  });
  const rosyMat = new THREE.MeshStandardMaterial({
    color: 0xef7a6c,
    roughness: 0.48,
    emissive: 0x6e1b12,
    emissiveIntensity: 0.12,
  });
  const tunicMat = new THREE.MeshStandardMaterial({
    color: options.tunicHex ?? 0x1e6f3d,
    roughness: 0.68,
    metalness: 0.04,
  });
  const crimsonMat = new THREE.MeshStandardMaterial({
    color: options.hatPrimaryHex ?? 0xc82227,
    roughness: 0.65,
    metalness: 0.04,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x3d2012,
    roughness: 0.45,
    metalness: 0.12,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf5ca65,
    roughness: 0.22,
    metalness: 0.88,
  });
  const sockMat = new THREE.MeshStandardMaterial({
    map: sockTex,
    roughness: 0.68,
  });
  const fleeceMat = new THREE.MeshStandardMaterial({
    color: 0xfcf8f2,
    roughness: 0.92,
  });
  const eyeDarkMat = new THREE.MeshStandardMaterial({
    color: 0x160f09,
    roughness: 0.12,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: options.hasBeard ? 0xfbf8f3 : 0x7a3e1b,
    roughness: 0.78,
  });

  // Legs & Curled Elf Boots
  const leftLegPivot = new THREE.Group();
  const rightLegPivot = new THREE.Group();
  const hipY = options.seated ? 0.36 : 0.46;
  leftLegPivot.position.set(-0.11, hipY, 0);
  rightLegPivot.position.set(0.11, hipY, 0);
  group.add(leftLegPivot, rightLegPivot);

  [leftLegPivot, rightLegPivot].forEach((legPivot) => {
    if (options.seated) {
      // Natural 90-degree sitting posture: thigh extends forward, shin drops down
      const thighCyl = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.14, 8, 12), sockMat);
      thighCyl.position.set(0, -0.02, 0.11);
      thighCyl.rotation.x = Math.PI / 2;
      thighCyl.castShadow = !isSoftwareGl;
      legPivot.add(thighCyl);

      const shinCyl = new THREE.Mesh(new THREE.CapsuleGeometry(0.060, 0.18, 8, 12), sockMat);
      shinCyl.position.set(0, -0.16, 0.20);
      shinCyl.castShadow = !isSoftwareGl;
      legPivot.add(shinCyl);

      const bootGroup = new THREE.Group();
      bootGroup.position.set(0, -0.28, 0.20);
      legPivot.add(bootGroup);

      // Curled elf boot with fluffy white fur collar
      const bootCuff = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.024, 8, 16), fleeceMat);
      bootCuff.rotation.x = Math.PI / 2;
      bootCuff.position.set(0, 0.05, 0);
      bootGroup.add(bootCuff);

      const bootHeel = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), leatherMat);
      bootHeel.scale.set(0.95, 0.75, 1.35);
      bootHeel.position.set(0, -0.01, 0.03);
      bootHeel.castShadow = !isSoftwareGl;
      bootGroup.add(bootHeel);

      // Upward-curling elf toe
      const bootToe = new THREE.Mesh(new THREE.ConeGeometry(0.054, 0.14, 12), leatherMat);
      bootToe.position.set(0, 0.04, 0.16);
      bootToe.rotation.x = Math.PI * 0.36;
      bootGroup.add(bootToe);

      const toeBell = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), goldMat);
      toeBell.position.set(0, 0.09, 0.20);
      bootGroup.add(toeBell);
    } else {
      // Natural standing leg: straight vertical with curled elf boot resting flat on the ground/stump
      // Leg length: 0.34 down, boot base: exactly touches 0 when group.position.y is grounded!
      const legCyl = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.22, 8, 12), sockMat);
      legCyl.position.y = -0.19;
      legCyl.castShadow = !isSoftwareGl;
      legPivot.add(legCyl);

      const bootGroup = new THREE.Group();
      bootGroup.position.set(0, -0.38, 0);
      legPivot.add(bootGroup);

      const bootCuff = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.024, 8, 16), fleeceMat);
      bootCuff.rotation.x = Math.PI / 2;
      bootCuff.position.set(0, 0.06, 0);
      bootGroup.add(bootCuff);

      const bootHeel = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), leatherMat);
      bootHeel.scale.set(0.95, 0.72, 1.38);
      bootHeel.position.set(0, -0.02, 0.04);
      bootHeel.castShadow = !isSoftwareGl;
      bootGroup.add(bootHeel);

      const bootToe = new THREE.Mesh(new THREE.ConeGeometry(0.054, 0.14, 12), leatherMat);
      bootToe.position.set(0, 0.035, 0.16);
      bootToe.rotation.x = Math.PI * 0.34;
      bootGroup.add(bootToe);

      const toeBell = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), goldMat);
      toeBell.position.set(0, 0.085, 0.20);
      bootGroup.add(toeBell);
    }
  });

  // Upper Body Pivot
  const bodyPivot = new THREE.Group();
  bodyPivot.position.set(0, hipY, 0);
  group.add(bodyPivot);

  // Tunic flared coat skirt (volumetric rounded bell silhouette)
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.30, 0.32, 18), tunicMat);
  skirt.position.y = 0.08;
  skirt.castShadow = !isSoftwareGl;
  bodyPivot.add(skirt);

  // Soft wavy white fleece hem
  const skirtHem = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.036, 10, 24), fleeceMat);
  skirtHem.rotation.x = Math.PI / 2;
  skirtHem.position.y = -0.07;
  bodyPivot.add(skirtHem);

  // Chubby rounded torso
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 14), tunicMat);
  torso.scale.set(1.05, 1.15, 0.95);
  torso.position.y = 0.24;
  torso.castShadow = !isSoftwareGl;
  bodyPivot.add(torso);

  // Leather belt & curved golden buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.238, 0.246, 0.075, 18), leatherMat);
  belt.position.y = 0.15;
  bodyPivot.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.095, 0.035), goldMat);
  buckle.position.set(0, 0.15, 0.238);
  bodyPivot.add(buckle);

  // Festive crimson scalloped wavy collar with gold bell
  const collar = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.12, 12), crimsonMat);
  collar.position.y = 0.39;
  collar.rotation.x = Math.PI;
  bodyPivot.add(collar);

  const collarBell = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), goldMat);
  collarBell.position.set(0, 0.33, 0.22);
  bodyPivot.add(collarBell);

  // Articulated Arms (Perfectly Connected Single-Rig Hierarchy)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.245, 0.38, 0.04);
  bodyPivot.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.245, 0.38, 0.04);
  bodyPivot.add(rightArmPivot);

  [leftArmPivot, rightArmPivot].forEach((armPivot, idx) => {
    const isLeft = idx === 0;

    // Sleeve capsule centered along negative Y axis from shoulder joint
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.060, 0.22, 8, 12), tunicMat);
    sleeve.position.set(0, -0.13, 0);
    sleeve.castShadow = !isSoftwareGl;
    armPivot.add(sleeve);

    // Plush white fleece cuff wrapping around the wrist opening
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.024, 8, 14), fleeceMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, -0.24, 0);
    armPivot.add(cuff);

    // Hand Group seamlessly attached at wrist (y = -0.28)
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.28, 0);
    armPivot.add(handGroup);

    // Main glove palm & fingers
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), crimsonMat);
    palm.scale.set(0.9, 1.05, 0.85);
    palm.position.set(0, -0.02, 0);
    palm.castShadow = !isSoftwareGl;
    handGroup.add(palm);

    // Articulated thumb
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.020, 0.042, 6, 8), crimsonMat);
    thumb.position.set(isLeft ? 0.034 : -0.034, 0.012, 0.028);
    thumb.rotation.z = isLeft ? -0.65 : 0.65;
    thumb.rotation.x = 0.35;
    handGroup.add(thumb);

    // Golden brass glove button / buckle accent
    const gloveButton = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), goldMat);
    gloveButton.position.set(isLeft ? -0.032 : 0.032, 0.02, 0.035);
    handGroup.add(gloveButton);

    // Equip brush if holdsBrush is set (attached INSIDE handGroup so it never detaches!)
    if (!isLeft && options.holdsBrush) {
      const brushGroup = new THREE.Group();
      brushGroup.position.set(0.02, -0.06, 0.04);
      brushGroup.rotation.x = 0.42;
      brushGroup.rotation.y = -0.55;

      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.26, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 })
      );
      handle.position.y = 0.08;
      brushGroup.add(handle);

      const bristles = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.14, 0.055),
        new THREE.MeshStandardMaterial({ color: 0xe6cfad, roughness: 0.9 })
      );
      bristles.position.y = 0.22;
      brushGroup.add(bristles);

      handGroup.add(brushGroup);
    }
  });

  // Expressive Gnome/Elf Head
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.46, 0);
  bodyPivot.add(headPivot);

  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.225, 20, 18), skinMat);
  headSphere.position.y = 0.18;
  headSphere.scale.set(1.05, 0.98, 0.98);
  headSphere.castShadow = !isSoftwareGl;
  headPivot.add(headSphere);

  // Rosy nose & blushing cheeks
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.054, 14, 12), rosyMat);
  nose.position.set(0, 0.165, 0.22);
  nose.scale.set(1.12, 0.92, 1.0);
  headPivot.add(nose);

  [-1, 1].forEach((side) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.050, 12, 10), rosyMat);
    cheek.position.set(side * 0.125, 0.135, 0.175);
    cheek.scale.set(1.1, 0.75, 0.5);
    headPivot.add(cheek);

    // Pointed curved elf ears
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.235, 0.18, 0.01);
    earGroup.rotation.z = side * -1.12;
    earGroup.rotation.y = side * 0.25;
    const earCone = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.16, 10), skinMat);
    earGroup.add(earCone);
    headPivot.add(earGroup);

    // Glossy eyes + specular catchlight dots
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), eyeDarkMat);
    eye.position.set(side * 0.078, 0.215, 0.198);
    headPivot.add(eye);

    const catchlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    catchlight.position.set(side * 0.078 + 0.01, 0.226, 0.226);
    headPivot.add(catchlight);

    // Arched curved eyebrows
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.050, 6, 8), hairMat);
    brow.position.set(side * 0.082, 0.268, 0.198);
    brow.rotation.z = side * -0.22;
    headPivot.add(brow);
  });

  // Joyful smile arc
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.050, 0.012, 8, 14, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x8f2d22, roughness: 0.5 })
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.122, 0.205);
  headPivot.add(smile);

  // Hair fringe or Elder Fluffy Beard (sculpted away from clothes so 0% clipping occurs!)
  if (options.hasBeard) {
    const beardGroup = new THREE.Group();
    beardGroup.position.set(0, 0.05, 0.18);
    beardGroup.rotation.x = 0.26; // Tilted forward away from chest/tunic
    headPivot.add(beardGroup);

    // Main central beard cone angled forward and downward away from torso
    const beardMain = new THREE.Mesh(new THREE.ConeGeometry(0.175, 0.32, 14), fleeceMat);
    beardMain.rotation.x = Math.PI + 0.14;
    beardMain.position.set(0, -0.12, 0.04);
    beardMain.scale.set(1.15, 1.0, 0.68);
    beardMain.castShadow = !isSoftwareGl;
    beardGroup.add(beardMain);

    // Plush fluffy chin bulb for rounded natural beard volume
    const beardPuff = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), fleeceMat);
    beardPuff.position.set(0, -0.06, 0.03);
    beardPuff.scale.set(1.2, 0.9, 0.8);
    beardGroup.add(beardPuff);

    // Fluffy side beard tresses connecting to ears
    [-1, 1].forEach((side) => {
      const sideBeard = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), fleeceMat);
      sideBeard.position.set(side * 0.11, 0.02, -0.04);
      sideBeard.scale.set(0.9, 1.3, 0.8);
      beardGroup.add(sideBeard);

      // Sculpted mustache
      const mustache = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.085, 6, 8), fleeceMat);
      mustache.rotation.z = Math.PI / 2 + side * 0.28;
      mustache.position.set(side * 0.055, 0.065, 0.045);
      beardGroup.add(mustache);
    });
  } else {
    // Stylized chestnut side hair curls
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.078, 12, 10), hairMat);
    tuft.scale.set(1.6, 0.65, 0.85);
    tuft.position.set(0.02, 0.31, 0.165);
    headPivot.add(tuft);

    [-1, 1].forEach((side) => {
      const curl = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.016, 6, 10, Math.PI * 1.2), hairMat);
      curl.position.set(side * 0.18, 0.20, 0.08);
      curl.rotation.y = side * 0.45;
      headPivot.add(curl);
    });
  }

  // --------------------------------------------------------------------------
  // HIGH-FIDELITY SCULPTED 3D CHRISTMAS HAT (100% Solid Seamless Single-Piece Mesh)
  // --------------------------------------------------------------------------
  const hatMat = new THREE.MeshStandardMaterial({
    color: options.hatPrimaryHex ?? (options.tunicHex ?? 0x1e6f3d),
    roughness: 0.58,
    metalness: 0.03,
  });

  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.29, -0.01);
  hatGroup.rotation.x = -0.08;
  headPivot.add(hatGroup);

  // Volumetric plush white fleece brim cuff
  const hatBrim = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.072, 16, 36), fleeceMat);
  hatBrim.rotation.x = Math.PI / 2;
  hatBrim.position.y = 0.02;
  hatGroup.add(hatBrim);

  // Festive golden accent ribbon band around cuff
  const hatTrim = new THREE.Mesh(new THREE.TorusGeometry(0.238, 0.012, 8, 32), goldMat);
  hatTrim.rotation.x = Math.PI / 2;
  hatTrim.position.y = 0.065;
  hatGroup.add(hatTrim);

  // Festive 3D Holly Leaf Sprig & Red Berry pinned to the brim
  const hollyGroup = new THREE.Group();
  hollyGroup.position.set(0.16, 0.07, 0.16);
  hollyGroup.rotation.z = -0.42;
  hatGroup.add(hollyGroup);

  const hollyLeafMat = new THREE.MeshStandardMaterial({ color: 0x1d753b, roughness: 0.5 });
  const hollyBerryMat = new THREE.MeshStandardMaterial({ color: 0xd62428, roughness: 0.28, metalness: 0.1 });

  [-1, 1].forEach((dir) => {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.095, 5), hollyLeafMat);
    leaf.rotation.z = dir * 0.75;
    leaf.rotation.x = 0.2;
    leaf.position.set(dir * 0.025, 0.01, 0);
    hollyGroup.add(leaf);
  });

  const berry = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), hollyBerryMat);
  berry.position.set(0, 0.02, 0.02);
  hollyGroup.add(berry);

  // 100% Solid Single-Piece Curved Hat Mesh (Sem quebras, sem degraus, sem cones empilhados!)
  const solidHatGeo = createSingleSolidHatGeometry();
  const hatMesh = new THREE.Mesh(solidHatGeo, hatMat);
  hatMesh.castShadow = !isSoftwareGl;
  hatGroup.add(hatMesh);

  // Pom-pom & Bell attached at tip
  const hatTipPivot = new THREE.Group();
  hatTipPivot.position.set(0.045, 0.54, -0.21);
  hatGroup.add(hatTipPivot);

  const pomPomBell = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), goldMat);
  pomPomBell.position.set(0, 0.01, 0);
  hatTipPivot.add(pomPomBell);

  const pomPom = new THREE.Mesh(new THREE.SphereGeometry(0.088, 18, 16), fleeceMat);
  pomPom.position.set(0, 0.06, -0.01);
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
  delta: number,
  spinPhase: SpinPhase,
  pushTimer: number,
  wheelSpeedRatio: number
) {
  const phase = rig.options.phaseOffset ?? 0;
  const t = elapsed + phase;
  const role = rig.options.role;
  const dt = Math.min(delta, 0.05);
  const smooth = 9;
  const isCheering = spinPhase === 'spinning' || spinPhase === 'revealing' || spinPhase === 'revealed';

  // Dynamic secondary hat tip motion with gentle wind/bounce responsiveness
  const excitement = spinPhase === 'idle' ? 0.28 : 1.0;
  const targetHatZ = 0.44 + Math.sin(t * (spinPhase === 'idle' ? 2.4 : 8.5)) * 0.16 * excitement;
  const targetHatX = Math.cos(t * (spinPhase === 'idle' ? 1.8 : 6.5)) * 0.08 * excitement;
  rig.hatTipPivot.rotation.z = THREE.MathUtils.damp(rig.hatTipPivot.rotation.z, targetHatZ, 10, dt);
  rig.hatTipPivot.rotation.x = THREE.MathUtils.damp(rig.hatTipPivot.rotation.x, targetHatX, 10, dt);

  if (role === 'pusher') {
    // Ladder Pusher Gnome - High Energy Wheel Spinning Mechanic
    if (spinPhase === 'pushing') {
      const p = THREE.MathUtils.clamp(pushTimer / 0.42, 0, 1);
      if (p < 0.32) {
        const w = p / 0.32;
        const easeWind = Math.pow(w, 2);
        rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(-0.08, 0.24, easeWind);
        rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(0.04, -0.32, easeWind);
        rig.headPivot.rotation.x = THREE.MathUtils.lerp(0, -0.22, easeWind);
        rig.headPivot.rotation.y = 0.35;

        rig.leftArmPivot.rotation.x = THREE.MathUtils.lerp(-0.7, -2.55, easeWind);
        rig.rightArmPivot.rotation.x = THREE.MathUtils.lerp(-1.0, -2.65, easeWind);
        rig.leftArmPivot.rotation.z = THREE.MathUtils.lerp(0.34, 0.46, easeWind);
        rig.rightArmPivot.rotation.z = THREE.MathUtils.lerp(-0.34, -0.46, easeWind);
      } else {
        const h = (p - 0.32) / 0.68;
        const easePush = 1 - Math.pow(1 - h, 3);
        rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(0.24, -0.36, easePush);
        rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(-0.32, 0.42, easePush);
        rig.headPivot.rotation.x = THREE.MathUtils.lerp(-0.22, 0.25, easePush);
        rig.headPivot.rotation.y = 0.38;

        rig.leftArmPivot.rotation.x = THREE.MathUtils.lerp(-2.55, -0.35, easePush);
        rig.rightArmPivot.rotation.x = THREE.MathUtils.lerp(-2.65, -0.25, easePush);
        rig.leftArmPivot.rotation.z = THREE.MathUtils.lerp(0.46, 0.52, easePush);
        rig.rightArmPivot.rotation.z = THREE.MathUtils.lerp(-0.46, -0.52, easePush);
      }
      rig.group.position.y = rig.baseY;
    } else if (isCheering) {
      const bounce = Math.abs(Math.sin(t * 8.5)) * 0.10 * (0.5 + wheelSpeedRatio * 0.5);
      rig.group.position.y = THREE.MathUtils.damp(rig.group.position.y, rig.baseY + bounce, 14, dt);
      rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, Math.sin(t * 6.0) * 0.12, smooth, dt);
      rig.bodyPivot.rotation.x = THREE.MathUtils.damp(rig.bodyPivot.rotation.x, 0.08 + Math.cos(t * 7.0) * 0.06, smooth, dt);

      rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -2.35 + Math.sin(t * 9.5) * 0.35, 12, dt);
      rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -2.35 + Math.cos(t * 9.5) * 0.35, 12, dt);
      rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, 0.42 + Math.sin(t * 5.0) * 0.12, 12, dt);
      rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, -0.42 - Math.sin(t * 5.0) * 0.12, 12, dt);
      rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, 0.28 + Math.sin(t * 4.2) * 0.18, smooth, dt);
    } else {
      rig.group.position.y = THREE.MathUtils.damp(rig.group.position.y, rig.baseY + Math.sin(t * 2.0) * 0.015, smooth, dt);
      rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, -0.06 + Math.sin(t * 1.6) * 0.04, smooth, dt);
      rig.bodyPivot.rotation.x = THREE.MathUtils.damp(rig.bodyPivot.rotation.x, 0.05, smooth, dt);
      rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -0.55 + Math.sin(t * 2.2) * 0.08, smooth, dt);
      rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -0.85 + Math.cos(t * 2.4) * 0.12, smooth, dt);
      rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, 0.36, smooth, dt);
      rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, -0.38, smooth, dt);
      rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, 0.22 + Math.sin(t * 1.1) * 0.18, smooth, dt);
    }
    return;
  }

  if (role === 'rimWatcher') {
    if (isCheering) {
      const waveSpeed = 9.5;
      const cheerHop = Math.abs(Math.sin(t * 7.5)) * 0.075;
      rig.group.position.y = THREE.MathUtils.damp(rig.group.position.y, rig.baseY + cheerHop, 14, dt);
      rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, 0.12 + Math.sin(t * 4.5) * 0.10, smooth, dt);
      rig.bodyPivot.rotation.x = THREE.MathUtils.damp(rig.bodyPivot.rotation.x, Math.sin(t * 7.5) * 0.08, smooth, dt);
      rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -2.35 + Math.sin(t * waveSpeed) * 0.42, 12, dt);
      rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, -0.48 + Math.cos(t * waveSpeed) * 0.18, 12, dt);
      rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -2.15 + Math.cos(t * waveSpeed) * 0.32, 12, dt);
      rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, 0.44 + Math.sin(t * waveSpeed) * 0.14, 12, dt);
      rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, 0.24 + Math.sin(t * 3.8) * 0.18, smooth, dt);
      rig.headPivot.rotation.z = THREE.MathUtils.damp(rig.headPivot.rotation.z, 0.08 + Math.sin(t * 4.2) * 0.10, smooth, dt);
    } else {
      // Curious ladder lookout: subtle breathing, glancing at wheel & waving gently
      rig.group.position.y = THREE.MathUtils.damp(rig.group.position.y, rig.baseY + Math.sin(t * 2.2) * 0.015, smooth, dt);
      rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, 0.08 + Math.sin(t * 1.7) * 0.05, smooth, dt);
      rig.bodyPivot.rotation.x = THREE.MathUtils.damp(rig.bodyPivot.rotation.x, Math.sin(t * 1.4) * 0.04, smooth, dt);
      rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -1.75 + Math.sin(t * 2.8) * 0.18, smooth, dt);
      rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, -0.44 + Math.cos(t * 2.2) * 0.06, smooth, dt);
      rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -0.62 + Math.sin(t * 2.0) * 0.08, smooth, dt);
      rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, 0.36, smooth, dt);
      rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, 0.25 + Math.sin(t * 1.2) * 0.22, smooth, dt);
      rig.headPivot.rotation.z = THREE.MathUtils.damp(rig.headPivot.rotation.z, Math.sin(t * 1.6) * 0.07, smooth, dt);
    }
    return;
  }

  if (role === 'elderOnLog') {
    if (rig.options.seated) {
      const legSpeed = isCheering ? 5.5 : 1.6;
      rig.leftLegPivot.rotation.x = Math.sin(t * legSpeed) * 0.12;
      rig.rightLegPivot.rotation.x = -Math.sin(t * legSpeed) * 0.12;
    } else {
      rig.leftLegPivot.rotation.x = 0;
      rig.rightLegPivot.rotation.x = 0;
    }

    if (isCheering) {
      const cheerBounce = Math.abs(Math.sin(t * 7.2)) * 0.07;
      rig.group.position.y = THREE.MathUtils.damp(rig.group.position.y, rig.baseY + cheerBounce, 13, dt);
      rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, Math.sin(t * 5.2) * 0.11, smooth, dt);
      rig.bodyPivot.rotation.x = THREE.MathUtils.damp(rig.bodyPivot.rotation.x, 0.05 + Math.cos(t * 7.2) * 0.06, smooth, dt);
      rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, -0.18 + Math.sin(t * 3.8) * 0.18, smooth, dt);
      rig.headPivot.rotation.x = THREE.MathUtils.damp(rig.headPivot.rotation.x, Math.sin(t * 6.5) * 0.09, smooth, dt);
      rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -2.05 + Math.sin(t * 9.5) * 0.35, 12, dt);
      rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -2.05 + Math.cos(t * 9.5) * 0.35, 12, dt);
      rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, 0.44 + Math.sin(t * 7.5) * 0.12, 12, dt);
      rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, -0.44 - Math.sin(t * 7.5) * 0.12, 12, dt);
    } else {
      rig.group.position.y = THREE.MathUtils.damp(rig.group.position.y, rig.baseY + Math.sin(t * 1.9) * 0.012, smooth, dt);
      rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, Math.sin(t * 1.4) * 0.05, smooth, dt);
      rig.bodyPivot.rotation.x = THREE.MathUtils.damp(rig.bodyPivot.rotation.x, Math.cos(t * 1.6) * 0.03, smooth, dt);
      rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, Math.sin(t * 0.95) * 0.24, smooth, dt);
      rig.headPivot.rotation.x = THREE.MathUtils.damp(rig.headPivot.rotation.x, Math.sin(t * 1.5) * 0.05, smooth, dt);
      rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -0.35 + Math.sin(t * 1.9) * 0.09, smooth, dt);
      rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -0.55 + Math.cos(t * 1.9) * 0.11, smooth, dt);
      rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, 0.36, smooth, dt);
      rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, -0.36, smooth, dt);
    }
    return;
  }

  // Ground & Bucket Spectator Gnomes
  if (isCheering) {
    const jump = Math.abs(Math.sin(t * 7.8)) * 0.16;
    rig.group.position.y = THREE.MathUtils.damp(rig.group.position.y, rig.baseY + jump, 15, dt);
    rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, Math.sin(t * 7.8) * 0.11, smooth, dt);
    rig.bodyPivot.rotation.x = THREE.MathUtils.damp(rig.bodyPivot.rotation.x, Math.cos(t * 7.8) * 0.07, smooth, dt);
    rig.headPivot.rotation.y = THREE.MathUtils.damp(
      rig.headPivot.rotation.y,
      (role === 'groundHelper' ? 0.22 : -0.22) + Math.sin(t * 4.4) * 0.18,
      smooth,
      dt
    );
    rig.headPivot.rotation.z = THREE.MathUtils.damp(rig.headPivot.rotation.z, Math.sin(t * 5.5) * 0.10, smooth, dt);
    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -2.42 + Math.sin(t * 10.0) * 0.38, 12, dt);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -2.42 - Math.sin(t * 10.0) * 0.38, 12, dt);
    rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, 0.45 + Math.cos(t * 6.0) * 0.1, 12, dt);
    rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, -0.45 - Math.cos(t * 6.0) * 0.1, 12, dt);
    // Subtle joyful kick during jump peak
    const kickWave = Math.sin(t * 7.8) * 0.14;
    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, kickWave, 12, dt);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, -kickWave, 12, dt);
  } else {
    rig.group.position.y = THREE.MathUtils.damp(rig.group.position.y, rig.baseY + Math.sin(t * 2.1) * 0.012, smooth, dt);
    rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, Math.sin(t * 1.55) * 0.055, smooth, dt);
    rig.bodyPivot.rotation.x = THREE.MathUtils.damp(rig.bodyPivot.rotation.x, Math.cos(t * 1.8) * 0.035, smooth, dt);
    rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, Math.sin(t * 1.15) * 0.26, smooth, dt);
    rig.headPivot.rotation.z = THREE.MathUtils.damp(rig.headPivot.rotation.z, Math.sin(t * 1.45) * 0.07, smooth, dt);
    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -0.32 + Math.sin(t * 2.1) * 0.10, smooth, dt);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -0.85 + Math.sin(t * 2.4) * 0.18, smooth, dt);
    rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, 0.36 + Math.sin(t * 1.7) * 0.05, smooth, dt);
    rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, -0.38 - Math.cos(t * 1.7) * 0.05, smooth, dt);
    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, 0, smooth, dt);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, 0, smooth, dt);
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
  scarfTailPivot: THREE.Group;
  legPivots: { upper: THREE.Group; lower: THREE.Group }[];
  grazingStyle: boolean;
  phaseOffset: number;
}

export function createReindeer(
  grazingStyle: boolean,
  phaseOffset: number,
  isSoftwareGl: boolean,
  scarfColorHex: number = 0xd62428,
  scarfTrimHex: number = 0xf5ca65
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

  // --------------------------------------------------------------------------
  // ENHANCED REINDEER 3D SILHOUETTE & PLUSH CUSHIONED SADDLE
  // --------------------------------------------------------------------------
  // Clean Reindeer Body Silhouette
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.31, 0.78, 12, 16), coatMat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0.94, 0);
  body.scale.set(1.05, 1.0, 1.02);
  body.castShadow = !isSoftwareGl;
  body.receiveShadow = !isSoftwareGl;
  group.add(body);

  // Muscular shoulder hump for majestic reindeer silhouette
  const shoulderHump = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), coatMat);
  shoulderHump.scale.set(1.1, 0.85, 0.95);
  shoulderHump.position.set(0.18, 1.02, 0);
  group.add(shoulderHump);

  // Soft Cream Chest Tuft
  const chestTuft = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), creamFurMat);
  chestTuft.scale.set(0.85, 1.22, 0.88);
  chestTuft.position.set(0.40, 0.89, 0);
  group.add(chestTuft);

  // 4 Articulated Two-Segment Legs (Stronger Thighs / Coxas fortes + Polished Hooves)
  const legCoords = [
    { x: 0.34, z: 0.15 },
    { x: 0.34, z: -0.15 },
    { x: -0.34, z: 0.15 },
    { x: -0.34, z: -0.15 },
  ];
  const legPivots: { upper: THREE.Group; lower: THREE.Group }[] = [];

  legCoords.forEach((lc, idx) => {
    // Upper leg pivot attached to body (stronger, thicker thighs)
    const upperLegPivot = new THREE.Group();
    upperLegPivot.position.set(lc.x, 0.82, lc.z);
    group.add(upperLegPivot);

    const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.062, 0.44, 12), coatMat);
    upperLeg.position.set(0, -0.22, 0);
    upperLeg.rotation.x = idx % 2 === 0 ? 0.12 : -0.12;
    upperLeg.castShadow = !isSoftwareGl;
    upperLegPivot.add(upperLeg);

    // Lower leg pivot (knee joint)
    const lowerLegPivot = new THREE.Group();
    lowerLegPivot.position.set(0, -0.44, 0);
    upperLegPivot.add(lowerLegPivot);

    const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.038, 0.40, 10), coatMat);
    lowerLeg.position.set(0, -0.20, 0);
    lowerLeg.rotation.x = idx % 2 === 0 ? -0.15 : 0.15;
    lowerLeg.castShadow = !isSoftwareGl;
    lowerLegPivot.add(lowerLeg);

    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, 0.08, 10), hoofMat);
    hoof.position.set(0, -0.42, 0);
    lowerLegPivot.add(hoof);

    legPivots.push({ upper: upperLegPivot, lower: lowerLegPivot });
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

  // Cozy Festive Reindeer Scarf wrapped around the neck
  const scarfMat = new THREE.MeshStandardMaterial({
    color: scarfColorHex,
    roughness: 0.65,
    metalness: 0.04,
  });
  const scarfTrimMat = new THREE.MeshStandardMaterial({
    color: scarfTrimHex,
    roughness: 0.52,
    metalness: 0.14,
  });

  const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.050, 12, 24), scarfMat);
  scarfCollar.rotation.x = Math.PI / 2;
  scarfCollar.position.set(0.08, 0.20, 0);
  scarfCollar.castShadow = !isSoftwareGl;
  neckPivot.add(scarfCollar);

  const scarfTrimRing = new THREE.Mesh(new THREE.TorusGeometry(0.192, 0.016, 8, 24), scarfTrimMat);
  scarfTrimRing.rotation.x = Math.PI / 2;
  scarfTrimRing.position.set(0.08, 0.162, 0);
  neckPivot.add(scarfTrimRing);

  const scarfKnot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), scarfMat);
  scarfKnot.position.set(0.24, 0.19, 0.13);
  neckPivot.add(scarfKnot);

  const scarfTailPivot = new THREE.Group();
  scarfTailPivot.position.set(0.25, 0.18, 0.14);
  scarfTailPivot.rotation.z = 0.26;
  scarfTailPivot.rotation.x = 0.18;
  neckPivot.add(scarfTailPivot);

  const tailLong = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.28, 0.085), scarfMat);
  tailLong.position.set(0.02, -0.14, 0);
  tailLong.castShadow = !isSoftwareGl;
  scarfTailPivot.add(tailLong);

  const tailLongStripe = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.045, 0.088), scarfTrimMat);
  tailLongStripe.position.set(0.02, -0.24, 0);
  scarfTailPivot.add(tailLongStripe);

  const tailShort = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.20, 0.072), scarfMat);
  tailShort.position.set(-0.01, -0.10, -0.05);
  tailShort.rotation.x = -0.22;
  tailShort.castShadow = !isSoftwareGl;
  scarfTailPivot.add(tailShort);

  const tailShortStripe = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.038, 0.075), scarfTrimMat);
  tailShortStripe.position.set(-0.01, -0.17, -0.065);
  tailShortStripe.rotation.x = -0.22;
  scarfTailPivot.add(tailShortStripe);

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

  // Glowing Luminous Red Rudolph Nose (Nariz Vermelho Brilhante estilo Rodolfo)
  const redNoseMat = new THREE.MeshStandardMaterial({
    color: 0xff1818,
    emissive: 0xff0a0a,
    emissiveIntensity: 0.95,
    roughness: 0.12,
    metalness: 0.08,
  });
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 14), redNoseMat);
  noseTip.position.set(0.34, -0.02, 0);
  headPivot.add(noseTip);

  // Soft red holiday glow illuminating muzzle and reindeer face
  const noseLight = new THREE.PointLight(0xff2222, isSoftwareGl ? 0.5 : 1.1, 1.8, 1.8);
  noseLight.position.set(0.36, -0.01, 0);
  headPivot.add(noseLight);

  // --------------------------------------------------------------------------
  // FESTIVE CABESTRO / HALTER & BRIDLE (Red Leather Straps + Brass Buckles & Rings)
  // --------------------------------------------------------------------------
  const halterMat = crimsonHarnessMat;

  // 1. Noseband (Focinho / Cinta ao redor do focinho)
  const noseband = new THREE.Mesh(new THREE.TorusGeometry(0.096, 0.016, 8, 20), halterMat);
  noseband.rotation.y = Math.PI / 2;
  noseband.position.set(0.23, -0.03, 0);
  headPivot.add(noseband);

  // 2. Browband / Headstall (Testeira / Cinta passando atrás dos chifres/orelhas)
  const headstall = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.016, 8, 22), halterMat);
  headstall.rotation.y = Math.PI / 2;
  headstall.rotation.x = -0.32;
  headstall.position.set(0.01, 0.06, 0);
  headPivot.add(headstall);

  // 3. Left and Right Cheek Straps (Cocheiras laterais conectando focinho à cabeça)
  [-1, 1].forEach((side) => {
    // Cheek strap
    const cheekStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.24, 6), halterMat);
    cheekStrap.position.set(0.12, 0.01, side * 0.096);
    cheekStrap.rotation.z = Math.PI * 0.44;
    cheekStrap.rotation.y = side * 0.18;
    headPivot.add(cheekStrap);

    // Brass Side Ring / Fivela de Latão Dourada
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 8, 14), goldBellMat);
    ring.position.set(0.22, -0.02, side * 0.098);
    ring.rotation.y = side * (Math.PI / 2);
    headPivot.add(ring);

    // Small festive brass stud / tachinha dourada na testeira
    const stud = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), goldBellMat);
    stud.position.set(0.02, 0.12, side * 0.13);
    headPivot.add(stud);
  });

  // Hanging chin lead ring / argola inferior do cabestro
  const chinRing = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 8, 14), goldBellMat);
  chinRing.position.set(0.20, -0.13, 0);
  chinRing.rotation.x = Math.PI / 2;
  headPivot.add(chinRing);

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
    scarfTailPivot,
    legPivots,
    grazingStyle,
    phaseOffset,
  };
}

export function updateReindeerIdle(
  rig: ReindeerRig,
  elapsed: number,
  delta: number,
  spinPhase: SpinPhase
) {
  const t = elapsed + rig.phaseOffset;
  const dt = Math.min(delta, 0.05);
  const isExcited = spinPhase === 'spinning' || spinPhase === 'revealing' || spinPhase === 'revealed';

  if (isExcited) {
    // Alert, excited reindeer looking toward the spinning wheel / revealed prize!
    const targetNeckZ = -0.22 + Math.sin(t * 4.2) * 0.08;
    const targetHeadY = (rig.grazingStyle ? -0.32 : 0.32) + Math.sin(t * 3.0) * 0.14;
    const targetHeadZ = Math.sin(t * 5.0) * 0.08;
    rig.neckPivot.rotation.z = THREE.MathUtils.damp(rig.neckPivot.rotation.z, targetNeckZ, 7, dt);
    rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, targetHeadY, 7, dt);
    rig.headPivot.rotation.z = THREE.MathUtils.damp(rig.headPivot.rotation.z, targetHeadZ, 7, dt);
    rig.headPivot.rotation.x = THREE.MathUtils.damp(rig.headPivot.rotation.x, Math.cos(t * 3.6) * 0.07, 7, dt);
  } else if (rig.grazingStyle) {
    // Natural grazing rhythm: dips head to sniff snow, then lifts head curiously to look around
    const grazeWave = Math.sin(t * 0.62);
    const targetNeckZ = -0.78 + grazeWave * 0.32;
    const targetHeadY = Math.sin(t * 0.92) * 0.28;
    const targetHeadZ = 0.32 - grazeWave * 0.18;
    rig.neckPivot.rotation.z = THREE.MathUtils.damp(rig.neckPivot.rotation.z, targetNeckZ, 5, dt);
    rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, targetHeadY, 5, dt);
    rig.headPivot.rotation.z = THREE.MathUtils.damp(rig.headPivot.rotation.z, targetHeadZ, 5, dt);
    rig.headPivot.rotation.x = THREE.MathUtils.damp(rig.headPivot.rotation.x, Math.sin(t * 1.4) * 0.05, 5, dt);
  } else {
    const targetNeckZ = -0.28 + Math.sin(t * 0.85) * 0.08;
    const targetHeadY = Math.sin(t * 0.72) * 0.36;
    const targetHeadX = Math.cos(t * 0.95) * 0.09;
    rig.neckPivot.rotation.z = THREE.MathUtils.damp(rig.neckPivot.rotation.z, targetNeckZ, 5, dt);
    rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, targetHeadY, 5, dt);
    rig.headPivot.rotation.z = THREE.MathUtils.damp(rig.headPivot.rotation.z, Math.sin(t * 0.65) * 0.06, 5, dt);
    rig.headPivot.rotation.x = THREE.MathUtils.damp(rig.headPivot.rotation.x, targetHeadX, 5, dt);
  }

  const earFreqL = isExcited ? 4.5 : 2.7;
  const earFreqR = isExcited ? 5.1 : 3.1;
  const earTwitchL = Math.pow(Math.max(0, Math.sin(t * earFreqL)), 6) * 0.42;
  const earTwitchR = Math.pow(Math.max(0, Math.sin(t * earFreqR + 1.9)), 6) * 0.42;
  rig.leftEarPivot.rotation.z = earTwitchL;
  rig.rightEarPivot.rotation.z = -earTwitchR;
  rig.tailPivot.rotation.x = Math.sin(t * (isExcited ? 7.5 : 2.6)) * (isExcited ? 0.24 : 0.14);
  rig.scarfTailPivot.rotation.z = 0.26 + Math.sin(t * (isExcited ? 5.5 : 2.5)) * (isExcited ? 0.14 : 0.07);
  rig.scarfTailPivot.rotation.x = 0.18 + Math.cos(t * 2.1) * 0.06;

  // Articulated 2-segment leg stepping & prancing motion
  if (rig.legPivots && rig.legPivots.length === 4) {
    const legFreq = isExcited ? 4.4 : 1.7;
    const legAmp = isExcited ? 0.11 : 0.055;
    rig.legPivots.forEach((lp, idx) => {
      // Diagonal gait pairing: (0,3) vs (1,2)
      const diagPhase = idx === 0 || idx === 3 ? 0 : Math.PI;
      const legWave = Math.sin(t * legFreq + diagPhase);
      const lift = Math.max(0, legWave);
      lp.upper.rotation.x = THREE.MathUtils.damp(lp.upper.rotation.x, 0.05 + legWave * legAmp, 10, dt);
      lp.lower.rotation.x = THREE.MathUtils.damp(lp.lower.rotation.x, -0.08 - lift * legAmp * 1.45, 10, dt);
    });
  }
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

// ============================================================================
// 3D ANIMATED CHRISTMAS SNOWMAN (Top Hat, Striped Scarf, Carrot Nose & Stick Arms)
// ============================================================================

export interface SnowmanRig {
  group: THREE.Group;
  headPivot: THREE.Group;
  scarfTailPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  baseY: number;
}

export function createSnowman(isSoftwareGl: boolean): SnowmanRig {
  const group = new THREE.Group();

  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf5f9ff,
    roughness: 0.65,
    metalness: 0.02,
  });
  const coalMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.45,
  });
  const carrotMat = new THREE.MeshStandardMaterial({
    color: 0xf26419,
    roughness: 0.52,
  });
  const topHatMat = new THREE.MeshStandardMaterial({
    color: 0x221f24,
    roughness: 0.38,
    metalness: 0.1,
  });
  const crimsonRibbonMat = new THREE.MeshStandardMaterial({
    color: 0xc82227,
    roughness: 0.65,
  });
  const woodStickMat = new THREE.MeshStandardMaterial({
    color: 0x4a2a16,
    roughness: 0.85,
  });

  // 1. Bottom Snowball (Base)
  const bottomBall = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 16), snowMat);
  bottomBall.position.y = 0.35;
  bottomBall.castShadow = !isSoftwareGl;
  bottomBall.receiveShadow = !isSoftwareGl;
  group.add(bottomBall);

  // 2. Middle Snowball (Torso)
  const midBall = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 14), snowMat);
  midBall.position.y = 0.82;
  midBall.castShadow = !isSoftwareGl;
  group.add(midBall);

  // Two prominent coal buttons seated cleanly on the front surface of the middle snowball
  const buttonOffsets = [
    { y: 0.86, z: 0.284 },
    { y: 0.73, z: 0.272 },
  ];
  buttonOffsets.forEach((bo) => {
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), coalMat);
    button.position.set(0, bo.y, bo.z);
    group.add(button);
  });

  // 3. Wooden Stick Arms (Articulated with twigs)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.25, 0.88, 0);
  leftArmPivot.rotation.z = 0.45;
  group.add(leftArmPivot);

  const leftArmBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.42, 6), woodStickMat);
  leftArmBranch.position.set(-0.16, 0.08, 0);
  leftArmBranch.rotation.z = 1.1;
  leftArmPivot.add(leftArmBranch);

  const leftTwig = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.014, 0.16, 5), woodStickMat);
  leftTwig.position.set(-0.24, 0.18, 0.04);
  leftTwig.rotation.z = 0.45;
  leftArmPivot.add(leftTwig);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.25, 0.88, 0);
  rightArmPivot.rotation.z = -0.45;
  group.add(rightArmPivot);

  const rightArmBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.42, 6), woodStickMat);
  rightArmBranch.position.set(0.16, 0.08, 0);
  rightArmBranch.rotation.z = -1.1;
  rightArmPivot.add(rightArmBranch);

  const rightTwig = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.014, 0.16, 5), woodStickMat);
  rightTwig.position.set(0.24, 0.18, 0.04);
  rightTwig.rotation.z = -0.45;
  rightArmPivot.add(rightTwig);

  // 4. Cozy Crimson Scarf around neck
  const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.046, 12, 24), crimsonRibbonMat);
  scarfRing.rotation.x = Math.PI / 2;
  scarfRing.position.y = 1.05;
  group.add(scarfRing);

  // Scarf knot resting in front
  const scarfKnot = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), crimsonRibbonMat);
  scarfKnot.position.set(0.10, 1.04, 0.22);
  group.add(scarfKnot);

  // Scarf dangling tail (angled forward over the chest slope to never penetrate the snowball)
  const scarfTailPivot = new THREE.Group();
  scarfTailPivot.position.set(0.10, 1.03, 0.25);
  scarfTailPivot.rotation.x = -0.34; // Angled forward away from chest
  group.add(scarfTailPivot);

  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.32, 0.022), crimsonRibbonMat);
  scarfTail.position.set(0, -0.15, 0.02);
  scarfTail.rotation.z = 0.15;
  scarfTailPivot.add(scarfTail);

  // 5. Head Pivot (Top Snowball + Eyes + Carrot Nose + Smile + Top Hat)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.20, 0);
  group.add(headPivot);

  const headBall = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), snowMat);
  headBall.castShadow = !isSoftwareGl;
  headPivot.add(headBall);

  // Charcoal stone eyes
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), coalMat);
    eye.position.set(side * 0.072, 0.06, 0.195);
    headPivot.add(eye);
  });

  // Long conical carrot nose
  const carrotNose = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.22, 10), carrotMat);
  carrotNose.rotation.x = Math.PI / 2;
  carrotNose.position.set(0, 0.015, 0.30);
  headPivot.add(carrotNose);

  // Charcoal stone smile arc
  for (let s = -2; s <= 2; s++) {
    const smileStone = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), coalMat);
    const angle = (s * Math.PI) / 10;
    smileStone.position.set(Math.sin(angle) * 0.09, -0.09 + Math.abs(s) * 0.015, 0.19);
    headPivot.add(smileStone);
  }

  // Classic Victorian Top Hat
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.024, 20), topHatMat);
  hatBrim.position.y = 0.19;
  headPivot.add(hatBrim);

  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.165, 0.28, 20), topHatMat);
  hatCrown.position.y = 0.33;
  hatCrown.castShadow = !isSoftwareGl;
  headPivot.add(hatCrown);

  // Crimson sash ribbon band around top hat
  const hatRibbon = new THREE.Mesh(new THREE.CylinderGeometry(0.174, 0.171, 0.06, 20), crimsonRibbonMat);
  hatRibbon.position.y = 0.23;
  headPivot.add(hatRibbon);

  // Holly leaf accent on top hat
  const hollyLeaf = new THREE.Mesh(
    new THREE.ConeGeometry(0.035, 0.09, 5),
    new THREE.MeshStandardMaterial({ color: 0x1f7840, roughness: 0.6 })
  );
  hollyLeaf.rotation.z = 0.8;
  hollyLeaf.position.set(0.15, 0.25, 0.06);
  headPivot.add(hollyLeaf);

  const hollyBerry = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0xd9262b, roughness: 0.3 })
  );
  hollyBerry.position.set(0.14, 0.24, 0.08);
  headPivot.add(hollyBerry);

  return {
    group,
    headPivot,
    scarfTailPivot,
    leftArmPivot,
    rightArmPivot,
    baseY: 0,
  };
}

export function updateSnowmanIdle(rig: SnowmanRig, elapsed: number, delta: number, spinPhase: SpinPhase) {
  const t = elapsed;
  const dt = Math.min(delta, 0.05);
  const isExcited = spinPhase === 'spinning' || spinPhase === 'revealing' || spinPhase === 'revealed';

  // Gentle body rock and cheerful bounce when excited
  const targetY = isExcited ? rig.baseY + Math.abs(Math.sin(t * 7.2)) * 0.11 : rig.baseY;
  const targetBodyRoll = isExcited ? Math.sin(t * 5.2) * 0.09 : Math.sin(t * 1.3) * 0.035;
  rig.group.position.y = THREE.MathUtils.damp(rig.group.position.y, targetY, 13, dt);
  rig.group.rotation.z = THREE.MathUtils.damp(rig.group.rotation.z, targetBodyRoll, 9, dt);

  // Expressive head look & nod
  const targetHeadY = Math.sin(t * (isExcited ? 3.2 : 1.15)) * (isExcited ? 0.30 : 0.16);
  const targetHeadZ = Math.cos(t * (isExcited ? 4.4 : 1.45)) * (isExcited ? 0.14 : 0.06);
  rig.headPivot.rotation.y = THREE.MathUtils.damp(rig.headPivot.rotation.y, targetHeadY, 9, dt);
  rig.headPivot.rotation.z = THREE.MathUtils.damp(rig.headPivot.rotation.z, targetHeadZ, 9, dt);

  // Scarf fluttering gently in winter breeze
  rig.scarfTailPivot.rotation.x = -0.34 + Math.sin(t * 2.8) * 0.07;
  rig.scarfTailPivot.rotation.z = 0.15 + Math.sin(t * 3.4) * 0.13 + (isExcited ? 0.22 : 0);
  rig.scarfTailPivot.rotation.y = Math.cos(t * 2.5) * 0.09;

  // Stick arms: resting naturally downwards at sides when idle, raising HIGH up to cheer when excited!
  // (Left branch extends along -X,+Y so positive rotation.z lowers it and negative rotation.z raises it;
  //  Right branch extends along +X,+Y so negative rotation.z lowers it and positive rotation.z raises it.)
  if (isExcited) {
    const targetLeftZ = -0.52 + Math.sin(t * 8.5) * 0.28;
    const targetRightZ = 0.52 - Math.cos(t * 8.5) * 0.28;
    const targetLeftX = -0.25 + Math.sin(t * 7.2) * 0.22;
    const targetRightX = -0.25 + Math.cos(t * 7.2) * 0.22;
    rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, targetLeftZ, 11, dt);
    rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, targetRightZ, 11, dt);
    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, targetLeftX, 11, dt);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, targetRightX, 11, dt);
  } else {
    const targetLeftZ = 0.82 + Math.sin(t * 1.6) * 0.06;
    const targetRightZ = -0.82 - Math.cos(t * 1.6) * 0.06;
    const targetLeftX = 0.08 + Math.sin(t * 1.5) * 0.05;
    const targetRightX = 0.08 + Math.cos(t * 1.5) * 0.05;
    rig.leftArmPivot.rotation.z = THREE.MathUtils.damp(rig.leftArmPivot.rotation.z, targetLeftZ, 8, dt);
    rig.rightArmPivot.rotation.z = THREE.MathUtils.damp(rig.rightArmPivot.rotation.z, targetRightZ, 8, dt);
    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, targetLeftX, 8, dt);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, targetRightX, 8, dt);
  }
}
