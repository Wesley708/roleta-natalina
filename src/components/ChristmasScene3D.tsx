import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine';
import {
  createGiftBox,
  createGnome,
  createReindeer,
  createSnowman,
  GnomeRig,
  ReindeerRig,
  SnowmanRig,
  updateGnomeAnimation,
  updateReindeerIdle,
  updateSnowmanIdle,
} from '../three/characters';
import { createWinterEnvironment, groundHeightAt } from '../three/environment';
import { createSignpost3D } from '../three/signboardModel';
import {
  createContactShadowTexture,
  createGiftWrapTexture,
  createSoftGlowTexture,
  createStripedSockTexture,
  createTreeRingsTexture,
  createWoodGrainTexture,
} from '../three/textures';
import { createWheelAssembly } from '../three/wheelModel';
import { SpinPhase, WheelItem } from '../types/wheel';

interface ChristmasScene3DProps {
  items: WheelItem[];
  spinPhase: SpinPhase;
  spinRequestId: number;
  onRequestSpin: () => void;
  onPhaseChange: (phase: SpinPhase) => void;
  onWinnerSelected: (winner: WheelItem) => void;
  onGiftBoxScreenAnchor?: (anchor: { xPercent: number; yPercent: number }) => void;
  onToggleSignboard?: () => void;
}

// Pre-allocated math helpers outside render loop (zero per-frame GC)
const _pointerNdc = new THREE.Vector2();
const _projVec = new THREE.Vector3();
const _curveP0 = new THREE.Vector3(0, 1.85, -1.75);
const _curveP1 = new THREE.Vector3(0, 1.45, 1.65);
const _curveP2 = new THREE.Vector3(0, 1.05, 5.25);
const _giftPos = new THREE.Vector3();

function evalQuadraticBezier(
  out: THREE.Vector3,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  t: number
) {
  const inv = 1 - t;
  out.x = inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x;
  out.y = inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y;
  out.z = inv * inv * p0.z + 2 * inv * t * p1.z + t * t * p2.z;
}

export function ChristmasScene3D({
  items,
  spinPhase,
  spinRequestId,
  onRequestSpin,
  onPhaseChange,
  onWinnerSelected,
  onGiftBoxScreenAnchor,
  onToggleSignboard,
}: ChristmasScene3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hubBtnRef = useRef<HTMLButtonElement | null>(null);
  const hubHoverExternalRef = useRef<boolean>(false);

  // Mutable refs so React UI updates never recreate WebGL context
  const itemsRef = useRef<WheelItem[]>(items);
  const spinPhaseRef = useRef<SpinPhase>(spinPhase);
  const callbacksRef = useRef({
    onRequestSpin,
    onPhaseChange,
    onWinnerSelected,
    onGiftBoxScreenAnchor,
    onToggleSignboard,
  });

  itemsRef.current = items;
  spinPhaseRef.current = spinPhase;
  callbacksRef.current = {
    onRequestSpin,
    onPhaseChange,
    onWinnerSelected,
    onGiftBoxScreenAnchor,
    onToggleSignboard,
  };

  const sceneApiRef = useRef<{
    rebuildSlices: (nextItems: WheelItem[]) => void;
    triggerSpin: () => void;
  } | null>(null);

  // Rebuild wheel slices dynamically whenever items change
  useEffect(() => {
    sceneApiRef.current?.rebuildSlices(items);
  }, [items]);

  // Trigger spin sequence when spinRequestId increments
  useEffect(() => {
    if (spinRequestId > 0) {
      sceneApiRef.current?.triggerSpin();
    }
  }, [spinRequestId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL from GPU renderer string
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initW = container.clientWidth || window.innerWidth;
    const initH = container.clientHeight || window.innerHeight;
    renderer.setSize(initW, initH);
    renderer.domElement.className = 'block w-full h-full outline-none';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030914);
    scene.fog = new THREE.FogExp2(0x040c1a, 0.038);

    // Studio environment reflection for brushed brass & satin ribbons
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.55;
    pmremGenerator.dispose();

    // Wheel centered at 0.0 on X axis
    const wheelX = 0.0;
    const wheelZ = 0.0;
    const wheelY = groundHeightAt(wheelX, wheelZ);

    // Camera framed so 3D Wheel is centered in viewport
    const camera = new THREE.PerspectiveCamera(39, initW / initH, 0.1, 90);
    const syncHubDomButton = () => {
      const btn = hubBtnRef.current;
      if (!btn) return;
      camera.updateMatrixWorld();
      _projVec.set(wheelX, wheelY + 2.68, wheelZ + 0.32);
      _projVec.project(camera);
      const xPct = (_projVec.x * 0.5 + 0.5) * 100;
      const yPct = (-_projVec.y * 0.5 + 0.5) * 100;
      btn.style.left = `${xPct}%`;
      btn.style.top = `${yPct}%`;
    };

    const updateCameraFraming = (w: number, h: number) => {
      const aspect = w / Math.max(1, h);
      const camZ = aspect > 1.25 ? 9.2 : 10.8;
      camera.position.set(0.0, 2.72, camZ);
      camera.lookAt(0.0, 2.42, 0);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      syncHubDomButton();
    };
    updateCameraFraming(initW, initH);

    // Balanced Winter Moon + Warm Garland Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7ec4ff, 0x243b5c, 0.95);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffdfad, 2.15);
    keyLight.position.set(4.5, 9.2, 7.5);
    keyLight.target.position.set(0.0, 2.0, 0);
    scene.add(keyLight.target);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      const d = 8.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 28;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x5de6b8, 1.05);
    rimLight.position.set(-5.5, 6.5, -6.5);
    scene.add(rimLight);

    const wheelWarmGlow = new THREE.PointLight(0xfff5e0, 4.5, 12.0, 1.3);
    wheelWarmGlow.position.set(0.0, 3.5, 2.8);
    scene.add(wheelWarmGlow);

    // 3. Procedural Textures
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const woodTex = createWoodGrainTexture('#5c3419', '#301708', maxAniso);
    const treeRingsTex = createTreeRingsTexture(maxAniso);
    const sockTex = createStripedSockTexture(maxAniso);
    const giftWrapTex = createGiftWrapTexture(maxAniso);
    const glowTex = createSoftGlowTexture();
    const contactShadowTex = createContactShadowTexture();

    // 4. Environment (Snow Terrain, Aurora Sky, Pines, Ladder, Bucket, Tilted Stump, Fairy Lights, 3D Snow)
    const envAssets = createWinterEnvironment(contactShadowTex, woodTex, glowTex, treeRingsTex, isSoftwareGl);
    scene.add(envAssets.group);

    // 5. 3D Natalina Wheel Assembly Integrated into the Snow
    const wheel = createWheelAssembly(
      itemsRef.current,
      woodTex,
      contactShadowTex,
      glowTex,
      maxAniso,
      isSoftwareGl
    );
    wheel.root.position.set(wheelX, wheelY, wheelZ);
    scene.add(wheel.root);

    // 6. Interactive 3D Gnomes Around the Wheel & Ground
    const gnomes: GnomeRig[] = [];
    const shadowGeo = new THREE.PlaneGeometry(1.1, 1.1);
    shadowGeo.rotateX(-Math.PI / 2);

    const addGnomeShadow = (gx: number, gz: number) => {
      const sh = new THREE.Mesh(
        shadowGeo,
        new THREE.MeshBasicMaterial({
          map: contactShadowTex,
          transparent: true,
          depthWrite: false,
          opacity: 0.55,
        })
      );
      sh.position.set(gx, groundHeightAt(gx, gz) + 0.025, gz);
      scene.add(sh);
    };

    // (a) Red-Hat Elf standing in full view on top of the wooden ladder beside the wheel
    const ladderX = 2.62;
    const ladderZ = -0.38;
    const ladderTopX = ladderX - 0.26;
    const ladderTopY = groundHeightAt(ladderX, ladderZ) + 0.12 + 3.20;
    const rimGnome = createGnome(
      { role: 'rimWatcher', hatPrimaryHex: 0xc92228, tunicHex: 0x1e6f3d, phaseOffset: 1.2 },
      sockTex,
      isSoftwareGl
    );
    rimGnome.baseY = ladderTopY;
    rimGnome.group.position.set(ladderTopX, ladderTopY, ladderZ + 0.08);
    rimGnome.group.rotation.y = -0.42;
    rimGnome.group.scale.setScalar(1.10);
    scene.add(rimGnome.group);
    gnomes.push(rimGnome);

    // (c) Ground Left Helper Gnome beside lower-left of wheel
    const groundLeftX = -1.8;
    const groundLeftZ = 1.65;
    const groundHelperGnome = createGnome(
      { role: 'groundHelper', hatPrimaryHex: 0xc92228, tunicHex: 0x1c6838, phaseOffset: 0.7 },
      sockTex,
      isSoftwareGl
    );
    groundHelperGnome.baseY = groundHeightAt(groundLeftX, groundLeftZ);
    groundHelperGnome.group.position.set(groundLeftX, groundHelperGnome.baseY, groundLeftZ);
    groundHelperGnome.group.rotation.y = 0.42;
    groundHelperGnome.group.scale.setScalar(1.12);
    scene.add(groundHelperGnome.group);
    addGnomeShadow(groundLeftX, groundLeftZ);
    gnomes.push(groundHelperGnome);

    // (d) Bearded Elder Gnome standing on the Rustic Tree Trunk (bottom-left)
    const elderX = -4.2;
    const elderZ = 2.05;
    const elderGnome = createGnome(
      {
        role: 'elderOnLog',
        hasBeard: true,
        seated: false,
        hatPrimaryHex: 0x1e6f3d,
        tunicHex: 0x1e6f3d,
        phaseOffset: 2.1,
      },
      sockTex,
      isSoftwareGl
    );
    // Tree stump cut face is tilted forward with tree rings visible
    const stumpTopY = groundHeightAt(elderX, elderZ) + 0.56;
    elderGnome.baseY = stumpTopY;
    elderGnome.group.position.set(elderX, stumpTopY, elderZ - 0.12);
    elderGnome.group.rotation.x = 0.22;
    elderGnome.group.rotation.y = 0.38;
    elderGnome.group.scale.setScalar(1.08);
    scene.add(elderGnome.group);
    gnomes.push(elderGnome);

    // (e) Standing Cheerful Elf on Top of the Wooden Bucket (bottom-right of wheel)
    const rightGnomeX = 2.47;
    const rightGnomeZ = 1.75;
    const stumpStandingGnome = createGnome(
      {
        role: 'stumpStanding',
        seated: false,
        hatPrimaryHex: 0xc92228,
        tunicHex: 0x1f6e3c,
        phaseOffset: 1.5,
      },
      sockTex,
      isSoftwareGl
    );
    // Bucket height is 0.52 with level wooden top
    const bucketTopY = groundHeightAt(rightGnomeX, rightGnomeZ) + 0.52;
    stumpStandingGnome.baseY = bucketTopY;
    stumpStandingGnome.group.position.set(rightGnomeX, bucketTopY, rightGnomeZ);
    stumpStandingGnome.group.rotation.x = 0;
    stumpStandingGnome.group.rotation.y = -0.32;
    stumpStandingGnome.group.scale.setScalar(1.08);
    scene.add(stumpStandingGnome.group);
    gnomes.push(stumpStandingGnome);

    // (f) 3D Animated Festive Snowman (Boneco de Neve) next to stump & candy canes
    const snowmanX = 3.57;
    const snowmanZ = 1.92;
    const snowman = createSnowman(isSoftwareGl);
    snowman.baseY = groundHeightAt(snowmanX, snowmanZ);
    snowman.group.position.set(snowmanX, snowman.baseY, snowmanZ);
    snowman.group.rotation.y = -0.42;
    snowman.group.scale.setScalar(1.22);
    scene.add(snowman.group);
    addGnomeShadow(snowmanX, snowmanZ);

    // 7. Prominent Visible Reindeers in Left and Right Clearings
    const reindeerList: ReindeerRig[] = [];
    const deer1X = -4.65;
    const deer1Z = 0.35;
    const deer1 = createReindeer(true, 0.5, isSoftwareGl);
    deer1.group.position.set(deer1X, groundHeightAt(deer1X, deer1Z), deer1Z);
    deer1.group.rotation.y = 0.55;
    deer1.group.scale.setScalar(1.42);
    scene.add(deer1.group);
    addGnomeShadow(deer1X, deer1Z);
    reindeerList.push(deer1);

    const deer2X = 3.85;
    const deer2Z = 0.35;
    const deer2 = createReindeer(false, 2.1, isSoftwareGl);
    deer2.group.position.set(deer2X, groundHeightAt(deer2X, deer2Z), deer2Z);
    deer2.group.rotation.y = -0.48;
    deer2.group.scale.setScalar(1.42);
    scene.add(deer2.group);
    addGnomeShadow(deer2X, deer2Z);
    reindeerList.push(deer2);

    // 3D Christmas Gift Box (Hidden Behind the Wheel Until Prize Reveal!)
    const giftBox = createGiftBox(giftWrapTex, glowTex, isSoftwareGl);
    giftBox.group.position.copy(_curveP0);
    giftBox.group.scale.setScalar(0.55);
    giftBox.group.visible = false;
    scene.add(giftBox.group);

    // Pre-compile shaders on hardware WebGL
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Physics & Choreography State
    let rotorAngle = 0;
    let angularVelocity = 0;
    let maxSpinVelocity = 16;
    let lastTickIndex = 0;
    let pointerAngle = 0;
    let pointerVel = 0;

    let pushElapsed = 0;
    let spinImpulseApplied = false;
    let revealTimer = 0;
    let hubHover = false;
    let hubScale = 1;

    const triggerSpin = () => {
      const currentItems = itemsRef.current;
      if (currentItems.length === 0) return;
      if (spinPhaseRef.current === 'pushing' || spinPhaseRef.current === 'spinning') return;

      giftBox.group.visible = false;
      giftBox.group.position.copy(_curveP0);
      giftBox.group.scale.setScalar(0.55);
      revealTimer = 0;

      hubScale = 0.9;
      pushElapsed = 0;
      spinImpulseApplied = false;
      spinPhaseRef.current = 'pushing';
      callbacksRef.current.onPhaseChange('pushing');
    };

    sceneApiRef.current = {
      rebuildSlices: (nextItems: WheelItem[]) => {
        wheel.rebuildSlices(nextItems);
      },
      triggerSpin,
    };

    // Raycasting on layer 1 (center 3D "GIRAR" button)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);

    const updatePointerFromEvent = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    let lastHoverCheck = 0;
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 32) return;
      lastHoverCheck = now;

      if (spinPhaseRef.current === 'revealing' || spinPhaseRef.current === 'revealed') {
        if (hubHover) {
          hubHover = false;
          renderer.domElement.style.cursor = 'default';
        }
        return;
      }

      updatePointerFromEvent(e);
      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObject(wheel.hubButtonGroup, true);
      const isOver = hits.length > 0 && itemsRef.current.length > 0;
      if (isOver !== hubHover) {
        hubHover = isOver;
        renderer.domElement.style.cursor = isOver ? 'pointer' : 'default';
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      updatePointerFromEvent(e);
      raycaster.setFromCamera(_pointerNdc, camera);

      if (
        spinPhaseRef.current === 'pushing' ||
        spinPhaseRef.current === 'spinning' ||
        spinPhaseRef.current === 'revealing' ||
        spinPhaseRef.current === 'revealed'
      ) {
        return;
      }

      const hits = raycaster.intersectObject(wheel.hubButtonGroup, true);
      if (hits.length > 0 && itemsRef.current.length > 0) {
        hubScale = 0.9;
        callbacksRef.current.onRequestSpin();
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      updateCameraFraming(w, h);
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    syncHubDomButton();

    // 10. Continuous Animation Loop with Software-WebGL Fence Pacing
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const rawDelta = clock.getDelta();
      const delta = Math.min(rawDelta, 0.1);
      const elapsed = clock.getElapsedTime();

      // Update sky aurora, twinkling lights, and 3D snow
      envAssets.updateEnvironment(elapsed, delta);
      wheel.updateAnimation(elapsed, spinPhaseRef.current === 'spinning' || spinPhaseRef.current === 'pushing');

      // Update center 3D "GIRAR" button hover/press spring
      const isHovered = (hubHover || hubHoverExternalRef.current) && spinPhaseRef.current === 'idle';
      const targetHubScale = isHovered ? 1.07 : 1.0;
      hubScale = THREE.MathUtils.damp(hubScale, targetHubScale, 12, delta);
      wheel.hubButtonGroup.scale.setScalar(hubScale);

      const phase = spinPhaseRef.current;

      // Spin Choreography
      if (phase === 'pushing') {
        pushElapsed += delta;
        if (!spinImpulseApplied && pushElapsed >= 0.21) {
          spinImpulseApplied = true;
          maxSpinVelocity = 17.5 + Math.random() * 5.5;
          angularVelocity = maxSpinVelocity;
          soundEngine.playSpinStart();
          const count = Math.max(1, itemsRef.current.length);
          const sliceAngle = (Math.PI * 2) / count;
          lastTickIndex = Math.floor(rotorAngle / sliceAngle);
        }

        if (spinImpulseApplied) {
          rotorAngle += angularVelocity * delta;
          wheel.rotorGroup.rotation.z = rotorAngle;
        }

        if (pushElapsed >= 0.42) {
          spinPhaseRef.current = 'spinning';
          callbacksRef.current.onPhaseChange('spinning');
        }
      } else if (phase === 'spinning') {
        angularVelocity *= Math.exp(-0.26 * delta);
        angularVelocity = Math.max(0, angularVelocity - 0.16 * delta);

        rotorAngle += angularVelocity * delta;
        wheel.rotorGroup.rotation.z = rotorAngle;

        const count = Math.max(1, itemsRef.current.length);
        const sliceAngle = (Math.PI * 2) / count;
        const currentTickIndex = Math.floor(rotorAngle / sliceAngle);
        if (currentTickIndex !== lastTickIndex) {
          lastTickIndex = currentTickIndex;
          const speedRatio = THREE.MathUtils.clamp(angularVelocity / maxSpinVelocity, 0.12, 1);
          pointerVel = -9.5 * (0.45 + speedRatio * 0.55);
          soundEngine.playWoodenTick(speedRatio);
        }

        if (angularVelocity <= 0.035) {
          angularVelocity = 0;
          const twoPi = Math.PI * 2;
          const angleFromTopClockwise = ((rotorAngle % twoPi) + twoPi) % twoPi;
          const currentItems = itemsRef.current;
          if (currentItems.length > 0) {
            const winIdx = Math.floor(angleFromTopClockwise / sliceAngle) % currentItems.length;
            const winner = currentItems[winIdx];
            callbacksRef.current.onWinnerSelected(winner);
          }

          revealTimer = 0;
          giftBox.group.visible = true;
          soundEngine.playGiftRevealFanfare();
          spinPhaseRef.current = 'revealing';
          callbacksRef.current.onPhaseChange('revealing');
        }
      } else if (phase === 'revealing' || phase === 'revealed') {
        revealTimer += delta;

        const slideRaw = THREE.MathUtils.clamp(revealTimer / 0.85, 0, 1);
        const slideEase = 1 - Math.pow(1 - slideRaw, 3);

        const aspect = camera.aspect;
        _curveP2.x = 0.0;
        _curveP2.y = 1.02;
        _curveP2.z = aspect > 1.25 ? 4.85 : 5.4;

        evalQuadraticBezier(_giftPos, _curveP0, _curveP1, _curveP2, slideEase);
        if (slideRaw >= 1) {
          _giftPos.y += Math.sin(elapsed * 2.2) * 0.04;
        }
        giftBox.group.position.copy(_giftPos);

        const boxScale = THREE.MathUtils.lerp(0.52, 0.98, slideEase);
        giftBox.group.scale.setScalar(boxScale);
        giftBox.group.rotation.y = THREE.MathUtils.lerp(-0.75, 0.0, slideEase);

        const openRaw = THREE.MathUtils.clamp((revealTimer - 0.82) / 0.48, 0, 1);
        giftBox.update(elapsed, delta, slideEase, openRaw);

        if (callbacksRef.current.onGiftBoxScreenAnchor) {
          _projVec.set(_giftPos.x, _giftPos.y + 0.92 * boxScale, _giftPos.z);
          _projVec.project(camera);
          const xPercent = (_projVec.x * 0.5 + 0.5) * 100;
          const yPercent = (-_projVec.y * 0.5 + 0.5) * 100;
          callbacksRef.current.onGiftBoxScreenAnchor({ xPercent, yPercent });
        }

        if (phase === 'revealing' && revealTimer >= 1.12) {
          spinPhaseRef.current = 'revealed';
          callbacksRef.current.onPhaseChange('revealed');
        }
      } else {
        if (giftBox.group.visible) {
          giftBox.group.visible = false;
        }
      }

      // Spring-damper physics on top golden clapper pointer
      const springStiffness = 190;
      const springDamping = 14;
      const accel = -springStiffness * pointerAngle - springDamping * pointerVel;
      pointerVel += accel * delta;
      pointerAngle += pointerVel * delta;
      pointerAngle = THREE.MathUtils.clamp(pointerAngle, -0.68, 0.25);
      wheel.pointerPivot.rotation.z = pointerAngle;

      // Update Gnomes, Snowman & Reindeers
      const speedRatio = THREE.MathUtils.clamp(angularVelocity / maxSpinVelocity, 0, 1);
      for (let i = 0; i < gnomes.length; i++) {
        updateGnomeAnimation(gnomes[i], elapsed, spinPhaseRef.current, pushElapsed, speedRatio);
      }
      updateSnowmanIdle(snowman, elapsed, spinPhaseRef.current);
      for (let i = 0; i < reindeerList.length; i++) {
        updateReindeerIdle(reindeerList[i], elapsed);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      wheel.dispose();
      woodTex.dispose();
      sockTex.dispose();
      giftWrapTex.dispose();
      glowTex.dispose();
      contactShadowTex.dispose();
      envTarget.dispose();

      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const canClickHub = spinPhase === 'idle' && items.length > 0;

  return (
    <>
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />
      <button
        ref={hubBtnRef}
        type="button"
        aria-label="GIRAR"
        disabled={!canClickHub}
        onClick={onRequestSpin}
        onPointerEnter={() => {
          hubHoverExternalRef.current = true;
        }}
        onPointerLeave={() => {
          hubHoverExternalRef.current = false;
        }}
        className="fixed z-10 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd97d] disabled:pointer-events-none cursor-pointer"
      >
        <span className="sr-only">GIRAR</span>
      </button>
    </>
  );
}
