import React, { useEffect, useRef } from 'react';
import './style.css';
import * as THREE from 'three';
import StackIcon from "tech-stack-icons";
import { personalInfo, about, education, techStack, contact, navLinks, animationSettings } from './config';

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const hasTyped = useRef(false);
  
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
            <div className="stack-category">
              <h3>Web Development</h3>
              <div className="stack-icons">
                {techStack.webDevelopment.map((tech) => (
                  <div key={tech.name} className="stack-icon-item">
                    <StackIcon name={tech.icon} style={{ width: 64, height: 64 }} />
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="stack-category">
              <h3>Programming Languages</h3>
              <div className="stack-icons">
                {techStack.programmingLanguages.map((tech) => (
                  <div key={tech.name} className="stack-icon-item">
                    <StackIcon name={tech.icon} style={{ width: 64, height: 64 }} />
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="stack-category">
              <h3>Tools & Platforms</h3>
              <div className="stack-icons">
                {techStack.toolsAndPlatforms.map((tech) => (
                  <div key={tech.name} className="stack-icon-item">
                    <StackIcon name={tech.icon} style={{ width: 64, height: 64 }} />
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="stack-category">
              <h3>Operating Systems & Shells</h3>
              <div className="stack-icons">
                {techStack.operatingSystems.map((tech) => (
                  <div key={tech.name} className="stack-icon-item">
                    <StackIcon name={tech.icon} style={{ width: 64, height: 64 }} />
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
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
