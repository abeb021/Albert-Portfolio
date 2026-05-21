import React, { useEffect, useRef, useState } from 'react';
import './style.css';
import * as THREE from 'three';
import StackIcon from "tech-stack-icons";
import {
  personalInfo, about, education, techStack,
  projects, contact, navLinks, animationSettings,
} from './config';

const supportedStackIcons = new Set([
  'go', 'python', 'c++', 'java', 'grpc', 'apachekafka',
  'postgresql', 'redis', 'mongodb', 'docker', 'githubactions',
  'linux', 'git', 'bash', 'jwt',
]);

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial | null>(null);
  const hasTyped = useRef(false);
  const hasTypedShell = useRef(false);
  const [showArchLine, setShowArchLine] = useState(false);
  const [accentColor, setAccentColor] = useState('#C5F037');

  const ACCENTS = ['#C5F037', '#00E5FF', '#FF8C42', '#FF3B52', '#B668FF', '#FFD100'];

  const gwMatRef = useRef<THREE.PointsMaterial | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor);
    if (lineMatRef.current) lineMatRef.current.color.setStyle(accentColor);
    if (gwMatRef.current)   gwMatRef.current.color.setStyle(accentColor);
  }, [accentColor]);

  // BGP/AS topology: 5 autonomous systems with intra-cluster mesh (white)
  // and inter-cluster peering lines (accent). Mouse repels nodes.
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── BACKGROUND: dim rotating dust ──
    const BG = 3500;
    const bgVerts = new Float32Array(BG * 3);
    for (let i = 0; i < BG * 3; i++) bgVerts[i] = (Math.random() - 0.5) * 2000;
    const bgGeom = new THREE.BufferGeometry();
    bgGeom.setAttribute('position', new THREE.Float32BufferAttribute(bgVerts, 3));
    const bgMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, transparent: true, opacity: 0.0 });
    const bgParticles = new THREE.Points(bgGeom, bgMat);
    scene.add(bgParticles); // kept for rotation ref, invisible

    // ── AS TOPOLOGY — random placement ──
    const AS_COUNT  = 5;
    const MIN_SEP   = 275;
    const AS_CENTERS: [number, number, number][] = [];
    let attempts = 0;
    while (AS_CENTERS.length < AS_COUNT && attempts < 2000) {
      attempts++;
      const x = (Math.random() - 0.5) * 820;
      const y = (Math.random() - 0.5) * 460;
      const z = (Math.random() - 0.5) * 50;
      let ok = true;
      for (const [ex, ey] of AS_CENTERS) {
        if (Math.sqrt((x - ex) ** 2 + (y - ey) ** 2) < MIN_SEP) { ok = false; break; }
      }
      if (ok) AS_CENTERS.push([x, y, z]);
    }
    while (AS_CENTERS.length < AS_COUNT)
      AS_CENTERS.push([(Math.random() - 0.5) * 820, (Math.random() - 0.5) * 460, 0]);
    const NPC              = 10;
    const C                = AS_COUNT * NPC;
    const CLUSTER_R        = 100;
    const INTRA_DIST       = 140;
    const INTER_DIST       = 400;
    const MAX_GATEWAYS     = 3;
    const SPRING_K   = 0.038;
    const DAMPING    = 0.84;
    const MOUSE_RAD  = 220;
    const REPEL      = 3200;

    const origPos    = new Float32Array(C * 3);
    const currPos    = new Float32Array(C * 3);
    const vel        = new Float32Array(C * 3);
    const nodeAS     = new Uint8Array(C);

    for (let ci = 0; ci < AS_COUNT; ci++) {
      const [cx, cy, cz] = AS_CENTERS[ci];
      for (let ni = 0; ni < NPC; ni++) {
        const i = ci * NPC + ni;
        nodeAS[i] = ci;
        // uniform sphere distribution
        const r     = CLUSTER_R * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        origPos[i*3]   = currPos[i*3]   = cx + r * Math.sin(phi) * Math.cos(theta);
        origPos[i*3+1] = currPos[i*3+1] = cy + r * Math.sin(phi) * Math.sin(theta);
        origPos[i*3+2] = currPos[i*3+2] = cz + r * Math.cos(phi) * 0.22;
      }
    }

    // Node points
    const nodeGeom    = new THREE.BufferGeometry();
    const nodePosAttr = new THREE.BufferAttribute(currPos, 3);
    nodePosAttr.setUsage(THREE.DynamicDrawUsage);
    nodeGeom.setAttribute('position', nodePosAttr);
    const nodeMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, transparent: true, opacity: 1.0 });
    scene.add(new THREE.Points(nodeGeom, nodeMat));

    // Gateway nodes — larger, accent colored, separate geometry
    const isGateway    = new Uint8Array(C);
    const gwPosBuf     = new Float32Array(AS_COUNT * AS_COUNT * MAX_GATEWAYS * 2 * 3);
    const gwGeom       = new THREE.BufferGeometry();
    const gwPosAttr    = new THREE.BufferAttribute(gwPosBuf, 3);
    gwPosAttr.setUsage(THREE.DynamicDrawUsage);
    gwGeom.setAttribute('position', gwPosAttr);
    const gwMat = new THREE.PointsMaterial({ color: accentColor, size: 6.5, transparent: true, opacity: 1.0 });
    gwMatRef.current = gwMat;
    scene.add(new THREE.Points(gwGeom, gwMat));

    // Intra-cluster lines (white, dim)
    const MAX_INTRA   = 8000;
    const intraPosArr = new Float32Array(MAX_INTRA * 6);
    const intraGeom   = new THREE.BufferGeometry();
    const intraPosAttr = new THREE.BufferAttribute(intraPosArr, 3);
    intraPosAttr.setUsage(THREE.DynamicDrawUsage);
    intraGeom.setAttribute('position', intraPosAttr);
    const intraMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    scene.add(new THREE.LineSegments(intraGeom, intraMat));

    // Inter-cluster (BGP peering) lines — accent color
    const MAX_INTER   = 1500;
    const interPosArr = new Float32Array(MAX_INTER * 6);
    const interGeom   = new THREE.BufferGeometry();
    const interPosAttr = new THREE.BufferAttribute(interPosArr, 3);
    interPosAttr.setUsage(THREE.DynamicDrawUsage);
    interGeom.setAttribute('position', interPosAttr);
    const interMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.9 });
    lineMatRef.current = interMat;
    scene.add(new THREE.LineSegments(interGeom, interMat));

    // Mouse
    const mouse      = { x: 99999, y: 99999 };
    const mouseNDC   = new THREE.Vector2();
    const raycaster  = new THREE.Raycaster();
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorld = new THREE.Vector3();
    function onMouseMove(e: MouseEvent) { mouse.x = e.clientX; mouse.y = e.clientY; }
    window.addEventListener('mousemove', onMouseMove);

    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);

      bgParticles.rotation.x += 0.00022;
      bgParticles.rotation.y += 0.00022;

      mouseNDC.set(
        (mouse.x / window.innerWidth)  *  2 - 1,
        (mouse.y / window.innerHeight) * -2 + 1,
      );
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

      // Inter-cluster BGP: K nearest pairs per AS-pair
      let xi = 0;
      isGateway.fill(0);
      const candD = new Float32Array(NPC * NPC);
      const candI = new Uint16Array(NPC * NPC);
      const candJ = new Uint16Array(NPC * NPC);
      for (let ca = 0; ca < AS_COUNT; ca++) {
        for (let cb = ca + 1; cb < AS_COUNT; cb++) {
          let nc = 0;
          for (let na = 0; na < NPC; na++) {
            for (let nb = 0; nb < NPC; nb++) {
              const i = ca * NPC + na, j = cb * NPC + nb;
              const dx = currPos[i*3] - currPos[j*3];
              const dy = currPos[i*3+1] - currPos[j*3+1];
              const dz = currPos[i*3+2] - currPos[j*3+2];
              const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
              if (d < INTER_DIST) { candD[nc] = d; candI[nc] = i; candJ[nc] = j; nc++; }
            }
          }
          // Partial selection sort — keep MAX_GATEWAYS shortest
          const keep = Math.min(MAX_GATEWAYS, nc);
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

      // Update gateway node positions
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

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
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

  // Typewriter — tagline
  useEffect(() => {
    if (hasTyped.current) return;
    hasTyped.current = true;
    const el = document.querySelector('.tagline');
    if (!el) return;
    const text = personalInfo.tagline;
    el.textContent = '';
    el.classList.add('typing');
    let i = 0;
    function type() {
      if (i < text.length && el) {
        el.textContent += text.charAt(i++);
        setTimeout(type, animationSettings.typewriterSpeed);
      }
    }
    type();
  }, []);

  // Fade-in on load
  useEffect(() => {
    setTimeout(() => {
      document.querySelector('.header')?.classList.add('visible');
      document.querySelectorAll('section').forEach((s, idx) => {
        setTimeout(() => s.classList.add('visible'), animationSettings.sectionDelayStep * (idx + 1));
      });
      document.querySelector('.footer')?.classList.add('visible');
    }, animationSettings.fadeDelay);
  }, []);

  // Typewriter — shell commands
  useEffect(() => {
    if (hasTypedShell.current) return;
    hasTypedShell.current = true;

    const line2 = document.querySelector('.shell-line-2') as HTMLElement | null;
    const line3 = document.querySelector('.shell-line-3') as HTMLElement | null;
    const line4 = document.querySelector('.shell-line-4') as HTMLElement | null;
    const line5 = document.querySelector('.shell-line-5') as HTMLElement | null;
    const cmd1  = document.querySelector('.typed-cmd-1');
    const cmd2  = document.querySelector('.typed-cmd-2');
    if (!cmd1 || !cmd2 || !line2 || !line3 || !line4 || !line5) return;

    const commandOne = 'whoami';
    const commandTwo = 'stack --focus';
    cmd1.textContent = '';
    cmd2.textContent = '';
    line2.style.display = 'none';
    line3.style.display = 'none';
    line4.style.display = 'none';
    line5.style.display = 'none';

    let i = 0;
    let j = 0;

    const typeFirst = () => {
      if (i < commandOne.length) {
        cmd1.textContent += commandOne.charAt(i++);
        setTimeout(typeFirst, 110);
      } else {
        setTimeout(() => {
          line2.style.display = 'block';
          line3.style.display = 'block';
          cmd1.classList.remove('typing-cursor');
          cmd2.classList.add('typing-cursor');
          typeSecond();
        }, 220);
      }
    };

    const typeSecond = () => {
      if (j < commandTwo.length) {
        line4.style.display = 'block';
        cmd2.textContent += commandTwo.charAt(j++);
        setTimeout(typeSecond, 110);
      } else {
        setTimeout(() => {
          cmd2.classList.remove('typing-cursor');
          line5.style.display = 'block';
        }, 220);
      }
    };

    cmd1.classList.add('typing-cursor');
    setTimeout(typeFirst, 350);
  }, []);

  const categoryDescriptions: Record<string, string> = {
    languages:    'Primary and supporting languages for backend development.',
    backend:      'APIs, communication patterns, and service architecture.',
    databases:    'Storage engines for transactional and cache-driven workloads.',
    devopsAndTools: 'Containerization, automation, and daily dev environment.',
  };

  return (
    <>
      <div id="canvas-container" ref={canvasRef}></div>

      <nav className="navbar">
        <ul className="nav-list">
          {navLinks.slice(0, -1).map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
          <li className="nav-swatches">
            {ACCENTS.map((c) => (
              <button
                key={c}
                className={`accent-swatch${accentColor === c ? ' active' : ''}`}
                style={{ background: c }}
                onClick={() => setAccentColor(c)}
                aria-label={`Accent ${c}`}
              />
            ))}
          </li>
          <li key={navLinks[navLinks.length - 1].href}>
            <a href={navLinks[navLinks.length - 1].href}>
              {navLinks[navLinks.length - 1].label}
            </a>
          </li>
        </ul>
      </nav>

      <div className="app-container">
        <header className="header">
          <div className="header-content">
            <div className="hero-left">
              <h1 className="name-title">{personalInfo.name}</h1>
              <p className="tagline">{personalInfo.tagline}</p>
            </div>

            <div className="prompt-window" aria-label="command prompt">
              <div className="prompt-title">
                <img
                  src="/archlinux-logo.svg"
                  alt="Arch Linux"
                  className="prompt-arch-logo"
                  onMouseEnter={() => setShowArchLine(true)}
                  onMouseLeave={() => setShowArchLine(false)}
                />
                <span className={`prompt-title-text ${showArchLine ? 'is-hidden' : 'is-visible'}`}>zsh • backend</span>
                <span className={`prompt-title-text prompt-title-arch ${showArchLine ? 'is-visible' : 'is-hidden'}`}>i use Arch btw</span>
              </div>
              <pre className="prompt-body">
                <code>
                  <span className="shell-line shell-line-1"><span className="prompt-user">abeb</span> <span className="prompt-path">~/portfolio</span></span>
                  <span className="shell-line shell-line-1"><span className="prompt-sign">❯</span> <span className="typed-cmd-1"></span></span>
                  <span className="shell-line shell-line-2"><span className="prompt-output">backend developer</span></span>
                  <span className="shell-line shell-line-3"><span className="prompt-user">abeb</span> <span className="prompt-path">~/portfolio</span></span>
                  <span className="shell-line shell-line-4"><span className="prompt-sign">❯</span> <span className="typed-cmd-2"></span></span>
                  <span className="shell-line shell-line-5"><span className="prompt-tech">go</span> <span className="prompt-tech">kafka</span> <span className="prompt-tech">postgresql</span></span>
                </code>
              </pre>
            </div>
          </div>
        </header>

        <main>
          <section id="about" className="about-section">
            <h2>About</h2>
            <div className="about-text">
              {about.description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section id="stack" className="stack-section">
            <h2>Stack</h2>
            <div className="stack-grid">
              {Object.entries(techStack).map(([category, items]) => (
                <div className="stack-category" key={category}>
                  <h3>{category.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</h3>
                  <p className="stack-category-description">{categoryDescriptions[category] ?? ''}</p>
                  <div className="stack-icons">
                    {items.map((tech) => (
                      <div key={tech.name} className="stack-icon-item">
                        {tech.customIcon ? (
                          <img src={tech.customIcon} alt={tech.name} width={44} height={44} />
                        ) : supportedStackIcons.has(tech.icon) ? (
                          <StackIcon name={tech.icon} style={{ width: 44, height: 44 }} />
                        ) : (
                          <div className="stack-icon-fallback">{tech.name.slice(0, 3).toUpperCase()}</div>
                        )}
                        <span>{tech.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="projects" className="projects-section">
            <h2>Projects</h2>
            {projects.length === 0 ? (
              <div className="projects-empty">
                <p>No projects yet. Add them in <code>src/config.ts</code> → <code>projects</code> array.</p>
                <p style={{ marginTop: '12px', opacity: 0.5 }}>Each entry takes <code>title</code>, <code>description</code>, <code>stack</code>, <code>url</code>, and an optional <code>image</code>.</p>
              </div>
            ) : (
              <div className="projects-list">
                {projects.map((project) => (
                  <a
                    key={project.title}
                    href={project.url}
                    className={`project-card${project.image ? ' has-image' : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="project-image-wrap">
                      {project.image ? (
                        <img src={project.image} alt={project.title} className="project-image" />
                      ) : (
                        'no preview'
                      )}
                    </div>
                    <div className="project-body">
                      <div className="project-header">
                        <div className="project-title">{project.title}</div>
                        <div className="project-arrow">↗</div>
                      </div>
                      <p className="project-description">{project.description}</p>
                      <div className="project-stack">
                        {project.stack.map((tech) => (
                          <span key={tech} className="project-stack-tag">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section id="education" className="education-section">
            <h2>Education</h2>
            <div className="education-card">
              <div className="university-logo">
                <div className="logo-3d">{education.logoInitials}</div>
              </div>
              <div className="education-details">
                <h3>{education.university}</h3>
                <p className="education-program">{education.program}</p>
                <p>{education.description}</p>
              </div>
            </div>
          </section>

          <section id="contact" className="contact-section">
            <h2>Connect</h2>
            <div className="contact-methods">
              {contact.map((item) => (
                <a
                  key={item.platform}
                  href={item.url}
                  className="contact-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="contact-icon">
                    {item.iconType === 'image' ? (
                      <img src={item.iconSrc} alt={item.platform} />
                    ) : (
                      <StackIcon name={item.iconName!} />
                    )}
                  </div>
                  <div className="contact-info">
                    <h3>{item.platform}</h3>
                    <p className="contact-value">{item.username}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </main>

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} · {personalInfo.footerName}</p>
        </footer>
      </div>
    </>
  );
}

export default App;
