import React, { useEffect, useRef, useState } from 'react';
import './style.css';
import * as THREE from 'three';
import StackIcon from "tech-stack-icons";
import { personalInfo, about, education, techStack, contact, navLinks, animationSettings } from './config';

const supportedStackIcons = new Set([
  'go',
  'python',
  'c++',
  'java',
  'grpc',
  'apachekafka',
  'postgresql',
  'redis',
  'mongodb',
  'docker',
  'githubactions',
  'linux',
  'git',
  'bash',
  'jwt',
]);

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const hasTyped = useRef(false);
  const hasTypedShell = useRef(false);
  const [showArchLine, setShowArchLine] = useState(false);
  
  // 3D Animation logic
  useEffect(() => {
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let particles: THREE.Points;
    let animationId: number;
    const container = canvasRef.current;
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    for (let i = 0; i < animationSettings.particleCount; i++) {
      vertices.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );
    }
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: animationSettings.particleSize,
      transparent: true,
      opacity: 0.8,
    });
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    camera.position.z = animationSettings.cameraZ;

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize);

    function animate() {
      animationId = requestAnimationFrame(animate);
      particles.rotation.x += animationSettings.rotationSpeed;
      particles.rotation.y += animationSettings.rotationSpeed;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Typewriter effect for tagline
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

  // Fade-in animations
  useEffect(() => {
    setTimeout(() => {
      const header = document.querySelector('.header');
      if (header) header.classList.add('visible');
      document.querySelectorAll('section').forEach((section, idx) => {
        setTimeout(() => section.classList.add('visible'), animationSettings.sectionDelayStep * (idx + 1));
      });
      const footer = document.querySelector('.footer');
      if (footer) footer.classList.add('visible');
    }, animationSettings.fadeDelay);
  }, []);

  // Typewriter effect for shell commands
  useEffect(() => {
    if (hasTypedShell.current) return;
    hasTypedShell.current = true;

    const line2 = document.querySelector('.shell-line-2') as HTMLElement | null;
    const line3 = document.querySelector('.shell-line-3') as HTMLElement | null;
    const line4 = document.querySelector('.shell-line-4') as HTMLElement | null;
    const line5 = document.querySelector('.shell-line-5') as HTMLElement | null;
    const cmd1 = document.querySelector('.typed-cmd-1');
    const cmd2 = document.querySelector('.typed-cmd-2');
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

  return (
    <>
      <div id="canvas-container" ref={canvasRef}></div>
      <nav className="navbar">
        <ul className="nav-list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="app-container">
        <header className="header">
          <div className="header-content">
            <h1 className="name-title">
              {personalInfo.name}
            </h1>
            <p className="tagline">
              {personalInfo.tagline}
            </p>
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
                  <span className="shell-line shell-line-2"><span className="prompt-output">junior backend developer</span></span>
                  <span className="shell-line shell-line-3"><span className="prompt-user">abeb</span> <span className="prompt-path">~/portfolio</span></span>
                  <span className="shell-line shell-line-4"><span className="prompt-sign">❯</span> <span className="typed-cmd-2"></span></span>
                  <span className="shell-line shell-line-5"><span className="prompt-tech">go</span> <span className="prompt-tech">kafka</span> <span className="prompt-tech">postgresql</span> </span>
                </code>
              </pre>
            </div>
          </div>
        </header>
        <main>
          <section id="about" className="about-section glass-panel">
            <h2>About Me</h2>
            <div className="about-content">
              <div className="about-text">
                {about.description.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>
          <section id="stack" className="stack-section glass-panel">
            <h2>Stack</h2>
            <div className="stack-grid">
            {(() => {
              const categoryDescriptions: Record<string, string> = {
                languages: 'Primary and supporting languages used for backend development.',
                backend: 'APIs, communication patterns, and architecture for scalable services.',
                databases: 'Storage engines used for transactional and cache-driven workloads.',
                devopsAndTools: 'Containerization, automation, and daily developer environment.',
              };

              return Object.entries(techStack).map(([category, items]) => (
                <div className="stack-category" key={category}>
                  <h3>{category.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</h3>
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
              ));
            })()}
            </div>
          </section>
          <section id="education" className="education-section glass-panel">
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
          <section id="contact" className="contact-section glass-panel">
            <h2>Connect With Me</h2>
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
                      <img src={item.iconSrc} width="100%" alt={item.platform} />
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
          <p>
            &copy; {new Date().getFullYear()} {personalInfo.footerName} |
          </p>
        </footer>
      </div>
    </>
  );
}

export default App;
