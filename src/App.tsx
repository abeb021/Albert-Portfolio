import { useEffect, useRef, useState } from 'react';
import './style.css';
import StackIcon from 'tech-stack-icons';
import {
  personalInfo, about, education, techStack,
  projects, contact, navLinks, animationSettings,
} from './config';
import { useBGPTopology } from './hooks/useBGPTopology';

const supportedStackIcons = new Set([
  'go', 'python', 'c++', 'java', 'grpc', 'apachekafka',
  'postgresql', 'redis', 'mongodb', 'docker', 'githubactions',
  'linux', 'git', 'bash', 'jwt',
]);

const ACCENTS = ['#C5F037', '#00E5FF', '#FF8C42', '#FF3B52', '#B668FF', '#FFD100'];

const categoryDescriptions: Record<string, string> = {
  languages:      'Primary and supporting languages for backend development.',
  backend:        'APIs, communication patterns, and service architecture.',
  databases:      'Storage engines for transactional and cache-driven workloads.',
  devopsAndTools: 'Containerization, automation, and daily dev environment.',
};

function App() {
  const canvasRef       = useRef<HTMLDivElement>(null);
  const hasTyped        = useRef(false);
  const hasTypedShell   = useRef(false);
  const [showArchLine, setShowArchLine] = useState(false);
  const [accentColor, setAccentColor]   = useState(() => localStorage.getItem('accent') ?? '#C5F037');

  useBGPTopology(canvasRef, accentColor);

  // Sync CSS accent variable + persist
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor);
    localStorage.setItem('accent', accentColor);
  }, [accentColor]);

  // Tagline typewriter
  useEffect(() => {
    if (hasTyped.current) return;
    hasTyped.current = true;
    const el = document.querySelector('.tagline');
    if (!el) return;
    const text = personalInfo.tagline;
    el.textContent = '';
    el.classList.add('typing');
    let i = 0;
    const type = () => {
      if (i < text.length && el) {
        el.textContent += text.charAt(i++);
        setTimeout(type, animationSettings.typewriterSpeed);
      }
    };
    type();
  }, []);

  // Fade-in sections
  useEffect(() => {
    setTimeout(() => {
      document.querySelector('.header')?.classList.add('visible');
      document.querySelectorAll('section').forEach((s, idx) => {
        setTimeout(() => s.classList.add('visible'), animationSettings.sectionDelayStep * (idx + 1));
      });
      document.querySelector('.footer')?.classList.add('visible');
    }, animationSettings.fadeDelay);
  }, []);

  // Shell typewriter
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

    let i = 0, j = 0;

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
                <p style={{ marginTop: '12px', opacity: 0.5 }}>
                  Each entry takes <code>title</code>, <code>description</code>, <code>stack</code>, <code>url</code>, and an optional <code>image</code>.
                </p>
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
                      {project.image
                        ? <img src={project.image} alt={project.title} className="project-image" />
                        : 'no preview'}
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
                    {item.iconType === 'image'
                      ? <img src={item.iconSrc} alt={item.platform} />
                      : <StackIcon name={item.iconName} />}
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
