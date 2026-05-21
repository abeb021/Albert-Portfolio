import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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

function randomCenters(halfW: number, halfH: number): [number, number, number][] {
  // Right side only: x in [10%, 85%] of visible half-width (positive = right)
  const xMin =  halfW * 0.1;
  const xMax =  halfW * 0.85;
  const yMax =  halfH * 0.88;
  const centers: [number, number, number][] = [];
  let attempts = 0;
  while (centers.length < AS_COUNT && attempts < 2000) {
    attempts++;
    const x = xMin + Math.random() * (xMax - xMin);
    const y = (Math.random() - 0.5) * 2 * yMax;
    const z = (Math.random() - 0.5) * 50;
    const ok = centers.every(([ex, ey]) => Math.sqrt((x - ex) ** 2 + (y - ey) ** 2) >= MIN_SEP);
    if (ok) centers.push([x, y, z]);
  }
  while (centers.length < AS_COUNT)
    centers.push([xMin + Math.random() * (xMax - xMin), (Math.random() - 0.5) * 2 * yMax, 0]);
  return centers;
}

export function useBGPTopology(
  containerRef: React.RefObject<HTMLDivElement | null>,
  accentColor: string,
) {
  const lineMatRef = useRef<THREE.LineBasicMaterial | null>(null);
  const gwMatRef   = useRef<THREE.PointsMaterial   | null>(null);

  // Sync accent into Three.js materials without rebuilding scene
  useEffect(() => {
    if (lineMatRef.current) lineMatRef.current.color.setStyle(accentColor);
    if (gwMatRef.current)   gwMatRef.current.color.setStyle(accentColor);
  }, [accentColor]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Node positions
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

    // Gateway nodes (accent colored, larger)
    const isGateway  = new Uint8Array(C);
    const gwPosBuf   = new Float32Array(AS_COUNT * AS_COUNT * MAX_GW * 2 * 3);
    const gwGeom     = new THREE.BufferGeometry();
    const gwPosAttr  = new THREE.BufferAttribute(gwPosBuf, 3);
    gwPosAttr.setUsage(THREE.DynamicDrawUsage);
    gwGeom.setAttribute('position', gwPosAttr);
    const gwMat = new THREE.PointsMaterial({ color: accentColor, size: 6.5, transparent: true, opacity: 1.0 });
    gwMatRef.current = gwMat;
    scene.add(new THREE.Points(gwGeom, gwMat));

    // Intra-cluster lines (white)
    const intraPosArr  = new Float32Array(MAX_INTRA * 6);
    const intraGeom    = new THREE.BufferGeometry();
    const intraPosAttr = new THREE.BufferAttribute(intraPosArr, 3);
    intraPosAttr.setUsage(THREE.DynamicDrawUsage);
    intraGeom.setAttribute('position', intraPosAttr);
    scene.add(new THREE.LineSegments(intraGeom,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })));

    // Inter-cluster BGP lines (accent)
    const interPosArr  = new Float32Array(MAX_INTER * 6);
    const interGeom    = new THREE.BufferGeometry();
    const interPosAttr = new THREE.BufferAttribute(interPosArr, 3);
    interPosAttr.setUsage(THREE.DynamicDrawUsage);
    interGeom.setAttribute('position', interPosAttr);
    const interMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.9 });
    lineMatRef.current = interMat;
    scene.add(new THREE.LineSegments(interGeom, interMat));

    // Pre-allocated candidate buffers — reused every frame, no GC
    const candD = new Float32Array(NPC * NPC);
    const candI = new Uint16Array(NPC * NPC);
    const candJ = new Uint16Array(NPC * NPC);

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

      // Mouse world position
      mouseNDC.set((mouse.x / window.innerWidth) * 2 - 1, (mouse.y / window.innerHeight) * -2 + 1);
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(mousePlane, mouseWorld);

      // Physics: spring + mouse repulsion
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

      // Inter-cluster BGP: MAX_GW nearest pairs per AS-pair
      let xi = 0;
      isGateway.fill(0);
      for (let ca = 0; ca < AS_COUNT; ca++) {
        for (let cb = ca + 1; cb < AS_COUNT; cb++) {
          let nc = 0;
          for (let na = 0; na < NPC; na++) {
            for (let nb = 0; nb < NPC; nb++) {
              const i = ca*NPC + na, j = cb*NPC + nb;
              const dx = currPos[i*3] - currPos[j*3];
              const dy = currPos[i*3+1] - currPos[j*3+1];
              const dz = currPos[i*3+2] - currPos[j*3+2];
              const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
              if (d < INTER_DIST) { candD[nc] = d; candI[nc] = i; candJ[nc] = j; nc++; }
            }
          }
          const keep = Math.min(MAX_GW, nc);
          for (let k = 0; k < keep; k++) {
            let minK = k;
            for (let m = k + 1; m < nc; m++) if (candD[m] < candD[minK]) minK = m;
            let td = candD[k]; candD[k] = candD[minK]; candD[minK] = td;
            let ti = candI[k]; candI[k] = candI[minK]; candI[minK] = ti;
            let tj = candJ[k]; candJ[k] = candJ[minK]; candJ[minK] = tj;
            const i = candI[k], j = candJ[k];
            if (xi + 6 <= interPosArr.length) {
              interPosArr[xi++] = currPos[i*3];   interPosArr[xi++] = currPos[i*3+1]; interPosArr[xi++] = currPos[i*3+2];
              interPosArr[xi++] = currPos[j*3];   interPosArr[xi++] = currPos[j*3+1]; interPosArr[xi++] = currPos[j*3+2];
              isGateway[i] = 1; isGateway[j] = 1;
            }
          }
        }
      }
      interGeom.setDrawRange(0, xi / 3);
      interPosAttr.needsUpdate = true;

      // Gateway node positions
      let gi = 0;
      for (let i = 0; i < C; i++) {
        if (!isGateway[i]) continue;
        gwPosBuf[gi++] = currPos[i*3]; gwPosBuf[gi++] = currPos[i*3+1]; gwPosBuf[gi++] = currPos[i*3+2];
      }
      gwGeom.setDrawRange(0, gi / 3);
      gwPosAttr.needsUpdate = true;

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
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);
}
