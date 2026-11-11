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

        // Vibrant winter midnight arctic gradient
        vec3 horizonCol = vec3(0.09, 0.22, 0.36);
        vec3 midSkyCol = vec3(0.05, 0.12, 0.25);
        vec3 zenithCol = vec3(0.02, 0.06, 0.15);
        vec3 col = mix(horizonCol, midSkyCol, smoothstep(0.40, 0.65, h));
        col = mix(col, zenithCol, smoothstep(0.65, 0.95, h));

        // Radiant Glowing Full Moon in upper right sky
        vec3 moonDir = normalize(vec3(0.62, 0.54, -0.57));
        float moonDist = length(dir - moonDir);
        if (moonDist < 0.28) {
          float moonCore = smoothstep(0.055, 0.048, moonDist);
          float moonGlow = exp(-moonDist * 14.0) * 0.75;
          vec3 moonCol = vec3(1.0, 0.96, 0.88);
          col += moonCol * (moonCore * 2.2 + moonGlow);
        }

        // Shimmering Aurora Borealis ribbons (emerald green, turquoise, violet)
        if (dir.y > -0.05 && dir.z < 0.35) {
          vec2 uv = vec2(dir.x * 2.8 + dir.z * 0.8, dir.y * 4.4);
          float wave1 = sin(uv.x * 2.4 + uTime * 0.35 + noise(uv * 1.9) * 2.6);
          float wave2 = cos(uv.x * 3.8 - uTime * 0.28 + noise(uv * 2.8 + 4.0) * 2.2);
          float curtain = exp(-pow((dir.y - 0.25 - wave1 * 0.08) * 6.2, 2.0));
          float curtain2 = exp(-pow((dir.y - 0.34 - wave2 * 0.07) * 7.2, 2.0));
          float streaks = 0.55 + 0.45 * noise(vec2(uv.x * 9.5 + uTime * 0.18, dir.y * 2.8));

          vec3 auroraGreen = vec3(0.12, 0.92, 0.62);
          vec3 auroraTeal = vec3(0.08, 0.68, 0.88);
          vec3 auroraViolet = vec3(0.62, 0.28, 0.85);
          float fadeZ = smoothstep(0.35, -0.35, dir.z);
          col += (auroraGreen * curtain * 0.58 + auroraTeal * curtain2 * 0.42 + auroraViolet * curtain * curtain2 * 0.4) * streaks * fadeZ;
        }

        // Crisp multi-scale twinkling winter stars
        if (dir.y > 0.05) {
          vec2 starGrid = floor(dir.xy * 210.0 + dir.z * 110.0);
          float starSeed = hash(starGrid);
          if (starSeed > 0.984) {
            float twinkle = 0.55 + 0.45 * sin(uTime * 2.8 + starSeed * 80.0);
            float starSize = fract(starSeed * 100.0);
            float starBright = starSize > 0.7 ? 1.4 : 0.85;
            col += vec3(0.96, 0.98, 1.0) * twinkle * starBright * smoothstep(0.05, 0.22, dir.y);
          }
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, auroraMaterial);
  group.add(skyDome);

  // 3. Snow-Laden 3D Pine Trees (Thick surrounding forest)
  const treePositions: Array<{ x: number; z: number; scale: number; rot: number }> = [
    // Foreground-left framing pine
    { x: -7.8, z: 2.2, scale: 1.48, rot: 0.4 },
    { x: -8.8, z: -1.4, scale: 1.62, rot: 1.2 },
    { x: -9.8, z: 0.8, scale: 1.45, rot: 2.5 },
    // Foreground-right framing pine
    { x: 8.2, z: 2.0, scale: 1.45, rot: 0.9 },
    { x: 9.2, z: -1.2, scale: 1.58, rot: 1.8 },
    // Midground clearing pines framing scene
    { x: -6.9, z: -4.8, scale: 1.38, rot: 2.1 },
    { x: -4.8, z: -6.8, scale: 1.32, rot: 0.8 },
    { x: -2.2, z: -8.4, scale: 1.48, rot: 1.7 },
    { x: 0.9, z: -8.2, scale: 1.42, rot: 2.9 },
    { x: 3.4, z: -6.4, scale: 1.36, rot: 0.5 },
    { x: 5.8, z: -5.6, scale: 1.52, rot: 1.9 },
    { x: 7.9, z: -4.2, scale: 1.38, rot: 2.4 },
    // Distant deep forest layer
    { x: -11.2, z: -8.5, scale: 1.82, rot: 0.3 },
    { x: -8.2, z: -10.2, scale: 1.92, rot: 1.1 },
    { x: -4.8, z: -11.5, scale: 1.98, rot: 2.2 },
    { x: -0.6, z: -11.8, scale: 1.88, rot: 0.9 },
    { x: 3.2, z: -11.2, scale: 1.92, rot: 1.6 },
    { x: 7.2, z: -10.4, scale: 1.82, rot: 2.7 },
    { x: 10.6, z: -8.8, scale: 1.88, rot: 0.6 },
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

  const bulbMaterials: THREE.MeshStandardMaterial[] = [];
  const bulbPalette = [0xffcf6e, 0xff5e57, 0x4cd137, 0x48dbfb, 0xffb142];
  bulbPalette.forEach((hex) => {
    bulbMaterials.push(
      new THREE.MeshStandardMaterial({
        color: hex,
        emissive: hex,
        emissiveIntensity: 1.5,
        roughness: 0.25,
      })
    );
  });

  const animatedTrees: THREE.Group[] = [];

  treePositions.forEach((tp, tIndex) => {
    const hasOrnaments = tIndex < 12;
    const tree = createSnowyPineTree(
      trunkMat,
      pineMat,
      treeSnowMat,
      bulbMaterials,
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

  // 4. Props in the Snow: Wooden Ladder (positioned behind the wheel), Log (bottom-left), Stump (bottom-right)
  const ladder = createWoodenLadder(woodTex, isSoftwareGl);
  // Wheel center is at (0.0, 2.75, 0) with radius ~2.35
  const ladderX = -1.95;
  const ladderZ = -0.48;
  ladder.position.set(ladderX, groundHeightAt(ladderX, ladderZ) + 0.12, ladderZ);
  ladder.rotation.z = -0.18;
  ladder.rotation.y = 0.35;
  group.add(ladder);

  const log = createSnowyLog(woodTex, treeSnowMat, isSoftwareGl);
  const logX = -4.2;
  const logZ = 2.05;
  log.position.set(logX, groundHeightAt(logX, logZ) + 0.24, logZ);
  log.rotation.y = 0.42;
  group.add(log);

  const logShadow = new THREE.Mesh(
    shadowPlaneGeo,
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  logShadow.position.set(logX, groundHeightAt(logX, logZ) + 0.025, logZ);
  logShadow.scale.set(2.1, 1, 1.2);
  logShadow.rotation.y = 0.42;
  group.add(logShadow);

  const stump = createWoodenStump(woodTex, treeSnowMat, isSoftwareGl);
  const stumpX = 2.47;
  const stumpZ = 1.75;
  stump.position.set(stumpX, groundHeightAt(stumpX, stumpZ), stumpZ);
  group.add(stump);

  const stumpShadow = new THREE.Mesh(
    shadowPlaneGeo,
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    })
  );
  stumpShadow.position.set(stumpX, groundHeightAt(stumpX, stumpZ) + 0.025, stumpZ);
  stumpShadow.scale.setScalar(1.35);
  group.add(stumpShadow);

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

    // Gentle twinkle on string light and tree ornament materials
    for (let i = 0; i < bulbMaterials.length; i++) {
      bulbMaterials[i].emissiveIntensity = 1.35 + 0.55 * Math.sin(elapsed * 2.8 + i * 1.3);
    }

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

  return {
    group,
    auroraMaterial,
    snowPoints,
    bulbMaterials,
    updateEnvironment,
  };
}

function createSnowyPineTree(
  trunkMat: THREE.Material,
  pineMat: THREE.Material,
  snowMat: THREE.Material,
  bulbMaterials: THREE.MeshStandardMaterial[],
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

    // Bauble ornaments
    if (hasOrnaments) {
      for (let b = 0; b < t.ornamentCount; b++) {
        const theta = (b / t.ornamentCount) * Math.PI * 2 + idx * 0.7;
        const rad = t.r * 0.88;
        const mat = bulbMaterials[(b + idx * 2) % bulbMaterials.length];
        const ornament = new THREE.Mesh(ornamentSphereGeo, mat);
        const ox = Math.cos(theta) * rad;
        const oy = t.y - t.h * 0.38;
        const oz = Math.sin(theta) * rad;
        ornament.position.set(ox, oy, oz);
        tree.add(ornament);
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

function createSnowyLog(
  woodTex: THREE.Texture,
  snowMat: THREE.Material,
  isSoftwareGl: boolean
): THREE.Group {
  const log = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x4f2e18,
    roughness: 0.9,
  });
  const endGrainMat = new THREE.MeshStandardMaterial({
    color: 0xc89f6d,
    roughness: 0.78,
  });

  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.3, 1.55, 16);
  bodyGeo.rotateZ(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, [barkMat, endGrainMat, endGrainMat]);
  body.castShadow = !isSoftwareGl;
  body.receiveShadow = !isSoftwareGl;
  log.add(body);

  // Snow cushion along ends of log
  const snowPatch = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), snowMat);
  snowPatch.scale.set(1.6, 0.35, 0.85);
  snowPatch.position.set(-0.46, 0.25, 0);
  log.add(snowPatch);

  return log;
}

function createWoodenStump(
  woodTex: THREE.Texture,
  snowMat: THREE.Material,
  isSoftwareGl: boolean
): THREE.Group {
  const stump = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x4d2d17,
    roughness: 0.88,
  });
  const topMat = new THREE.MeshStandardMaterial({
    color: 0xcba170,
    roughness: 0.75,
  });

  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.52, 0.62, 16),
    [barkMat, topMat, barkMat]
  );
  cyl.position.y = 0.31;
  cyl.castShadow = !isSoftwareGl;
  cyl.receiveShadow = !isSoftwareGl;
  stump.add(cyl);

  const snowRim = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.08, 8, 18), snowMat);
  snowRim.rotation.x = Math.PI / 2;
  snowRim.position.y = 0.06;
  stump.add(snowRim);

  return stump;
}
