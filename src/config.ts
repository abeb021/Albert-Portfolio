// Portfolio Configuration
// Edit this file to update your portfolio content

type TechItem = {
  name: string;
  icon: string;
  customIcon?: string;
};

export type Project = {
  title: string;
  description: string;
  image?: string;
  stack: string[];
  url: string;
};

type ContactBase = { platform: string; username: string; url: string };
export type ContactItem =
  | (ContactBase & { iconType: 'image'; iconSrc: string })
  | (ContactBase & { iconType: 'stack'; iconName: string });

export const personalInfo = {
  name: "Albert",
  tagline: "Backend Dev / Linux Enthusiast",
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

export const projects: Project[] = [
  // Example:
  // {
  //   title: "My Project",
  //   description: "Short description of what it does.",
  //   image: "/project-preview.png",   // optional — place image in /public
  //   stack: ["Go", "Kafka", "PostgreSQL"],
   //   url: "https://github.com/abeb021/my-project",
  // },

  {
    title: "Wave Connect",
    description: "Containerized social backend: API gateway with JWT auth reverse-proxying to Auth, Feed, Profile, and Chat services. Each domain owns its own Postgres DB; profile events propagate through Kafka. Real-time chat via WebSocket.",
    image: "/projects/wave_connect_logo.svg",
    stack: ["Go", "PostgreSQL", "Kafka", "Docker", "WebSocket", "JWT"],
    url: "https://github.com/abeb021/Wave-Connect",
  },
  {
    title: "Weather Alert Service",
    description: "Microservices weather alert system with NGINX gateway and auth_request validation. Background worker polls conditions every 15 min, publishes alert.triggered to Kafka, and delivers email via SMTP notification service.",
    image: "/projects/weather_alert_logo.svg",
    stack: ["Go", "PostgreSQL", "Redis", "Kafka", "Docker", "JWT"],
    url: "https://github.com/abeb021/Weather-Alert-Service",
  },
];

export const contact: ContactItem[] = [
  {
    platform: "Telegram",
    username: "@abeb021",
    url: "https://t.me/abeb021",
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
  {
    platform: "Leetcode",
    username: "@abeb021",
    url: "https://leetcode.com/abeb021",
    iconType: "image",
    iconSrc: "/leetcode-logo.svg",
  },
];

export const navLinks = [
  { label: "About",     href: "#about" },
  { label: "Stack",     href: "#stack" },
  { label: "Projects",  href: "#projects" },
  { label: "Education", href: "#education" },
  { label: "Connect",   href: "#contact" },
];

export const animationSettings = {
  fadeDelay:        500,
  sectionDelayStep: 200,
  typewriterSpeed:  100,
};
