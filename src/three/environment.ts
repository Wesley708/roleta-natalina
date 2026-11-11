import * as THREE from 'three';

// Deterministic snow terrain height function so every tree, gnome, reindeer, log, and wheel sits flush
export function groundHeightAt(x: number, z: number): number {
  // Keep foreground wheel & gnome stage gently contoured and stable
  const stageDist = Math.hypot(x, z);
  const stageFlatten = THREE.MathUtils.smoothstep(stageDist, 2.2, 7.5);

  const rollingHills =
    (Math.sin(x * 0.22 + 0.6) * 0.42 +
      Math.cos(z * 0.25 - 0.4) * 0.38 +
      Math.sin((x - z) * 0.14) * 0.32) *
    stageFlatten;

  // Rise slightly into snowy forest banks in background (z < -2.5)
  const backRise = z < -2.5 ? Math.min(2.6, Math.pow(Math.abs(z + 2.5) * 0.16, 1.35)) : 0;

  return rollingHills + backRise;
}

export interface EnvironmentAssets {
  group: THREE.Group;
  auroraMaterial: THREE.ShaderMaterial;
  snowPoints: THREE.Points;
  bulbMaterials: THREE.MeshStandardMaterial[];
  updateEnvironment: (elapsed: number, delta: number) => void;
}

export function createWinterEnvironment(
  contactShadowTex: THREE.Texture,
  woodTex: THREE.Texture,
  glowTex: THREE.Texture,
  treeRingsTex: THREE.Texture,
  isSoftwareGl: boolean
): EnvironmentAssets {
  const group = new THREE.Group();

  // 1. Snow-Covered Terrain Mesh
  const terrainGeo = new THREE.PlaneGeometry(64, 48, 88, 68);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, groundHeightAt(vx, vz));
  }
  terrainGeo.computeVertexNormals();

  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xdceafb,
    roughness: 0.78,
    metalness: 0.04,
    emissive: new THREE.Color(0x0d213d),
    emissiveIntensity: 0.22,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, snowMat);
  terrainMesh.receiveShadow = !isSoftwareGl;
  group.add(terrainMesh);

  // Low-lying ground fog layer (enhanced for atmospheric density near the floor)
  const groundFogGeo = new THREE.PlaneGeometry(64, 48);
  groundFogGeo.rotateX(-Math.PI / 2);
  const groundFogMat = new THREE.MeshBasicMaterial({
    color: 0xa0b0df,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const groundFog = new THREE.Mesh(groundFogGeo, groundFogMat);
  groundFog.position.y = 0.35;
  group.add(groundFog);

  // Secondary dynamic fog layer for added depth
  const groundFog2 = new THREE.Mesh(groundFogGeo, groundFogMat.clone());
  (groundFog2.material as THREE.MeshBasicMaterial).opacity = 0.18;
  groundFog2.position.y = 0.55;
  groundFog2.scale.set(1.2, 1.2, 1.2);
  group.add(groundFog2);


  // 2. Aurora Borealis & Glowing Moon Arctic Night Sky Dome
  const skyGeo = new THREE.SphereGeometry(46, 40, 28);
  const auroraMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vWorldPos;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

        // Deep dark arctic midnight sky background
        vec3 horizonCol = vec3(0.025, 0.07, 0.16);
        vec3 midSkyCol  = vec3(0.010, 0.035, 0.09);
        vec3 zenithCol  = vec3(0.003, 0.010, 0.035);
        vec3 col = mix(horizonCol, midSkyCol, smoothstep(0.35, 0.65, h));
        col = mix(col, zenithCol, smoothstep(0.65, 0.98, h));

        // Moon in upper right sky
        vec3 moonDir = normalize(vec3(0.62, 0.54, -0.57));
        float moonDist = length(dir - moonDir);
        if (moonDist < 0.28) {
          float moonCore = smoothstep(0.055, 0.048, moonDist);
          float moonGlow = exp(-moonDist * 12.0) * 0.70;
          vec3 moonCol = vec3(1.0, 0.96, 0.88);
          col += moonCol * (moonCore * 2.0 + moonGlow);
        }

        // --- Two Subtle Horizontal Aurora Borealis Streaks ---
        if (dir.y > 0.05) {
          // Horizontal streak 1 (lower green-cyan band)
          float wave1 = sin(dir.x * 2.2 + uTime * 0.04) * 0.04 + noise(vec2(dir.x * 2.5, uTime * 0.02)) * 0.03;
          float streak1 = exp(-pow((dir.y - 0.22 - wave1) * 12.0, 2.0));

          // Horizontal streak 2 (upper cyan-teal band)
          float wave2 = cos(dir.x * 1.8 - uTime * 0.035) * 0.035 + noise(vec2(dir.x * 2.0 + 3.0, uTime * 0.025)) * 0.025;
          float streak2 = exp(-pow((dir.y - 0.38 - wave2) * 14.0, 2.0));

          // Soft, non-overpowering glowing colors
          vec3 auroraColor1 = vec3(0.08, 0.85, 0.52); // soft emerald green
          vec3 auroraColor2 = vec3(0.06, 0.70, 0.88); // soft cyan/teal

          float fadeFront = smoothstep(0.35, -0.45, dir.z);
          col += (auroraColor1 * streak1 * 0.38 + auroraColor2 * streak2 * 0.28) * fadeFront;
        }

        // --- Steady Crisp Winter Starfield ---
        if (dir.y > 0.02) {
          // Layer 1: Distant pin-point stars (steady glow)
          vec2 grid1 = floor(dir.xy * 280.0 + dir.z * 140.0);
          float seed1 = hash(grid1);
          if (seed1 > 0.976) {
            col += vec3(0.92, 0.96, 1.0) * 0.85 * smoothstep(0.02, 0.18, dir.y);
          }

          // Layer 2: Focal stars with flare (steady glow)
          vec2 grid2 = floor(dir.xy * 110.0 + dir.z * 60.0);
          float seed2 = hash(grid2);
          if (seed2 > 0.988) {
            vec2 cellUv = fract(dir.xy * 110.0 + dir.z * 60.0) - 0.5;
            float distToStar = length(cellUv);
            float flare = exp(-distToStar * 18.0) + exp(-abs(cellUv.x) * 35.0) * 0.35 + exp(-abs(cellUv.y) * 35.0) * 0.35;
            col += vec3(1.0, 0.98, 0.92) * flare * 1.5 * smoothstep(0.05, 0.25, dir.y);
          }
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, auroraMaterial);
  group.add(skyDome);

  // 3. Snow-Laden 3D Pine Trees (Delicately scaled so the Aurora Borealis shines through)
  const treePositions: Array<{ x: number; z: number; scale: number; rot: number }> = [
    // Foreground-left framing pine
    { x: -7.8, z: 2.2, scale: 1.15, rot: 0.4 },
    { x: -8.8, z: -1.4, scale: 1.25, rot: 1.2 },
    { x: -10.0, z: 0.8, scale: 1.10, rot: 2.5 },
    // Foreground-right framing pine
    { x: 8.2, z: 2.0, scale: 1.12, rot: 0.9 },
    { x: 9.4, z: -1.2, scale: 1.22, rot: 1.8 },
    // Midground clearing pines framing scene (lowered scale to uncover sky)
    { x: -7.2, z: -4.8, scale: 1.05, rot: 2.1 },
    { x: -5.0, z: -7.0, scale: 0.98, rot: 0.8 },
    { x: -2.4, z: -8.6, scale: 1.08, rot: 1.7 },
    { x: 1.0, z: -8.4, scale: 1.02, rot: 2.9 },
    { x: 3.6, z: -6.6, scale: 0.98, rot: 0.5 },
    { x: 6.0, z: -5.8, scale: 1.12, rot: 1.9 },
    { x: 8.2, z: -4.4, scale: 1.04, rot: 2.4 },
    // Distant background ridge pines (compact silhouette allowing aurora visibility)
    { x: -11.5, z: -8.8, scale: 1.25, rot: 0.3 },
    { x: -8.5, z: -10.4, scale: 1.30, rot: 1.1 },
    { x: -4.8, z: -11.8, scale: 1.28, rot: 2.2 },
    { x: -0.6, z: -12.0, scale: 1.22, rot: 0.9 },
    { x: 3.4, z: -11.5, scale: 1.26, rot: 1.6 },
    { x: 7.4, z: -10.6, scale: 1.24, rot: 2.7 },
    { x: 10.8, z: -9.0, scale: 1.28, rot: 0.6 },
  ];

  const trunkMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x4d2e1b,
    roughness: 0.88,
    metalness: 0.02,
  });
  const pineMat = new THREE.MeshStandardMaterial({
    color: 0x1a4a2f,
    roughness: 0.78,
    metalness: 0.03,
  });
  const treeSnowMat = new THREE.MeshStandardMaterial({
    color: 0xebf4ff,
    roughness: 0.68,
    metalness: 0.04,
  });
  const shadowPlaneGeo = new THREE.PlaneGeometry(1, 1);
  shadowPlaneGeo.rotateX(-Math.PI / 2);

  const bulbPalette = [0xff2244, 0xffd700, 0x00e676, 0x00e5ff, 0xff4081, 0xff9100];
  const bulbMaterials: THREE.MeshStandardMaterial[] = [];
  bulbPalette.forEach((hex) => {
    bulbMaterials.push(
      new THREE.MeshStandardMaterial({
        color: hex,
        emissive: hex,
        emissiveIntensity: 3.2,
        roughness: 0.12,
        metalness: 0.1,
      })
    );
  });

  interface AnimatedTreeOrnament {
    mat: THREE.MeshStandardMaterial;
    halo: THREE.Sprite;
    phase: number;
    freq: number;
  }
  const treeOrnamentsList: AnimatedTreeOrnament[] = [];

  const animatedTrees: THREE.Group[] = [];

  treePositions.forEach((tp, tIndex) => {
    const hasOrnaments = tIndex < 12;
    const tree = createSnowyPineTree(
      trunkMat,
      pineMat,
      treeSnowMat,
      bulbPalette,
      treeOrnamentsList,
      glowTex,
      hasOrnaments,
      isSoftwareGl
    );
    const gy = groundHeightAt(tp.x, tp.z);
    tree.position.set(tp.x, gy - 0.08, tp.z);
    tree.scale.setScalar(tp.scale);
    tree.rotation.y = tp.rot;
    group.add(tree);
    animatedTrees.push(tree);

    // Soft contact shadow under tree
    const shadow = new THREE.Mesh(
      shadowPlaneGeo,
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.48,
      })
    );
    shadow.position.set(tp.x, gy + 0.025, tp.z);
    shadow.scale.setScalar(2.6 * tp.scale);
    group.add(shadow);

    // Light pool on snow under illuminated trees
    if (hasOrnaments) {
      const glowMat = new THREE.MeshBasicMaterial({
        map: glowTex,
        color: 0xffe28a,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const snowGlowPool = new THREE.Mesh(shadowPlaneGeo, glowMat);
      snowGlowPool.position.set(tp.x, gy + 0.035, tp.z + 0.15);
      snowGlowPool.scale.setScalar(3.2 * tp.scale);
      group.add(snowGlowPool);

      if (tIndex === 0 || tIndex === 1 || tIndex === 4 || tIndex === 7 || tIndex === 9) {
        const treeLight = new THREE.PointLight(0xffdf88, 1.4, 6.5, 1.5);
        treeLight.position.set(tp.x, gy + 2.2 * tp.scale, tp.z + 0.8);
        group.add(treeLight);
      }
    }
  });

  // 4. Props in the Snow: Wooden Ladder underneath the red-hat elf beside the wheel
  const ladder = createWoodenLadder(woodTex, isSoftwareGl);
  const ladderX = 2.62;
  const ladderZ = -0.38;
  ladder.position.set(ladderX, groundHeightAt(ladderX, ladderZ) + 0.12, ladderZ);
  ladder.rotation.z = 0.08;
  ladder.rotation.y = -0.42;
  group.add(ladder);

  // Rustic Wooden Stump without side roots (bottom-left)
  const stump = createWoodenStump(woodTex, treeRingsTex, treeSnowMat, isSoftwareGl);
  const stumpX = -4.2;
  const stumpZ = 2.05;
  stump.position.set(stumpX, groundHeightAt(stumpX, stumpZ), stumpZ);
  group.add(stump);

  const stumpShadow = new THREE.Mesh(
    shadowPlaneGeo,
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
    })
  );
  stumpShadow.position.set(stumpX, groundHeightAt(stumpX, stumpZ) + 0.025, stumpZ);
  stumpShadow.scale.set(1.5, 1, 1.5);
  group.add(stumpShadow);

  // Rustic Wooden Bucket without handle (bottom-right)
  const bucket = createElfWoodenBucket(woodTex, treeSnowMat, isSoftwareGl);
  const bucketX = 2.47;
  const bucketZ = 1.75;
  bucket.position.set(bucketX, groundHeightAt(bucketX, bucketZ), bucketZ);
  bucket.rotation.y = -0.32;
  group.add(bucket);

  const bucketShadow = new THREE.Mesh(
    shadowPlaneGeo,
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  bucketShadow.position.set(bucketX, groundHeightAt(bucketX, bucketZ) + 0.025, bucketZ);
  bucketShadow.scale.set(1.35, 1, 1.35);
  group.add(bucketShadow);

  // 4b. Decorative Candy Canes (Bengalas Doces com listras vermelhas e brancas)
  const candyCanePositions = [
    { x: -2.75, z: 1.85, rotY: 0.35, tiltZ: 0.16, scale: 1.15 },
    { x: 1.65, z: 1.95, rotY: -0.42, tiltZ: -0.18, scale: 1.1 },
    { x: -5.2, z: 1.1, rotY: 0.65, tiltZ: -0.14, scale: 1.25 },
    { x: 4.8, z: 1.2, rotY: -0.55, tiltZ: 0.15, scale: 1.2 },
  ];
  candyCanePositions.forEach((cc) => {
    const candy = createCandyCane(isSoftwareGl);
    const gy = groundHeightAt(cc.x, cc.z);
    candy.position.set(cc.x, gy - 0.04, cc.z);
    candy.rotation.y = cc.rotY;
    candy.rotation.z = cc.tiltZ;
    candy.scale.setScalar(cc.scale);
    group.add(candy);

    const ccShadow = new THREE.Mesh(
      shadowPlaneGeo,
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.45,
      })
    );
    ccShadow.position.set(cc.x, gy + 0.02, cc.z);
    ccShadow.scale.set(0.65, 1, 0.65);
    group.add(ccShadow);
  });

  // 4c. Decorative Wrapped Christmas Gift Ornaments (Enfeites de presentes natalinos na neve)
  const giftDecorations = [
    { x: -3.6, z: 2.15, size: 0.32, rotY: 0.3, wrap: 0xc42021, rib: 0xf5b700 }, // Crimson with Gold ribbon near log
    { x: -3.85, z: 2.45, size: 0.24, rotY: -0.4, wrap: 0x1b7340, rib: 0xffffff }, // Evergreen with White ribbon
    { x: 3.05, z: 2.12, size: 0.30, rotY: 0.52, wrap: 0x1e5ba3, rib: 0xf4c542 }, // Royal Blue with Gold ribbon near snowman
    { x: 2.85, z: 2.38, size: 0.22, rotY: -0.22, wrap: 0xc42021, rib: 0x1b7340 }, // Crimson with Green ribbon
  ];
  giftDecorations.forEach((gd) => {
    const giftMesh = createOrnamentalGift(gd.size, gd.wrap, gd.rib, isSoftwareGl);
    const gy = groundHeightAt(gd.x, gd.z);
    giftMesh.position.set(gd.x, gy, gd.z);
    giftMesh.rotation.y = gd.rotY;
    group.add(giftMesh);

    const giftShadow = new THREE.Mesh(
      shadowPlaneGeo,
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.48,
      })
    );
    giftShadow.position.set(gd.x, gy + 0.02, gd.z);
    giftShadow.scale.setScalar(gd.size * 2.2);
    group.add(giftShadow);
  });

  // 5. Overhead Draped Warm Fairy String Lights in 3D Space
  const garlandCurveLeft = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9.5, 6.4, 2.5),
    new THREE.Vector3(-6.2, 5.45, 2.2),
    new THREE.Vector3(-3.1, 6.25, 2.0),
  ]);
  const garlandCurveRight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 6.3, 2.0),
    new THREE.Vector3(3.6, 5.55, 2.2),
    new THREE.Vector3(8.2, 6.35, 2.5),
  ]);

  const wireMat = new THREE.MeshStandardMaterial({ color: 0x192a1e, roughness: 0.8 });
  [garlandCurveLeft, garlandCurveRight].forEach((curve, cIdx) => {
    const wireGeo = new THREE.TubeGeometry(curve, 28, 0.022, 6, false);
    group.add(new THREE.Mesh(wireGeo, wireMat));

    const bulbGeo = new THREE.SphereGeometry(0.075, 10, 10);
    const bulbCount = 11;
    for (let i = 1; i < bulbCount; i++) {
      const pt = curve.getPoint(i / bulbCount);
      const mat = bulbMaterials[(i + cIdx * 2) % bulbMaterials.length];
      const bulb = new THREE.Mesh(bulbGeo, mat);
      bulb.position.set(pt.x, pt.y - 0.07, pt.z);
      group.add(bulb);
    }
  });

  // 6. 3D Falling Snowflakes Inside the World
  const snowCount = isSoftwareGl ? 220 : 480;
  const snowPositions = new Float32Array(snowCount * 3);
  const snowDrifts = new Float32Array(snowCount * 2); // speed, phase
  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (Math.random() - 0.5) * 26;
    snowPositions[i * 3 + 1] = Math.random() * 12;
    snowPositions[i * 3 + 2] = -9 + Math.random() * 15;
    snowDrifts[i * 2] = 0.65 + Math.random() * 0.95;
    snowDrifts[i * 2 + 1] = Math.random() * Math.PI * 2;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

  const snowFlakeMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.09,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  const snowPoints = new THREE.Points(snowGeo, snowFlakeMat);
  snowPoints.frustumCulled = false;
  group.add(snowPoints);

  function updateEnvironment(elapsed: number, delta: number) {
    auroraMaterial.uniforms.uTime.value = elapsed;

    // Subtle wind movement for ground fog
    groundFog.position.x = Math.sin(elapsed * 0.15) * 0.5;
    groundFog.position.z = Math.cos(elapsed * 0.1) * 0.3;
    
    groundFog2.position.x = Math.cos(elapsed * 0.12) * 0.6;
    groundFog2.position.z = Math.sin(elapsed * 0.08) * 0.4;

    // Overhead fairy string light twinkle
    for (let i = 0; i < bulbMaterials.length; i++) {
      bulbMaterials[i].emissiveIntensity = 2.4 + 1.2 * Math.sin(elapsed * 3.4 + i * 1.4);
    }

    // Alternating 4-channel Christmas tree light flashing (igual em árvores de Natal!)
    treeOrnamentsList.forEach((o) => {
      const pulse = Math.sin(elapsed * o.freq + o.phase);
      const isOn = pulse > 0.05;
      o.mat.emissiveIntensity = isOn ? 3.6 : 0.06;
      o.halo.material.opacity = isOn ? 0.92 : 0.03;
    });

    // Update 3D snow particles
    const attr = snowGeo.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < snowCount; i++) {
      const speed = snowDrifts[i * 2];
      const phase = snowDrifts[i * 2 + 1];
      arr[i * 3 + 1] -= speed * delta;
      arr[i * 3] += Math.sin(elapsed * 0.9 + phase) * 0.25 * delta;
      if (arr[i * 3 + 1] < -0.5) {
        arr[i * 3 + 1] = 11.5;
        arr[i * 3] = (Math.random() - 0.5) * 26;
      }
    }
    attr.needsUpdate = true;
  }

  // Add withered grass patches
  const grassPatches = createGrassPatches(isSoftwareGl);
  group.add(grassPatches);

  return {
    group,
    auroraMaterial,
    snowPoints,
    bulbMaterials,
    updateEnvironment,
  };
}

function createGrassPatches(isSoftwareGl: boolean): THREE.Group {
  const group = new THREE.Group();
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a2a,
    roughness: 0.95,
  });
  const bladeGeo = new THREE.PlaneGeometry(0.05, 0.3);
  bladeGeo.translate(0, 0.15, 0);

  for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    const y = groundHeightAt(x, z);

    // Only place on lower ground (near wheel/gnomes)
    if (Math.abs(x) < 4 && Math.abs(z) < 4) {
      const blade = new THREE.Mesh(bladeGeo, grassMat);
      blade.position.set(x, y - 0.05, z);
      blade.rotation.y = Math.random() * Math.PI * 2;
      blade.rotation.x = Math.random() * 0.2 - 0.1;
      blade.castShadow = !isSoftwareGl;
      group.add(blade);
    }
  }
  return group;
}

function createSnowyPineTree(
  trunkMat: THREE.Material,
  pineMat: THREE.Material,
  snowMat: THREE.Material,
  bulbPalette: number[],
  treeOrnamentsList: Array<{
    mat: THREE.MeshStandardMaterial;
    halo: THREE.Sprite;
    phase: number;
    freq: number;
  }>,
  glowTex: THREE.Texture,
  hasOrnaments: boolean,
  isSoftwareGl: boolean
): THREE.Group {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.1, 10), trunkMat);
  trunk.position.y = 0.55;
  trunk.castShadow = !isSoftwareGl;
  tree.add(trunk);

  const tiers = [
    { y: 1.25, r: 1.48, h: 1.65, ornamentCount: 8 },
    { y: 2.15, r: 1.22, h: 1.5, ornamentCount: 6 },
    { y: 2.95, r: 0.96, h: 1.35, ornamentCount: 5 },
    { y: 3.65, r: 0.72, h: 1.15, ornamentCount: 4 },
    { y: 4.25, r: 0.45, h: 0.95, ornamentCount: 3 },
  ];

  const ornamentSphereGeo = new THREE.SphereGeometry(0.068, 8, 8);

  tiers.forEach((t, idx) => {
    const foliage = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 13), pineMat);
    foliage.position.y = t.y;
    foliage.rotation.y = idx * 0.45;
    foliage.castShadow = !isSoftwareGl;
    foliage.receiveShadow = !isSoftwareGl;
    tree.add(foliage);

    // Fluffy snow cap resting on upper branches of each tier
    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(t.r * 0.96, t.h * 0.52, 13), snowMat);
    snowCap.position.y = t.y + t.h * 0.21;
    snowCap.rotation.y = idx * 0.45 + 0.12;
    snowCap.receiveShadow = !isSoftwareGl;
    tree.add(snowCap);

    // Bauble ornaments emitting alternating festive light flashes
    if (hasOrnaments) {
      for (let b = 0; b < t.ornamentCount; b++) {
        const theta = (b / t.ornamentCount) * Math.PI * 2 + idx * 0.7;
        const rad = t.r * 0.88;
        const colorHex = bulbPalette[(b + idx * 2) % bulbPalette.length];

        const bMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 3.2,
          roughness: 0.12,
          metalness: 0.1,
        });

        const ornament = new THREE.Mesh(ornamentSphereGeo, bMat);
        const ox = Math.cos(theta) * rad;
        const oy = t.y - t.h * 0.38;
        const oz = Math.sin(theta) * rad;
        ornament.position.set(ox, oy, oz);
        tree.add(ornament);

        // Luminous light halo sprite
        const haloMat = new THREE.SpriteMaterial({
          map: glowTex,
          color: colorHex,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const halo = new THREE.Sprite(haloMat);
        halo.scale.set(0.42, 0.42, 0.42);
        halo.position.set(ox, oy, oz);
        tree.add(halo);

        // 4-Channel alternating phase offset chaser (0, PI/2, PI, 3PI/2)
        const channel = (b + idx) % 4;
        const phase = channel * (Math.PI / 2);
        const freq = 4.2;

        treeOrnamentsList.push({
          mat: bMat,
          halo,
          phase,
          freq,
        });
      }
    }
  });

  // Glowing golden Christmas star on tree top
  if (hasOrnaments) {
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffdf6d,
      emissive: 0xffbb29,
      emissiveIntensity: 1.8,
      roughness: 0.25,
      metalness: 0.75,
    });
    const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), starMat);
    starCore.scale.set(1, 1.45, 0.65);
    starCore.position.y = 4.84;
    tree.add(starCore);

    const starHaloMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffd269,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starHalo = new THREE.Sprite(starHaloMat);
    starHalo.scale.set(0.85, 0.85, 0.85);
    starHalo.position.set(0, 4.84, 0);
    tree.add(starHalo);
  }

  return tree;
}

function createWoodenLadder(woodTex: THREE.Texture, isSoftwareGl: boolean): THREE.Group {
  const ladder = new THREE.Group();
  const railMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x6e4121,
    roughness: 0.82,
    metalness: 0.04,
  });

  const height = 3.25;
  const width = 0.72;
  const railGeo = new THREE.CylinderGeometry(0.055, 0.065, height, 10);

  // Front rails
  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(-width / 2, height / 2, 0.25);
  leftRail.rotation.x = -0.14;
  leftRail.castShadow = !isSoftwareGl;
  ladder.add(leftRail);

  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.position.set(width / 2, height / 2, 0.25);
  rightRail.rotation.x = -0.14;
  rightRail.castShadow = !isSoftwareGl;
  ladder.add(rightRail);

  // Back support legs (A-frame ladder like in the reference image)
  const backLeft = new THREE.Mesh(railGeo, railMat);
  backLeft.position.set(-width / 2, height / 2, -0.25);
  backLeft.rotation.x = 0.14;
  backLeft.castShadow = !isSoftwareGl;
  ladder.add(backLeft);

  const backRight = new THREE.Mesh(railGeo, railMat);
  backRight.position.set(width / 2, height / 2, -0.25);
  backRight.rotation.x = 0.14;
  backRight.castShadow = !isSoftwareGl;
  ladder.add(backRight);

  // Rungs
  const rungGeo = new THREE.CylinderGeometry(0.038, 0.038, width + 0.06, 8);
  rungGeo.rotateZ(Math.PI / 2);
  for (let i = 1; i <= 5; i++) {
    const frac = i / 5.6;
    const rung = new THREE.Mesh(rungGeo, railMat);
    rung.position.set(0, frac * height, 0.25 - (frac - 0.5) * 0.44);
    rung.castShadow = !isSoftwareGl;
    ladder.add(rung);
  }

  // Top platform step where the Pusher Gnome stands
  const topStep = new THREE.Mesh(new THREE.BoxGeometry(width + 0.18, 0.09, 0.42), railMat);
  topStep.position.set(0, height - 0.04, 0);
  topStep.castShadow = !isSoftwareGl;
  topStep.receiveShadow = !isSoftwareGl;
  ladder.add(topStep);

  return ladder;
}

function createElfWoodenBucket(
  woodTex: THREE.Texture,
  snowMat: THREE.Material,
  isSoftwareGl: boolean
): THREE.Group {
  const bucket = new THREE.Group();

  const staveMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x5a341b,
    roughness: 0.76,
    metalness: 0.05,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x222225,
    roughness: 0.42,
    metalness: 0.88,
  });

  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0xdca658, // aged brass rivets
    roughness: 0.32,
    metalness: 0.82,
  });

  const height = 0.52;
  const topRadius = 0.48; // tapered bucket: wider at top, narrower at bottom
  const bottomRadius = 0.38;

  // 1. Tapered Wooden Staves Core (Copo cônico do balde com tábuas de carvalho)
  const bodyGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 22);
  const bodyMesh = new THREE.Mesh(bodyGeo, staveMat);
  bodyMesh.position.y = height / 2;
  bodyMesh.castShadow = !isSoftwareGl;
  bodyMesh.receiveShadow = !isSoftwareGl;
  bucket.add(bodyMesh);

  // 2. Individual Vertical Wooden Staves (16 beveled wooden slats)
  const staveCount = 16;
  const staveAngleStep = (Math.PI * 2) / staveCount;
  for (let i = 0; i < staveCount; i++) {
    const angle = i * staveAngleStep;
    const groove = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, height + 0.01, 4),
      new THREE.MeshStandardMaterial({ color: 0x1f1008, roughness: 0.9 })
    );
    const midR = (topRadius + bottomRadius) / 2 + 0.005;
    groove.position.set(Math.cos(angle) * midR, height / 2, Math.sin(angle) * midR);
    bucket.add(groove);
  }

  // 3. Heavy Forged Iron Hoops (Aros de ferro reforçados com rebites)
  const hoopLevels = [
    { y: height - 0.038, r: topRadius + 0.012, w: 0.052 },
    { y: height * 0.52, r: (topRadius + bottomRadius) / 2 + 0.012, w: 0.048 },
    { y: 0.055, r: bottomRadius + 0.012, w: 0.052 },
  ];

  hoopLevels.forEach((hl) => {
    const hoop = new THREE.Mesh(
      new THREE.CylinderGeometry(hl.r, hl.r, hl.w, 24, 1, true),
      ironMat
    );
    hoop.position.y = hl.y;
    bucket.add(hoop);

    // Circumferential rivets on the metal band
    const rivetCount = 8;
    for (let rv = 0; rv < rivetCount; rv++) {
      const a = (rv / rivetCount) * Math.PI * 2 + 0.12;
      const rivet = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 8, 8),
        rivetMat
      );
      rivet.position.set(Math.cos(a) * (hl.r + 0.008), hl.y, Math.sin(a) * (hl.r + 0.008));
      bucket.add(rivet);
    }
  });

  // 4. Sturdy Wooden Planks Top (Tampa/Plataforma superior onde os sapatos do duende descansam)
  const topCover = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius - 0.02, topRadius - 0.02, 0.035, 22),
    staveMat
  );
  topCover.position.y = height - 0.01;
  topCover.receiveShadow = !isSoftwareGl;
  bucket.add(topCover);

  // 7. Frosted Snow Trim on Bucket Rim
  const snowRim = new THREE.Mesh(
    new THREE.TorusGeometry(topRadius, 0.032, 8, 24),
    snowMat
  );
  snowRim.rotation.x = Math.PI / 2;
  snowRim.position.y = height + 0.005;
  bucket.add(snowRim);

  return bucket;
}

function createWoodenStump(
  woodTex: THREE.Texture,
  treeRingsTex: THREE.Texture,
  snowMat: THREE.Material,
  isSoftwareGl: boolean
): THREE.Group {
  const stump = new THREE.Group();

  const barkMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x482813,
    roughness: 0.94,
    metalness: 0.04,
  });

  const ringsMat = new THREE.MeshStandardMaterial({
    map: treeRingsTex,
    roughness: 0.72,
    metalness: 0.02,
  });

  const height = 0.58;
  const topRadius = 0.46;
  const bottomRadius = 0.58;

  // 1. Tilted Trunk Body (cut face tilted forward toward camera so tree growth rings are clearly visible!)
  const trunkBody = new THREE.Group();
  trunkBody.rotation.x = 0.24; // Tilted towards the camera so player sees the cut wood surface!
  trunkBody.rotation.y = 0.35;
  stump.add(trunkBody);

  // Main trunk core cylinder (with bark on sides, open top/bottom)
  const coreGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 24, 1, true);
  const coreMesh = new THREE.Mesh(coreGeo, barkMat);
  coreMesh.position.y = height / 2;
  coreMesh.castShadow = !isSoftwareGl;
  coreMesh.receiveShadow = !isSoftwareGl;
  trunkBody.add(coreMesh);

  // Rugged vertical bark flutes / ribs around the trunk
  const fluteCount = 14;
  for (let i = 0; i < fluteCount; i++) {
    const angle = (i / fluteCount) * Math.PI * 2;
    const rTop = topRadius + (Math.sin(i * 2.3) * 0.02);
    const rBot = bottomRadius + (Math.cos(i * 1.7) * 0.035);
    const fluteGeo = new THREE.CylinderGeometry(0.042, 0.065, height * 0.98, 6);
    const fluteMesh = new THREE.Mesh(fluteGeo, barkMat);
    const midR = (rTop + rBot) / 2;
    fluteMesh.position.set(Math.cos(angle) * midR, height / 2, Math.sin(angle) * midR);
    fluteMesh.rotation.y = angle;
    trunkBody.add(fluteMesh);
  }

  // Broken side branch stub jutting out from trunk
  const branchKnot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.095, 0.24, 8),
    barkMat
  );
  branchKnot.position.set(-topRadius * 0.88, height * 0.48, topRadius * 0.25);
  branchKnot.rotation.z = 0.85;
  branchKnot.rotation.y = -0.4;
  trunkBody.add(branchKnot);

  // Severed cut face of the side branch with tiny rings
  const branchCut = new THREE.Mesh(
    new THREE.CircleGeometry(0.064, 12),
    ringsMat
  );
  branchCut.position.set(-topRadius * 0.88 - 0.1, height * 0.48 + 0.07, topRadius * 0.25);
  branchCut.rotation.y = -Math.PI / 2;
  branchCut.rotation.z = -0.85;
  trunkBody.add(branchCut);

  // Cut Top Cross-Section with concentric Tree Rings
  const topCapGeo = new THREE.CircleGeometry(topRadius + 0.005, 32);
  topCapGeo.rotateX(-Math.PI / 2);
  const topCap = new THREE.Mesh(topCapGeo, ringsMat);
  topCap.position.y = height + 0.002;
  topCap.receiveShadow = !isSoftwareGl;
  trunkBody.add(topCap);

  // Rough outer cambium / bark rim collar around the cut surface
  const rimBark = new THREE.Mesh(
    new THREE.TorusGeometry(topRadius + 0.008, 0.032, 8, 32),
    barkMat
  );
  rimBark.rotation.x = Math.PI / 2;
  rimBark.position.y = height + 0.001;
  trunkBody.add(rimBark);

  // Soft snow dusting on the BACK rim of the stump (leaving tree rings open and visible!)
  const backSnowRim = new THREE.Mesh(
    new THREE.TorusGeometry(topRadius, 0.038, 8, 20, Math.PI * 0.75),
    snowMat
  );
  backSnowRim.rotation.x = Math.PI / 2;
  backSnowRim.rotation.z = Math.PI * 0.75;
  backSnowRim.position.set(0, height + 0.02, 0);
  trunkBody.add(backSnowRim);

  return stump;
}

function createCandyCane(isSoftwareGl: boolean): THREE.Group {
  const cane = new THREE.Group();

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    roughness: 0.28,
    metalness: 0.05,
  });
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xd62828,
    roughness: 0.25,
    metalness: 0.1,
  });

  const stemHeight = 0.95;
  const radius = 0.045;
  const stripeCount = 10;
  const sliceHeight = stemHeight / stripeCount;

  // Straight stem with alternating glossy red and white peppermint candy stripes
  for (let i = 0; i < stripeCount; i++) {
    const mat = i % 2 === 0 ? whiteMat : redMat;
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, sliceHeight, 14), mat);
    stripe.position.y = i * sliceHeight + sliceHeight / 2;
    stripe.castShadow = !isSoftwareGl;
    cane.add(stripe);
  }

  // Curved candy cane hook arch on top
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, stemHeight, 0),
    new THREE.Vector3(0.04, stemHeight + 0.14, 0),
    new THREE.Vector3(0.18, stemHeight + 0.22, 0),
    new THREE.Vector3(0.32, stemHeight + 0.14, 0),
    new THREE.Vector3(0.34, stemHeight + 0.02, 0),
  ]);

  const hookGeo = new THREE.TubeGeometry(hookCurve, 18, radius, 12, false);
  const hookMesh = new THREE.Mesh(hookGeo, redMat);
  hookMesh.castShadow = !isSoftwareGl;
  cane.add(hookMesh);

  // White spiral stripe overlays on hook
  for (let s = 1; s <= 4; s++) {
    const pt = hookCurve.getPoint(s / 5);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.003, 0.012, 6, 12), whiteMat);
    ring.position.copy(pt);
    cane.add(ring);
  }

  // Cute festive green ribbon bow tied on the stem
  const bowMat = new THREE.MeshStandardMaterial({
    color: 0x1f7840,
    roughness: 0.45,
  });
  const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), bowMat);
  bowKnot.position.set(0, stemHeight * 0.72, radius + 0.01);
  cane.add(bowKnot);

  const loopL = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 6, 12), bowMat);
  loopL.position.set(-0.06, stemHeight * 0.72, radius + 0.02);
  loopL.rotation.y = 0.4;
  cane.add(loopL);

  const loopR = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 6, 12), bowMat);
  loopR.position.set(0.06, stemHeight * 0.72, radius + 0.02);
  loopR.rotation.y = -0.4;
  cane.add(loopR);

  return cane;
}

function createOrnamentalGift(
  size: number,
  wrapColor: number,
  ribbonColor: number,
  isSoftwareGl: boolean
): THREE.Group {
  const g = new THREE.Group();
  const boxMat = new THREE.MeshStandardMaterial({
    color: wrapColor,
    roughness: 0.38,
    metalness: 0.08,
  });
  const ribMat = new THREE.MeshStandardMaterial({
    color: ribbonColor,
    roughness: 0.28,
    metalness: 0.22,
  });

  const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), boxMat);
  box.position.y = size / 2;
  box.castShadow = !isSoftwareGl;
  g.add(box);

  const rW = size * 0.22;
  const rib1 = new THREE.Mesh(new THREE.BoxGeometry(rW, size + 0.005, size + 0.008), ribMat);
  rib1.position.y = size / 2;
  g.add(rib1);

  const rib2 = new THREE.Mesh(new THREE.BoxGeometry(size + 0.008, size + 0.005, rW), ribMat);
  rib2.position.y = size / 2;
  g.add(rib2);

  const knot = new THREE.Mesh(new THREE.SphereGeometry(size * 0.15, 8, 8), ribMat);
  knot.position.y = size + size * 0.06;
  g.add(knot);

  return g;
}
