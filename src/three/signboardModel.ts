import * as THREE from 'three';

export interface Sign3DRig {
  root: THREE.Group;
  signMesh: THREE.Mesh;
}

export function createSignpost3D(
  woodTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): Sign3DRig {
  const root = new THREE.Group();

  // Rich timber materials with deep wood grain & warm highlights
  const timberMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x482613,
    roughness: 0.78,
    metalness: 0.05,
  });

  const plankMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x3d2010,
    roughness: 0.74,
    metalness: 0.04,
  });

  const headerPlankMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x5a331c,
    roughness: 0.72,
    metalness: 0.06,
  });

  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xeef5ff,
    roughness: 0.75,
    metalness: 0.02,
  });

  const ironNailMat = new THREE.MeshStandardMaterial({
    color: 0x1a0d06,
    roughness: 0.35,
    metalness: 0.85,
  });

  // 1. Two Sturdy Timber Support Posts Anchored Deep into Snow
  const postXCoords = [-1.32, 1.32];
  postXCoords.forEach((px) => {
    const postMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.20, 3.8, 16),
      timberMat
    );
    postMesh.position.set(px, 1.45, 0);
    postMesh.castShadow = !isSoftwareGl;
    postMesh.receiveShadow = !isSoftwareGl;
    root.add(postMesh);

    // Ground contact shadow in snow
    const shadowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    shadowGeo.rotateX(-Math.PI / 2);
    const pShadow = new THREE.Mesh(
      shadowGeo,
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.62,
      })
    );
    pShadow.position.set(px, 0.025, 0);
    root.add(pShadow);

    // Snow drift mound banked up against base
    const snowBank = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 12, 10),
      snowMat
    );
    snowBank.scale.set(1.4, 0.42, 1.3);
    snowBank.position.set(px, 0.08, 0);
    root.add(snowBank);
  });

  // 2. Cross Beams Behind Board for Structural 3D Realism
  const topCrossBeam = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.18, 0.18),
    timberMat
  );
  topCrossBeam.position.set(0, 3.2, -0.08);
  topCrossBeam.castShadow = !isSoftwareGl;
  root.add(topCrossBeam);

  const bottomCrossBeam = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.18, 0.18),
    timberMat
  );
  bottomCrossBeam.position.set(0, 1.35, -0.08);
  bottomCrossBeam.castShadow = !isSoftwareGl;
  root.add(bottomCrossBeam);

  // 3. Main 3D Signboard Body: Multi-Plank Volumetric Assembly
  const signboardGroup = new THREE.Group();
  signboardGroup.position.set(0, 2.32, 0.06);
  root.add(signboardGroup);

  // Broad main backing box (gives substantial 3D volume & depth)
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.35, 2.45, 0.22),
    plankMat
  );
  signMesh.castShadow = !isSoftwareGl;
  signMesh.receiveShadow = !isSoftwareGl;
  signboardGroup.add(signMesh);

  // Overlaid Horizontal Carved Wood Planks (creates realistic plank grooves & volume)
  const plankHeights = [0.82, 0.0, -0.82];
  plankHeights.forEach((py, idx) => {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(3.28, 0.76, 0.06),
      idx === 0 ? headerPlankMat : plankMat
    );
    plank.position.set(0, py, 0.12 + (idx === 0 ? 0.02 : 0));
    plank.castShadow = !isSoftwareGl;
    signboardGroup.add(plank);
  });

  // Beveled outer timber frame around the board
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.14, 0.28), timberMat);
  frameTop.position.set(0, 1.25, 0.02);
  signboardGroup.add(frameTop);

  const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.14, 0.28), timberMat);
  frameBottom.position.set(0, -1.25, 0.02);
  signboardGroup.add(frameBottom);

  [-1.68, 1.68].forEach((fx) => {
    const frameSide = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.64, 0.28), timberMat);
    frameSide.position.set(fx, 0, 0.02);
    signboardGroup.add(frameSide);
  });

  // Iron square rustic bolts in board corners
  const boltPos = [
    { x: -1.52, y: 1.12 },
    { x: 1.52, y: 1.12 },
    { x: -1.52, y: -1.12 },
    { x: 1.52, y: -1.12 },
  ];
  boltPos.forEach((bp) => {
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.08), ironNailMat);
    bolt.position.set(bp.x, bp.y, 0.16);
    signboardGroup.add(bolt);
  });

  // 4. Volumetric Sculpted Snow Drift Cap Resting on Top of Signboard
  const snowDriftContainer = new THREE.Group();
  snowDriftContainer.position.set(0, 1.34, 0.04);
  signboardGroup.add(snowDriftContainer);

  const mainSnowMound = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 18, 14),
    snowMat
  );
  mainSnowMound.scale.set(3.3, 0.48, 0.85);
  mainSnowMound.receiveShadow = !isSoftwareGl;
  snowDriftContainer.add(mainSnowMound);

  // Side drooping snow crests
  [-1.5, 0, 1.5].forEach((sx, idx) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), snowMat);
    puff.scale.set(1.4, 0.55, 0.9);
    puff.position.set(sx + (idx === 1 ? 0 : idx === 0 ? -0.1 : 0.1), 0.08, 0.08);
    puff.receiveShadow = !isSoftwareGl;
    snowDriftContainer.add(puff);
  });

  // Draped String Fairy Light Bulbs along bottom edge of board
  const lightColors = [0xffd269, 0xff5e57, 0x55e679, 0xffd269, 0x48dbfb];
  for (let i = 0; i < 5; i++) {
    const lx = -1.2 + i * 0.6;
    const bulbMat = new THREE.MeshStandardMaterial({
      color: lightColors[i],
      emissive: lightColors[i],
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), bulbMat);
    bulb.position.set(lx, -1.35, 0.14);
    signboardGroup.add(bulb);
  }

  return {
    root,
    signMesh,
  };
}
