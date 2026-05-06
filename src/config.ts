// Portfolio Configuration
// Edit this file to update your portfolio content

type TechItem = {
  name: string;
  icon: string;
  customIcon?: string;
};

export const personalInfo = {
  name: "Albert",
  tagline: "CS Student @ Innopolis University",
  footerName: "Albert",
};

export const about = {
  description: [ 
    "I'm Albert, a Go backend developer who builds microservices and works with Kafka, PostgreSQL, and Docker. I care about how things work under the hood — not just using tools, but understanding them. I run Arch Linux as my main system and enjoy exploring how operating systems and networks function.",
  ],
};

export const education = {
  university: "Innopolis University",
  program: "Computer Science Program",
  description: "Studying at one of Russia's most innovative technical universities, focusing on cutting-edge technology and computer science.",
  logoInitials: "IU",
};

export const techStack: Record<string, TechItem[]> = {
  languages: [
    { name: "Go", icon: "go" },
    { name: "Python", icon: "python" },
    { name: "C++", icon: "c++" },
    { name: "Java", icon: "java" },
  ],
  backend: [
    { name: "REST API", icon: "api", customIcon: "/rest-api-svgrepo-com.svg" },
    { name: "gRPC", icon: "grpc", customIcon: "/grpc-logo.svg" },
    { name: "Kafka", icon: "apachekafka", customIcon: "/kafka-logo.svg" },
  ],
  databases: [
    { name: "PostgreSQL", icon: "postgresql" },
    { name: "Redis", icon: "redis" },
    { name: "MongoDB", icon: "mongodb" },
  ],
  devopsAndTools: [
    { name: "Docker", icon: "docker" },
    { name: "Linux", icon: "linux" },
    { name: "Git", icon: "git" },
    { name: "Bash", icon: "bash" },
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
  particleCount: 15000,
  particleSize: 2,
  rotationSpeed: 0.0005,
  cameraZ: 500,
  fadeDelay: 500,
  sectionDelayStep: 200,
  typewriterSpeed: 100,
};
