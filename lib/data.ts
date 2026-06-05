export type Project = {
  title: string;
  description: string;
  techTags: string[];
  badge?: string;
  featured?: boolean;
  links: {
    github?: string;
    website?: string;
  };
};

export const projects: Project[] = [
  {
    title: "Aksaranta",
    description:
      "An interactive Aksara Batak learning application. This project won Juara Harapan 1, showcasing our commitment to preserving Indonesian cultural heritage through technology.",
    techTags: ["Mobile App", "Cultural", "Education"],
    badge: "Juara Harapan 1",
    featured: true,
    links: {
      github: "https://github.com/jovankaa77/aksara-batak-app",
      website: "https://aksaranta.id",
    },
  },
  {
    title: "MoniFit",
    description:
      "A nutrition calculator program that calculates the nutrition needed using body mass index—height, weight, age, and other factors. Part of my first semester college project.",
    techTags: ["Python", "Health", "CLI"],
    links: {
      github: "https://github.com/stevendotexe/MoniFit",
    },
  },
  {
    title: "Budget",
    description:
      "CS50P Completion Project. A budget tracking application that calculates and visualizes monthly spending with multiple built-in features like profiles and purchase item addition.",
    techTags: ["Python", "CS50", "Finance"],
    links: {
      github: "https://github.com/lqg3/budget",
    },
  },
];

export type SkillBar = { name: string; progress: number };

export const programmingSkills: SkillBar[] = [
  { name: "Python", progress: 85 },
  { name: "JavaScript", progress: 80 },
  { name: "TypeScript", progress: 75 },
  { name: "HTML/CSS", progress: 90 },
];

export const frameworkSkills: string[] = [
  "React",
  "Next.js",
  "Vue",
  "Node.js",
  "NestJS",
  "Tailwind CSS",
  "Git",
  "Figma",
  "Tauri",
];

export type Certification = {
  icon: string;
  title: string;
  issuer: string;
  description: string;
};

export const certifications: Certification[] = [
  {
    icon: "🎓",
    title: "CS50P",
    issuer: "Harvard University",
    description: "Introduction to Programming with Python",
  },
];

export type AboutDetail = {
  label: string;
  value: React.ReactNode;
};

export type NavItem =
  | { kind: "link"; href: string; label: string }
  | { kind: "dropdown"; label: string; children: { href: string; label: string }[] };

export const navItems: NavItem[] = [
  {
    kind: "dropdown",
    label: "Portfolio",
    children: [
      { href: "/#home", label: "Home" },
      { href: "/#about", label: "About" },
      { href: "/#projects", label: "Projects" },
      { href: "/#skills", label: "Skills" },
      { href: "/#contact", label: "Contact" },
    ],
  },
  { kind: "link", href: "/photography", label: "Photography & Graphic Design" },
];
