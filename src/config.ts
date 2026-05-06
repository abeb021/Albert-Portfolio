// Portfolio Configuration
// Edit this file to update your portfolio content

export const personalInfo = {
  name: "abeb",
  tagline: "CS Student @ Innopolis University",
  footerName: "abeb",
};

export const about = {
  description: [
    "Hello! I'm a student at Innopolis University, pursuing my passion for technology and innovation. Innopolis University is a leading institution specializing in IT education and research in Russia.",
    "My academic journey involves exploring various aspects of computer science, from software development to artificial intelligence and beyond.",
  ],
};

export const education = {
  university: "Innopolis University",
  program: "Computer Science Program",
  description: "Studying at one of Russia's most innovative technical universities, focusing on cutting-edge technology and computer science.",
  logoInitials: "IU",
};

export const techStack = {
  languages: [
    { name: "Go", icon: "go" },
    { name: "Python", icon: "python" },
    { name: "C++", icon: "c++" },
    { name: "Java", icon: "java" },
  ],
  backend: [
    { name: "REST API", icon: "api" },
    { name: "gRPC", icon: "grpc" },
    { name: "Microservices", icon: "microservices" },
    { name: "JWT", icon: "jwt" },
    { name: "Kafka", icon: "apachekafka" },
  ],
  databases: [
    { name: "PostgreSQL", icon: "postgresql" },
    { name: "Redis", icon: "redis" },
    { name: "MongoDB", icon: "mongodb" },
  ],
  devopsAndTools: [
    { name: "Docker", icon: "docker" },
    { name: "Docker Compose", icon: "docker" },
    { name: "CI/CD", icon: "githubactions" },
    { name: "Linux", icon: "linux" },
    { name: "Git", icon: "git" },
    { name: "Bash", icon: "bash" },
    { name: "Zsh", icon: "bash" },
  ],
};

export const contact = [
  {
    platform: "Telegram",
    username: "@abeb021",
    url: "https://t.me/abeb_dev",
    iconType: "image",
    iconSrc: "/telegram-svgrepo-com.svg",
  },
  {
    platform: "Github",
    username: "@abeb021",
    url: "https://github.com/abeb021",
    iconType: "stack",
    iconName: "github",
  },
];

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Stack", href: "#stack" },
  { label: "Education", href: "#education" },
  { label: "Connect", href: "#contact" },
];

// Animation settings
export const animationSettings = {
  particleCount: 1500,
  particleSize: 2,
  rotationSpeed: 0.0005,
  cameraZ: 500,
  fadeDelay: 500,
  sectionDelayStep: 200,
  typewriterSpeed: 100,
};
