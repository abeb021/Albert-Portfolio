import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Topology constants ──
const AS_COUNT   = 5;
const MIN_SEP    = 275;
const NPC        = 10;
const C          = AS_COUNT * NPC;
const CLUSTER_R  = 100;
const INTRA_DIST = 140;
const INTER_DIST = 400;
const MAX_GW     = 3;
const SPRING_K   = 0.038;
const DAMPING    = 0.84;
const MOUSE_RAD  = 220;
const REPEL      = 3200;
const MAX_INTRA  = 8000;
const MAX_INTER  = 1500;

// ── Signal constants ──
const MAX_SIG    = 4;
const SIG_SPEED  = 0.007;
const BREAK_DISP = 25;   // world-unit displacement to trigger break
const X_SIZE     = 11;   // half-arm length of X mark
const X_BLINK_MS = 360;
const X_LIFE_MS  = 2600;

function randomCenters(halfW: number, halfH: number): [number, number, number][] {
  const portrait = halfW < halfH;
  const xMin =  portrait ? -halfW * 0.8 : halfW * 0.1;
  const xMax =  portrait ?  halfW * 0.8 : halfW * 0.85;
  // y: header occupies roughly top 40% of screen (positive y in Three.js = up)
  const yTop =  halfH * 0.75;  // stay below this — just under header
  const yBot = -halfH * 0.88;
  const sep  = Math.min(MIN_SEP, ((xMax - xMin) * 0.9) / Math.ceil(Math.sqrt(AS_COUNT)));
  const centers: [number, number, number][] = [];
  let attempts = 0;
  while (centers.length < AS_COUNT && attempts < 2000) {
    attempts++;
    const x = xMin + Math.random() * (xMax - xMin);
    const y = yBot  + Math.random() * (yTop - yBot);
    const z = (Math.random() - 0.5) * 50;
    const ok = centers.every(([ex, ey]) => Math.sqrt((x - ex) ** 2 + (y - ey) ** 2) >= sep);
    if (ok) centers.push([x, y, z]);
  }
  while (centers.length < AS_COUNT)
    centers.push([
      xMin + Math.random() * (xMax - xMin),
      yBot + Math.random() * (yTop - yBot),
      0,
    ]);
  return centers;
}

export function useBGPTopology(
  containerRef: React.RefObject<HTMLDivElement | null>,
  accentColor: string,
) {
  const lineMatRef = useRef<THREE.LineBasicMaterial | null>(null);
  const gwMatRef   = useRef<THREE.PointsMaterial   | null>(null);
  const sigMatRef  = useRef<THREE.PointsMaterial   | null>(null);
  const xMatRef    = useRef<THREE.LineBasicMaterial | null>(null);
  const hlMatRef   = useRef<THREE.LineBasicMaterial | null>(null);

  useEffect(() => {
    if (lineMatRef.current) lineMatRef.current.color.setStyle(accentColor);
    if (gwMatRef.current)   gwMatRef.current.color.setStyle(accentColor);
    if (xMatRef.current)    xMatRef.current.color.setStyle(accentColor);
    if (hlMatRef.current)   hlMatRef.current.color.setStyle(accentColor);
    // sigMat stays white — intentionally not accent-colored
  }, [accentColor]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Node data ──
    const origPos = new Float32Array(C * 3);
    const currPos = new Float32Array(C * 3);
    const vel     = new Float32Array(C * 3);
    const nodeAS  = new Uint8Array(C);

    const halfH   = Math.tan((75 / 2) * Math.PI / 180) * 500;
    const halfW   = halfH * (window.innerWidth / window.innerHeight);
    const centers = randomCenters(halfW, halfH);
    for (let ci = 0; ci < centers.length; ci++) {
      const [cx, cy, cz] = centers[ci];
      for (let ni = 0; ni < NPC; ni++) {
        const i     = ci * NPC + ni;
        nodeAS[i]   = ci;
        const r     = CLUSTER_R * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        origPos[i*3]   = currPos[i*3]   = cx + r * Math.sin(phi) * Math.cos(theta);
        origPos[i*3+1] = currPos[i*3+1] = cy + r * Math.sin(phi) * Math.sin(theta);
        origPos[i*3+2] = currPos[i*3+2] = cz + r * Math.cos(phi) * 0.22;
      }
    }

    // Regular nodes
    const nodeGeom    = new THREE.BufferGeometry();
    const nodePosAttr = new THREE.BufferAttribute(currPos, 3);
    nodePosAttr.setUsage(THREE.DynamicDrawUsage);
    nodeGeom.setAttribute('position', nodePosAttr);
    scene.add(new THREE.Points(nodeGeom,
      new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, transparent: true, opacity: 1.0 })));

    // Gateway nodes
    const isGateway  = new Uint8Array(C);
    const gwPosBuf   = new Float32Array(AS_COUNT * AS_COUNT * MAX_GW * 2 * 3);
    const gwGeom     = new THREE.BufferGeometry();
    const gwPosAttr  = new THREE.BufferAttribute(gwPosBuf, 3);
    gwPosAttr.setUsage(THREE.DynamicDrawUsage);
    gwGeom.setAttribute('position', gwPosAttr);
    const gwMat = new THREE.PointsMaterial({ color: accentColor, size: 6.5, transparent: true, opacity: 1.0 });
    gwMatRef.current = gwMat;
    scene.add(new THREE.Points(gwGeom, gwMat));

    // Intra-cluster lines
    const intraPosArr  = new Float32Array(MAX_INTRA * 6);
    const intraGeom    = new THREE.BufferGeometry();
    const intraPosAttr = new THREE.BufferAttribute(intraPosArr, 3);
    intraPosAttr.setUsage(THREE.DynamicDrawUsage);
    intraGeom.setAttribute('position', intraPosAttr);
    scene.add(new THREE.LineSegments(intraGeom,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })));

    // Inter-cluster BGP lines
    const interPosArr  = new Float32Array(MAX_INTER * 6);
    const interGeom    = new THREE.BufferGeometry();
    const interPosAttr = new THREE.BufferAttribute(interPosArr, 3);
    interPosAttr.setUsage(THREE.DynamicDrawUsage);
    interGeom.setAttribute('position', interPosAttr);
    const interMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.9 });
    lineMatRef.current = interMat;
    scene.add(new THREE.LineSegments(interGeom, interMat));

    // Candidate buffers for BGP (reused each frame)
    const candD = new Float32Array(NPC * NPC);
    const candI = new Uint16Array(NPC * NPC);
    const candJ = new Uint16Array(NPC * NPC);

    // Lookup: gwPairMap[i*C+j] = 1 means BGP edge i↔j is drawn this frame
    const gwPairMap = new Uint8Array(C * C);

    // ── Highlighted edge under traveling signal ──
    const hlPosBuf = new Float32Array(MAX_SIG * 2 * 3);
    const hlGeom   = new THREE.BufferGeometry();
    const hlPA     = new THREE.BufferAttribute(hlPosBuf, 3);
    hlPA.setUsage(THREE.DynamicDrawUsage);
    hlGeom.setAttribute('position', hlPA);
    const hlMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.55 });
    hlMatRef.current = hlMat;
    scene.add(new THREE.LineSegments(hlGeom, hlMat));

    // ── Signal dots (white, larger than regular nodes) ──
    const sigPosBuf = new Float32Array(MAX_SIG * 3);
    const sigGeom   = new THREE.BufferGeometry();
    const sigPA     = new THREE.BufferAttribute(sigPosBuf, 3);
    sigPA.setUsage(THREE.DynamicDrawUsage);
    sigGeom.setAttribute('position', sigPA);
    const sigMat = new THREE.PointsMaterial({ color: 0xffffff, size: 8.0, transparent: true, opacity: 1.0 });
    sigMatRef.current = sigMat;
    scene.add(new THREE.Points(sigGeom, sigMat));

    // ── X marks: 4 vertices each (2 crossed lines) ──
    const xPosBuf = new Float32Array(MAX_SIG * 4 * 3);
    const xGeom   = new THREE.BufferGeometry();
    const xPA     = new THREE.BufferAttribute(xPosBuf, 3);
    xPA.setUsage(THREE.DynamicDrawUsage);
    xGeom.setAttribute('position', xPA);
    const xMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.0 });
    xMatRef.current = xMat;
    scene.add(new THREE.LineSegments(xGeom, xMat));

    // ── Signal state pool ──
    type Sig = {
      from: number; to: number; progress: number;
      alive: boolean; broken: boolean;
      bx: number; by: number; bz: number; brokenAt: number;
    };
    const sigs: Sig[] = Array.from({ length: MAX_SIG }, () => ({
      from: 0, to: 0, progress: 0,
      alive: false, broken: false,
      bx: 0, by: 0, bz: 0, brokenAt: 0,
    }));

    function nodeDisplaced(i: number): boolean {
      const dx = currPos[i*3]   - origPos[i*3];
      const dy = currPos[i*3+1] - origPos[i*3+1];
      const dz = currPos[i*3+2] - origPos[i*3+2];
      return dx*dx + dy*dy + dz*dz > BREAK_DISP * BREAK_DISP;
    }

    function pickNext(from: number): number | null {
      const fa    = nodeAS[from];
      const intra: number[] = [];
      const inter: number[] = [];
      for (let j = 0; j < C; j++) {
        if (j === from) continue;
        if (nodeAS[j] === fa) {
          // Intra: only edges that pass the INTRA_DIST check (same as drawn lines)
          const dx = currPos[from*3]   - currPos[j*3];
          const dy = currPos[from*3+1] - currPos[j*3+1];
          const dz = currPos[from*3+2] - currPos[j*3+2];
          if (dx*dx + dy*dy + dz*dz < INTRA_DIST * INTRA_DIST) intra.push(j);
        } else {
          // Inter: ONLY if this pair is a drawn BGP edge this frame
          if (gwPairMap[from*C + j]) inter.push(j);
        }
      }
      if (inter.length > 0 && Math.random() < 0.2)
        return inter[Math.floor(Math.random() * inter.length)];
      if (intra.length > 0)
        return intra[Math.floor(Math.random() * intra.length)];
      return inter.length > 0 ? inter[Math.floor(Math.random() * inter.length)] : null;
    }

    function spawnSig(sig: Sig, offsetProgress = 0) {
      // Force intra-cluster start to avoid initial flying across screen
      const startAS = Math.floor(Math.random() * AS_COUNT);
      const asNodes = Array.from({ length: NPC }, (_, ni) => startAS * NPC + ni);
      // Shuffle and find a node that has intra neighbors
      for (let attempt = 0; attempt < NPC; attempt++) {
        const idx   = Math.floor(Math.random() * asNodes.length);
        const from  = asNodes[idx];
        const intra: number[] = [];
        for (let j = 0; j < NPC; j++) {
          const jj = startAS * NPC + j;
          if (jj === from) continue;
          const dx = currPos[from*3]   - currPos[jj*3];
          const dy = currPos[from*3+1] - currPos[jj*3+1];
          const dz = currPos[from*3+2] - currPos[jj*3+2];
          if (Math.sqrt(dx*dx + dy*dy + dz*dz) < INTRA_DIST) intra.push(jj);
        }
        if (intra.length > 0) {
          sig.from     = from;
          sig.to       = intra[Math.floor(Math.random() * intra.length)];
          sig.progress = offsetProgress;
          sig.alive    = true;
          sig.broken   = false;
          return;
        }
      }
      sig.alive = false;
    }

    // Stagger initial spawns
    for (let s = 0; s < MAX_SIG; s++) spawnSig(sigs[s], s / MAX_SIG);

    // Mouse
    const mouse      = { x: 99999, y: 99999 };
    const mouseNDC   = new THREE.Vector2();
    const raycaster  = new THREE.Raycaster();
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorld = new THREE.Vector3();
    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);

    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);

      // Mouse world coords
      mouseNDC.set((mouse.x / window.innerWidth) * 2 - 1, (mouse.y / window.innerHeight) * -2 + 1);
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(mousePlane, mouseWorld);

      // Physics
      for (let i = 0; i < C; i++) {
        const ix = i*3, iy = ix+1, iz = ix+2;
        vel[ix] += (origPos[ix] - currPos[ix]) * SPRING_K;
        vel[iy] += (origPos[iy] - currPos[iy]) * SPRING_K;
        vel[iz] += (origPos[iz] - currPos[iz]) * SPRING_K;
        const dx = currPos[ix] - mouseWorld.x;
        const dy = currPos[iy] - mouseWorld.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < MOUSE_RAD && d > 1) {
          const f = REPEL / (d * d);
          vel[ix] += (dx / d) * f;
          vel[iy] += (dy / d) * f;
        }
        vel[ix] *= DAMPING; vel[iy] *= DAMPING; vel[iz] *= DAMPING;
        currPos[ix] += vel[ix]; currPos[iy] += vel[iy]; currPos[iz] += vel[iz];
      }
      nodePosAttr.needsUpdate = true;

      // Intra-cluster mesh
      let ii = 0;
      for (let i = 0; i < C; i++) {
        for (let j = i + 1; j < C; j++) {
          if (nodeAS[i] !== nodeAS[j]) continue;
          const dx = currPos[i*3] - currPos[j*3];
          const dy = currPos[i*3+1] - currPos[j*3+1];
          const dz = currPos[i*3+2] - currPos[j*3+2];
          if (Math.sqrt(dx*dx + dy*dy + dz*dz) < INTRA_DIST && ii + 6 <= intraPosArr.length) {
            intraPosArr[ii++] = currPos[i*3];   intraPosArr[ii++] = currPos[i*3+1]; intraPosArr[ii++] = currPos[i*3+2];
            intraPosArr[ii++] = currPos[j*3];   intraPosArr[ii++] = currPos[j*3+1]; intraPosArr[ii++] = currPos[j*3+2];
          }
        }
      }
      intraGeom.setDrawRange(0, ii / 3);
      intraPosAttr.needsUpdate = true;

      // BGP inter-cluster lines + gateway tracking
      let xi = 0;
      isGateway.fill(0);
      gwPairMap.fill(0);
      for (let ca = 0; ca < AS_COUNT; ca++) {
        for (let cb = ca + 1; cb < AS_COUNT; cb++) {
          let nc = 0;
          for (let na = 0; na < NPC; na++) {
            for (let nb = 0; nb < NPC; nb++) {
              const i = ca*NPC+na, j = cb*NPC+nb;
              const dx = currPos[i*3]-currPos[j*3];
              const dy = currPos[i*3+1]-currPos[j*3+1];
              const dz = currPos[i*3+2]-currPos[j*3+2];
              const d  = Math.sqrt(dx*dx+dy*dy+dz*dz);
              if (d < INTER_DIST) { candD[nc]=d; candI[nc]=i; candJ[nc]=j; nc++; }
            }
          }
          const keep = Math.min(MAX_GW, nc);
          for (let k = 0; k < keep; k++) {
            let minK = k;
            for (let m = k+1; m < nc; m++) if (candD[m] < candD[minK]) minK = m;
            let td=candD[k]; candD[k]=candD[minK]; candD[minK]=td;
            let ti=candI[k]; candI[k]=candI[minK]; candI[minK]=ti;
            let tj=candJ[k]; candJ[k]=candJ[minK]; candJ[minK]=tj;
            const i=candI[k], j=candJ[k];
            if (xi+6 <= interPosArr.length) {
              interPosArr[xi++]=currPos[i*3]; interPosArr[xi++]=currPos[i*3+1]; interPosArr[xi++]=currPos[i*3+2];
              interPosArr[xi++]=currPos[j*3]; interPosArr[xi++]=currPos[j*3+1]; interPosArr[xi++]=currPos[j*3+2];
              isGateway[i]=1; isGateway[j]=1;
              gwPairMap[i*C+j]=1; gwPairMap[j*C+i]=1;
            }
          }
        }
      }
      interGeom.setDrawRange(0, xi/3);
      interPosAttr.needsUpdate = true;

      // Gateway positions
      let gi = 0;
      for (let i = 0; i < C; i++) {
        if (!isGateway[i]) continue;
        gwPosBuf[gi++]=currPos[i*3]; gwPosBuf[gi++]=currPos[i*3+1]; gwPosBuf[gi++]=currPos[i*3+2];
      }
      gwGeom.setDrawRange(0, gi/3);
      gwPosAttr.needsUpdate = true;

      // ── Signals ──
      const now   = Date.now();
      const blink = (now % (2 * X_BLINK_MS)) < X_BLINK_MS;
      let sc = 0, xc = 0, hc = 0;

      for (let s = 0; s < MAX_SIG; s++) {
        const sig = sigs[s];

        // Broken: show X, wait, then respawn
        if (sig.broken) {
          if (now - sig.brokenAt > X_LIFE_MS) {
            spawnSig(sig);
          } else {
            const base = xc * 12;
            const S = X_SIZE;
            xPosBuf[base+0]=sig.bx-S; xPosBuf[base+1]=sig.by+S; xPosBuf[base+2]=sig.bz;
            xPosBuf[base+3]=sig.bx+S; xPosBuf[base+4]=sig.by-S; xPosBuf[base+5]=sig.bz;
            xPosBuf[base+6]=sig.bx+S; xPosBuf[base+7]=sig.by+S; xPosBuf[base+8]=sig.bz;
            xPosBuf[base+9]=sig.bx-S; xPosBuf[base+10]=sig.by-S; xPosBuf[base+11]=sig.bz;
            xc++;
          }
          continue;
        }

        if (!sig.alive) continue;

        // Break if cursor displaced either endpoint
        if (nodeDisplaced(sig.from) || nodeDisplaced(sig.to)) {
          const t = sig.progress;
          sig.bx = currPos[sig.from*3]*(1-t)   + currPos[sig.to*3]*t;
          sig.by = currPos[sig.from*3+1]*(1-t) + currPos[sig.to*3+1]*t;
          sig.bz = currPos[sig.from*3+2]*(1-t) + currPos[sig.to*3+2]*t;
          sig.broken   = true;
          sig.brokenAt = now;
          continue;
        }

        // Advance
        sig.progress += SIG_SPEED;
        if (sig.progress >= 1.0) {
          sig.from     = sig.to;
          sig.progress = 0;
          const next   = pickNext(sig.from);
          if (next === null) { spawnSig(sig); continue; }
          sig.to       = next;
        }

        // Interpolated position
        const t = sig.progress;
        sigPosBuf[sc*3]   = currPos[sig.from*3]*(1-t)   + currPos[sig.to*3]*t;
        sigPosBuf[sc*3+1] = currPos[sig.from*3+1]*(1-t) + currPos[sig.to*3+1]*t;
        sigPosBuf[sc*3+2] = currPos[sig.from*3+2]*(1-t) + currPos[sig.to*3+2]*t;
        sc++;

        // Highlight the edge this signal is currently on
        hlPosBuf[hc*6]   = currPos[sig.from*3];   hlPosBuf[hc*6+1] = currPos[sig.from*3+1]; hlPosBuf[hc*6+2] = currPos[sig.from*3+2];
        hlPosBuf[hc*6+3] = currPos[sig.to*3];     hlPosBuf[hc*6+4] = currPos[sig.to*3+1];   hlPosBuf[hc*6+5] = currPos[sig.to*3+2];
        hc++;
      }

      sigGeom.setDrawRange(0, sc);
      sigPA.needsUpdate = true;
      hlGeom.setDrawRange(0, hc * 2);
      hlPA.needsUpdate = true;
      xGeom.setDrawRange(0, xc * 4);
      xPA.needsUpdate = true;
      xMat.opacity = blink && xc > 0 ? 0.95 : 0.0;

      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      lineMatRef.current = null;
      gwMatRef.current   = null;
      sigMatRef.current  = null;
      xMatRef.current    = null;
      hlMatRef.current   = null;
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);
}
