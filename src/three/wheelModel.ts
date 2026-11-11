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
  rebuildSlices: (items: WheelItem[]) => void;
  dispose: () => void;
}

export function createWheelAssembly(
  initialItems: WheelItem[],
  woodTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
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
    color: 0xf0c465,
    roughness: 0.26,
    metalness: 0.86,
  });

  const crimsonRimMat = new THREE.MeshStandardMaterial({
    color: 0x8f1818,
    roughness: 0.45,
    metalness: 0.14,
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

  // Snow resting naturally along the top arc of the stationary rim (matching reference image!)
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

  // Heavy snow blanket dusting upper left rim where the brush gnome cleans
  const snowBrushPatch = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 14, 10),
    snowCapMat
  );
  snowBrushPatch.scale.set(1.4, 0.45, 0.85);
  snowBrushPatch.position.set(-wheelRadius * 0.58, wheelRadius * 0.84, wheelDepth / 2 + 0.04);
  snowBrushPatch.rotation.z = 0.65;
  stationaryFrame.add(snowBrushPatch);

  // Ornate Golden Pointer / Clapper at 12 o'clock matching the reference photo
  const pointerMount = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.12, 16),
    brushedBrassMat
  );
  pointerMount.rotation.x = Math.PI / 2;
  pointerMount.position.set(0, wheelRadius + 0.14, wheelDepth / 2 + 0.08);
  stationaryFrame.add(pointerMount);

  const pointerPivot = new THREE.Group();
  pointerPivot.position.set(0, wheelRadius + 0.14, wheelDepth / 2 + 0.12);
  stationaryFrame.add(pointerPivot);

  // Extruded ornate teardrop/shield pointer with decorative cutout
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 0.22);
  shieldShape.bezierCurveTo(0.24, 0.22, 0.26, -0.02, 0.16, -0.22);
  shieldShape.lineTo(0, -0.52);
  shieldShape.lineTo(-0.16, -0.22);
  shieldShape.bezierCurveTo(-0.26, -0.02, -0.24, 0.22, 0, 0.22);

  // Inner cutout hole in pointer (like the photo!)
  const holePath = new THREE.Path();
  holePath.moveTo(0, 0.1);
  holePath.bezierCurveTo(0.1, 0.1, 0.11, -0.04, 0.06, -0.14);
  holePath.lineTo(0, -0.28);
  holePath.lineTo(-0.06, -0.14);
  holePath.bezierCurveTo(-0.11, -0.04, -0.1, 0.1, 0, 0.1);
  shieldShape.holes.push(holePath);

  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, brushedBrassMat);
  shieldMesh.position.z = -0.03;
  shieldMesh.castShadow = !isSoftwareGl;
  pointerPivot.add(shieldMesh);

  // 3. Rotating Wheel Rotor (Face Texture + 3D Radial Dividers + Brass Rim Pegs)
  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, centerHeight, wheelDepth / 2 - 0.03);
  root.add(rotorGroup);

  let currentFaceTex: THREE.CanvasTexture | null = null;
  const faceMat = new THREE.MeshStandardMaterial({
    roughness: 0.62,
    metalness: 0.05,
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
    rebuildSlices,
    dispose,
  };
}
