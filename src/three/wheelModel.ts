import * as THREE from 'three';
import { WheelItem } from '../types/wheel';
import { createCenterHubTexture, createWheelFaceTexture } from './textures';

export interface WheelAssembly {
  root: THREE.Group;
  rotorGroup: THREE.Group;
  pointerPivot: THREE.Group;
  hubButtonGroup: THREE.Group;
  hubClickTarget: THREE.Mesh;
  wheelRadius: number;
  updateAnimation: (elapsed: number, isSpinning: boolean) => void;
  rebuildSlices: (items: WheelItem[]) => void;
  dispose: () => void;
}

export function createWheelAssembly(
  initialItems: WheelItem[],
  woodTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  glowTex: THREE.Texture,
  maxAnisotropy: number,
  isSoftwareGl: boolean
): WheelAssembly {
  const root = new THREE.Group();
  const wheelRadius = 2.28;
  const wheelDepth = 0.42;
  const centerHeight = 2.68;

  // Materials
  const darkMahoganyMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x5c2c14,
    roughness: 0.58,
    metalness: 0.08,
  });

  const carvedTimberMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x472512,
    roughness: 0.82,
    metalness: 0.04,
  });

  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.22,
    metalness: 0.92,
  });

  const crimsonRimMat = new THREE.MeshStandardMaterial({
    color: 0x9e1212,
    roughness: 0.35,
    metalness: 0.22,
  });

  const snowCapMat = new THREE.MeshStandardMaterial({
    color: 0xeef5ff,
    roughness: 0.72,
    metalness: 0.03,
  });

  const snowSphereGeo = new THREE.SphereGeometry(1, 16, 12);

  // 1. Heavy Timber Pedestal & Support A-Frame Integrated into Snow
  const baseGroup = new THREE.Group();
  root.add(baseGroup);

  // Ground contact shadow beneath the wheel stand
  const shadowGeo = new THREE.PlaneGeometry(5.6, 2.9);
  shadowGeo.rotateX(-Math.PI / 2);
  const baseShadow = new THREE.Mesh(
    shadowGeo,
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.68,
    })
  );
  baseShadow.position.set(0, 0.03, 0);
  baseGroup.add(baseShadow);

  // Heavy sled beams resting in the snow
  const sledBeamGeo = new THREE.BoxGeometry(3.2, 0.34, 1.15);
  const sledBeam = new THREE.Mesh(sledBeamGeo, carvedTimberMat);
  sledBeam.position.set(0, 0.17, 0);
  sledBeam.castShadow = !isSoftwareGl;
  sledBeam.receiveShadow = !isSoftwareGl;
  baseGroup.add(sledBeam);

  // Left & Right angled rear stanchions holding the wheel axle
  const stanchionGeo = new THREE.BoxGeometry(0.32, 3.05, 0.34);
  const leftStanchion = new THREE.Mesh(stanchionGeo, carvedTimberMat);
  leftStanchion.position.set(-0.92, 1.45, -0.34);
  leftStanchion.rotation.z = -0.28;
  leftStanchion.castShadow = !isSoftwareGl;
  leftStanchion.receiveShadow = !isSoftwareGl;
  baseGroup.add(leftStanchion);

  const rightStanchion = new THREE.Mesh(stanchionGeo, carvedTimberMat);
  rightStanchion.position.set(0.92, 1.45, -0.34);
  rightStanchion.rotation.z = 0.28;
  rightStanchion.castShadow = !isSoftwareGl;
  rightStanchion.receiveShadow = !isSoftwareGl;
  baseGroup.add(rightStanchion);

  // Rear axle bearing block
  const axleHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.5, 0.55, 20),
    carvedTimberMat
  );
  axleHousing.rotation.x = Math.PI / 2;
  axleHousing.position.set(0, centerHeight, -0.36);
  axleHousing.castShadow = !isSoftwareGl;
  baseGroup.add(axleHousing);

  // Organic, softly contoured snow accumulation banked around the wheel base
  const snowDriftGroup = new THREE.Group();
  baseGroup.add(snowDriftGroup);

  // Soft low-profile drifts spreading naturally around the foot of the wheel
  const moundData = [
    // Front gentle bank (left)
    { x: -1.25, y: 0.08, z: 0.38, rx: 0.05, ry: 0.2, rz: -0.06, sx: 0.82, sy: 0.18, sz: 0.55 },
    // Front gentle bank (center-left)
    { x: -0.45, y: 0.10, z: 0.42, rx: -0.04, ry: -0.1, rz: 0.04, sx: 0.68, sy: 0.20, sz: 0.52 },
    // Front gentle bank (center-right)
    { x: 0.38, y: 0.09, z: 0.40, rx: 0.06, ry: 0.3, rz: -0.03, sx: 0.72, sy: 0.19, sz: 0.50 },
    // Front gentle bank (right)
    { x: 1.15, y: 0.08, z: 0.35, rx: -0.05, ry: 0.15, rz: 0.05, sx: 0.75, sy: 0.17, sz: 0.48 },
    // Side powder drifts curling around the wheel rim
    { x: -1.95, y: 0.14, z: 0.15, rx: 0.12, ry: 0.4, rz: -0.1, sx: 0.65, sy: 0.22, sz: 0.52 },
    { x: 1.85, y: 0.13, z: 0.12, rx: -0.1, ry: -0.3, rz: 0.08, sx: 0.62, sy: 0.21, sz: 0.50 },
    // Rear drifts around the back stanchions
    { x: -0.85, y: 0.10, z: -0.35, rx: 0, ry: 0, rz: 0, sx: 0.85, sy: 0.18, sz: 0.52 },
    { x: 0.85, y: 0.10, z: -0.35, rx: 0, ry: 0, rz: 0, sx: 0.85, sy: 0.18, sz: 0.52 },
    // Subtle low-profile center drift
    { x: 0.0, y: 0.07, z: 0.46, rx: 0.02, ry: 0, rz: 0, sx: 0.52, sy: 0.12, sz: 0.38 },
  ];

  moundData.forEach((d) => {
    const driftMesh = new THREE.Mesh(snowSphereGeo, snowCapMat);
    driftMesh.position.set(d.x, d.y, d.z);
    driftMesh.rotation.set(d.rx, d.ry, d.rz);
    driftMesh.scale.set(d.sx, d.sy, d.sz);
    driftMesh.receiveShadow = !isSoftwareGl;
    snowDriftGroup.add(driftMesh);
  });

  // Soft snow dusting arc resting directly on the lower wooden rim curve of the wheel
  const bottomRimSnowGeo = new THREE.TorusGeometry(
    wheelRadius + 0.06,
    0.08,
    10,
    32,
    Math.PI * 0.46
  );
  const bottomRimSnow = new THREE.Mesh(bottomRimSnowGeo, snowCapMat);
  bottomRimSnow.rotation.z = Math.PI * 1.27; // positioned at bottom of the circle
  bottomRimSnow.position.set(0, centerHeight, 0.12);
  bottomRimSnow.receiveShadow = !isSoftwareGl;
  baseGroup.add(bottomRimSnow);

  // 2. Stationary Outer Casing Ring + Top Snow Drift + Clapper Pointer
  const stationaryFrame = new THREE.Group();
  stationaryFrame.position.set(0, centerHeight, 0);
  root.add(stationaryFrame);

  // Deep cylindrical drum shell around the wheel
  const outerDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(wheelRadius + 0.18, wheelRadius + 0.18, wheelDepth, 64, 1, true),
    darkMahoganyMat
  );
  outerDrum.rotation.x = Math.PI / 2;
  outerDrum.castShadow = !isSoftwareGl;
  outerDrum.receiveShadow = !isSoftwareGl;
  stationaryFrame.add(outerDrum);

  // Back wooden closure plate of wheel
  const backPlate = new THREE.Mesh(
    new THREE.CircleGeometry(wheelRadius + 0.16, 64),
    carvedTimberMat
  );
  backPlate.rotation.y = Math.PI;
  backPlate.position.z = -wheelDepth / 2;
  backPlate.castShadow = !isSoftwareGl;
  stationaryFrame.add(backPlate);

  // Front sculpted mahogany & crimson outer torus bezel
  const outerWoodTorus = new THREE.Mesh(
    new THREE.TorusGeometry(wheelRadius + 0.11, 0.13, 20, 72),
    darkMahoganyMat
  );
  outerWoodTorus.position.z = wheelDepth / 2 - 0.04;
  outerWoodTorus.castShadow = !isSoftwareGl;
  outerWoodTorus.receiveShadow = !isSoftwareGl;
  stationaryFrame.add(outerWoodTorus);

  // Inner brushed-brass accent bezel ring
  const innerBrassTorus = new THREE.Mesh(
    new THREE.TorusGeometry(wheelRadius + 0.02, 0.038, 16, 72),
    brushedBrassMat
  );
  innerBrassTorus.position.z = wheelDepth / 2 + 0.03;
  stationaryFrame.add(innerBrassTorus);

  // Crimson inner trim ring
  const crimsonTrimTorus = new THREE.Mesh(
    new THREE.TorusGeometry(wheelRadius + 0.17, 0.032, 12, 72),
    crimsonRimMat
  );
  crimsonTrimTorus.position.z = wheelDepth / 2 + 0.02;
  stationaryFrame.add(crimsonTrimTorus);

  // 2b. 24 Animated Festive Marquee LED Light Bulbs (Enlarged + Volumetric Light Halos!)
  const marqueeBulbGroup = new THREE.Group();
  stationaryFrame.add(marqueeBulbGroup);

  const bulbCount = 24;
  const bulbRadius = wheelRadius + 0.175;
  const bulbColors = [
    0xff1744, // Vivid Christmas Red
    0xffd700, // Bright Gold
    0x00e676, // Emerald Green
    0x00e5ff, // Cyan Blue
    0xff4081, // Vivid Pink
    0xfff59d, // Warm White
    0xff9100, // Orange
    0xd500f9, // Purple Light
  ];

  const bulbSocketGeo = new THREE.CylinderGeometry(0.042, 0.052, 0.06, 12);
  bulbSocketGeo.rotateX(Math.PI / 2);
  const bulbGlassGeo = new THREE.SphereGeometry(0.082, 16, 12); // Prominent enlarged bulbs!

  interface BulbItem {
    mesh: THREE.Mesh;
    mat: THREE.MeshStandardMaterial;
    halo: THREE.Sprite;
    baseColor: number;
    phase: number;
  }
  const marqueeBulbs: BulbItem[] = [];

  for (let b = 0; b < bulbCount; b++) {
    const angle = (b / bulbCount) * Math.PI * 2;
    // Leave room near top 12 o'clock for the golden clapper mount
    const angleFromTop = Math.abs(Math.atan2(Math.sin(angle - Math.PI / 2), Math.cos(angle - Math.PI / 2)));
    if (angleFromTop < 0.22) continue;

    const socket = new THREE.Mesh(bulbSocketGeo, brushedBrassMat);
    socket.position.set(
      Math.cos(angle) * bulbRadius,
      Math.sin(angle) * bulbRadius,
      wheelDepth / 2 + 0.02
    );
    socket.rotation.z = angle - Math.PI / 2;
    marqueeBulbGroup.add(socket);

    const baseColor = bulbColors[b % bulbColors.length];
    const bulbMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 3.2,
      roughness: 0.1,
      metalness: 0.1,
    });
    const bulbMesh = new THREE.Mesh(bulbGlassGeo, bulbMat);
    bulbMesh.position.set(
      Math.cos(angle) * bulbRadius,
      Math.sin(angle) * bulbRadius,
      wheelDepth / 2 + 0.065
    );
    marqueeBulbGroup.add(bulbMesh);

    // Volumetric additive light halo sprite attached to each bulb!
    const haloMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: baseColor,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(0.48, 0.48, 0.48);
    halo.position.set(
      Math.cos(angle) * bulbRadius,
      Math.sin(angle) * bulbRadius,
      wheelDepth / 2 + 0.085
    );
    marqueeBulbGroup.add(halo);

    marqueeBulbs.push({
      mesh: bulbMesh,
      mat: bulbMat,
      halo,
      baseColor,
      phase: b * 0.45,
    });
  }

  // Snow resting naturally along top arc of stationary rim
  for (let i = -8; i <= 8; i++) {
    if (Math.abs(i) <= 1) continue; // Leave room at 12 o'clock for golden pointer shield
    const angle = Math.PI / 2 + i * 0.088;
    const puff = new THREE.Mesh(snowSphereGeo, snowCapMat);
    const r = wheelRadius + 0.16;
    const size = 0.18 - Math.abs(i) * 0.01;
    puff.position.set(Math.cos(angle) * r, Math.sin(angle) * r, wheelDepth * 0.22);
    puff.scale.set(size * 1.5, size * 0.9, size * 1.3);
    puff.rotation.z = angle - Math.PI / 2;
    stationaryFrame.add(puff);
  }

  // Heavy snow blanket dusting upper left rim where brush gnome cleans
  const snowBrushPatch = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 14, 10),
    snowCapMat
  );
  snowBrushPatch.scale.set(1.4, 0.45, 0.85);
  snowBrushPatch.position.set(-wheelRadius * 0.58, wheelRadius * 0.84, wheelDepth / 2 + 0.04);
  snowBrushPatch.rotation.z = 0.65;
  stationaryFrame.add(snowBrushPatch);

  // Ornate Golden Pointer / Clapper with Ruby Gem & Star Crest at 12 o'clock
  const pointerMount = new THREE.Group();
  pointerMount.position.set(0, wheelRadius + 0.15, wheelDepth / 2 + 0.08);
  stationaryFrame.add(pointerMount);

  // Brass mount collar
  const mountCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.18, 0.14, 20),
    brushedBrassMat
  );
  mountCollar.rotation.x = Math.PI / 2;
  pointerMount.add(mountCollar);

  // Golden 5-Pointed Star Crest crowning top of mount
  const starShape = new THREE.Shape();
  const starPoints = 5;
  for (let i = 0; i < starPoints * 2; i++) {
    const r = i % 2 === 0 ? 0.15 : 0.065;
    const a = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();

  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  const starCrest = new THREE.Mesh(starGeo, brushedBrassMat);
  starCrest.position.set(0, 0.12, 0.02);
  pointerMount.add(starCrest);

  const pointerPivot = new THREE.Group();
  pointerPivot.position.set(0, wheelRadius + 0.15, wheelDepth / 2 + 0.14);
  stationaryFrame.add(pointerPivot);

  // Dark High-Contrast Outline Material (obsidian bronze-black)
  const darkPointerOutlineMat = new THREE.MeshStandardMaterial({
    color: 0x0f1115,
    roughness: 0.42,
    metalness: 0.28,
  });

  // 1. Backing Dark Outline Shape (dilated perimeter framing the entire arrow)
  const outlineShape = new THREE.Shape();
  outlineShape.moveTo(0, 0.315);
  outlineShape.bezierCurveTo(0.165, 0.27, 0.15, -0.015, 0.10, -0.215);
  outlineShape.lineTo(0, -0.665); // sharp dark contour extending beyond gold tip
  outlineShape.lineTo(-0.10, -0.215);
  outlineShape.bezierCurveTo(-0.15, -0.015, -0.165, 0.27, 0, 0.315);

  const outlineGeo = new THREE.ExtrudeGeometry(outlineShape, {
    depth: 0.056,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.014,
    bevelThickness: 0.014,
  });
  const outlineMesh = new THREE.Mesh(outlineGeo, darkPointerOutlineMat);
  outlineMesh.position.z = -0.030;
  outlineMesh.castShadow = !isSoftwareGl;
  pointerPivot.add(outlineMesh);

  // 2. Extruded ornate clapper arrow shape (brushed gold brass)
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 0.28);
  arrowShape.bezierCurveTo(0.13, 0.24, 0.12, -0.02, 0.075, -0.22);
  arrowShape.lineTo(0, -0.62); // sleek sharp tip pointing straight down
  arrowShape.lineTo(-0.075, -0.22);
  arrowShape.bezierCurveTo(-0.12, -0.02, -0.13, 0.24, 0, 0.28);

  // Inner cutout for ruby crystal inlay (slim profile)
  const rubyHole = new THREE.Path();
  rubyHole.moveTo(0, 0.16);
  rubyHole.bezierCurveTo(0.06, 0.12, 0.055, -0.04, 0.035, -0.16);
  rubyHole.lineTo(0, -0.36);
  rubyHole.lineTo(-0.035, -0.16);
  rubyHole.bezierCurveTo(-0.055, -0.04, -0.06, 0.12, 0, 0.16);
  arrowShape.holes.push(rubyHole);

  const arrowGeo = new THREE.ExtrudeGeometry(arrowShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.016,
    bevelThickness: 0.016,
  });
  const arrowMesh = new THREE.Mesh(arrowGeo, brushedBrassMat);
  arrowMesh.position.z = -0.020;
  arrowMesh.castShadow = !isSoftwareGl;
  pointerPivot.add(arrowMesh);

  // 3. Front Dark Outline Bezel Rim along front face of the arrow
  const frontOutlineShape = new THREE.Shape();
  frontOutlineShape.moveTo(0, 0.292);
  frontOutlineShape.bezierCurveTo(0.140, 0.250, 0.128, -0.018, 0.082, -0.22);
  frontOutlineShape.lineTo(0, -0.635);
  frontOutlineShape.lineTo(-0.082, -0.22);
  frontOutlineShape.bezierCurveTo(-0.128, -0.018, -0.140, 0.250, 0, 0.292);

  const innerGoldFaceHole = new THREE.Path();
  innerGoldFaceHole.moveTo(0, 0.262);
  innerGoldFaceHole.bezierCurveTo(0.116, 0.224, 0.106, -0.018, 0.066, -0.22);
  innerGoldFaceHole.lineTo(0, -0.585);
  innerGoldFaceHole.lineTo(-0.066, -0.22);
  innerGoldFaceHole.bezierCurveTo(-0.106, -0.018, -0.116, 0.224, 0, 0.262);
  frontOutlineShape.holes.push(innerGoldFaceHole);

  const frontOutlineGeo = new THREE.ExtrudeGeometry(frontOutlineShape, {
    depth: 0.012,
    bevelEnabled: false,
  });
  const frontOutlineMesh = new THREE.Mesh(frontOutlineGeo, darkPointerOutlineMat);
  frontOutlineMesh.position.z = 0.024;
  pointerPivot.add(frontOutlineMesh);

  // Dark Bezel Ring framing the ruby hole
  const rubyDarkBezel = new THREE.Mesh(
    new THREE.TorusGeometry(0.066, 0.010, 8, 20),
    darkPointerOutlineMat
  );
  rubyDarkBezel.position.set(0, -0.04, 0.012);
  pointerPivot.add(rubyDarkBezel);

  // Embedded Faceted Glowing Ruby Crystal in center of arrow
  const rubyMat = new THREE.MeshStandardMaterial({
    color: 0xff1133,
    emissive: 0xd90429,
    emissiveIntensity: 0.75,
    roughness: 0.12,
    metalness: 0.2,
  });
  const rubyGeo = new THREE.OctahedronGeometry(0.10, 0);
  rubyGeo.scale(0.55, 1.4, 0.35);
  const rubyCore = new THREE.Mesh(rubyGeo, rubyMat);
  rubyCore.position.set(0, -0.04, 0);
  pointerPivot.add(rubyCore);

  // Glowing Red Tip Gem at arrow tip pointing directly at slice with dark collar
  const tipGemMat = new THREE.MeshStandardMaterial({
    color: 0xff002b,
    emissive: 0xff1744,
    emissiveIntensity: 0.95,
    roughness: 0.1,
  });
  const tipGem = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), tipGemMat);
  tipGem.position.set(0, -0.60, 0.02);
  pointerPivot.add(tipGem);

  const tipGemCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.008, 8, 16),
    darkPointerOutlineMat
  );
  tipGemCollar.position.set(0, -0.60, 0.012);
  pointerPivot.add(tipGemCollar);

  // Dedicated spotlight point light at tip of arrow pointing onto the winning slice
  const pointerSpotLight = new THREE.PointLight(0xff2244, 2.0, 2.0);
  pointerSpotLight.position.set(0, -0.62, 0.12);
  pointerPivot.add(pointerSpotLight);

  // 3. Rotating Wheel Rotor (Face Texture + 3D Radial Dividers + Brass Rim Pegs)
  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, centerHeight, wheelDepth / 2 - 0.03);
  root.add(rotorGroup);

  let currentFaceTex: THREE.CanvasTexture | null = null;
  const faceMat = new THREE.MeshStandardMaterial({
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.08,
    emissive: 0x000000,
    emissiveIntensity: 0.0,
  });
  const faceMesh = new THREE.Mesh(new THREE.CircleGeometry(wheelRadius, 80), faceMat);
  faceMesh.receiveShadow = !isSoftwareGl;
  rotorGroup.add(faceMesh);

  const dividersGroup = new THREE.Group();
  rotorGroup.add(dividersGroup);

  const dividerMat = new THREE.MeshStandardMaterial({
    color: 0xd9ad5b,
    roughness: 0.34,
    metalness: 0.72,
  });

  const pegBaseGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.11, 10);
  pegBaseGeo.rotateX(Math.PI / 2);
  const pegCapGeo = new THREE.SphereGeometry(0.044, 12, 10);

  function clearDividers() {
    while (dividersGroup.children.length > 0) {
      const child = dividersGroup.children[0];
      dividersGroup.remove(child);
      if ((child as THREE.Mesh).geometry && child.userData.ownGeo) {
        (child as THREE.Mesh).geometry.dispose();
      }
    }
  }

  function rebuildSlices(items: WheelItem[]) {
    const newTex = createWheelFaceTexture(items, maxAnisotropy);
    faceMat.map = newTex;
    faceMat.needsUpdate = true;
    if (currentFaceTex) {
      currentFaceTex.dispose();
    }
    currentFaceTex = newTex;

    clearDividers();

    const count = Math.max(1, items.length);
    const sliceAngle = (Math.PI * 2) / count;

    if (count > 1) {
      const spokeLength = wheelRadius - 0.42;
      const spokeGeo = new THREE.BoxGeometry(spokeLength, 0.026, 0.032);

      for (let i = 0; i < count; i++) {
        // Boundary angle in 3D rotor local space: 12 o'clock is +Math.PI/2, going clockwise (-i * sliceAngle)
        const theta = Math.PI / 2 - i * sliceAngle;

        const spoke = new THREE.Mesh(spokeGeo, dividerMat);
        spoke.userData.ownGeo = i === 0; // Dispose shared spokeGeo once on rebuild
        const midR = 0.42 + spokeLength / 2;
        spoke.position.set(Math.cos(theta) * midR, Math.sin(theta) * midR, 0.016);
        spoke.rotation.z = theta;
        spoke.castShadow = !isSoftwareGl;
        dividersGroup.add(spoke);

        // Brass peg near outer rim
        const pegR = wheelRadius - 0.09;
        const pegShaft = new THREE.Mesh(pegBaseGeo, brushedBrassMat);
        pegShaft.position.set(Math.cos(theta) * pegR, Math.sin(theta) * pegR, 0.055);
        dividersGroup.add(pegShaft);

        const pegCap = new THREE.Mesh(pegCapGeo, brushedBrassMat);
        pegCap.position.set(Math.cos(theta) * pegR, Math.sin(theta) * pegR, 0.105);
        pegCap.castShadow = !isSoftwareGl;
        dividersGroup.add(pegCap);
      }
    }
  }

  rebuildSlices(initialItems);

  // 4. Center Stationary 3D "GIRAR" Medallion Hub Button
  const hubButtonGroup = new THREE.Group();
  hubButtonGroup.position.set(0, centerHeight, wheelDepth / 2 + 0.05);
  root.add(hubButtonGroup);

  // Outer brushed-brass medallion bezel
  const hubOuterRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.5, 0.14, 40),
    brushedBrassMat
  );
  hubOuterRing.rotation.x = Math.PI / 2;
  hubOuterRing.castShadow = !isSoftwareGl;
  hubButtonGroup.add(hubOuterRing);

  // Textured crimson-and-gold "GIRAR" cap
  const hubFaceTex = createCenterHubTexture(maxAnisotropy);
  const hubCapMat = new THREE.MeshStandardMaterial({
    map: hubFaceTex,
    roughness: 0.28,
    metalness: 0.12,
  });
  const hubCap = new THREE.Mesh(new THREE.CircleGeometry(0.41, 40), hubCapMat);
  hubCap.position.z = 0.072;
  hubCap.layers.enable(1); // Raycast layer 1
  hubButtonGroup.add(hubCap);

  // Invisible slightly larger collision proxy for effortless clicking/hovering
  const hubClickTarget = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.22, 24),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hubClickTarget.rotation.x = Math.PI / 2;
  hubClickTarget.layers.enable(1);
  hubButtonGroup.add(hubClickTarget);

  function updateAnimation(elapsed: number, isSpinning: boolean) {
    if (isSpinning) {
      // Fast, high-energy carnival flashing strobe chase while spinning
      marqueeBulbs.forEach((b) => {
        const flash = Math.sin(elapsed * 24.0 + b.phase * 2.0);
        const isOn = flash > 0.0;
        b.mat.emissiveIntensity = isOn ? 5.2 : 0.05;
        b.halo.material.opacity = isOn ? 0.96 : 0.02;
      });
    } else {
      // Gentle, festive rhythmic blinking while idle
      marqueeBulbs.forEach((b) => {
        const pulse = Math.sin(elapsed * 4.5 + b.phase);
        const isOn = pulse > 0.15;
        b.mat.emissiveIntensity = isOn ? 3.6 : 0.12;
        b.halo.material.opacity = isOn ? 0.85 : 0.05;
      });
    }
  }

  function dispose() {
    if (currentFaceTex) currentFaceTex.dispose();
    hubFaceTex.dispose();
    clearDividers();
    pegBaseGeo.dispose();
    pegCapGeo.dispose();
  }

  return {
    root,
    rotorGroup,
    pointerPivot,
    hubButtonGroup,
    hubClickTarget,
    wheelRadius,
    updateAnimation,
    rebuildSlices,
    dispose,
  };
}
