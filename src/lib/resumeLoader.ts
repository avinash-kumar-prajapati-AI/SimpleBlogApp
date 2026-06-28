/**
 * resumeLoader.ts — load and type profile.json from blog_repo
 */

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
  highlights?: string[];
}

export interface Project {
  name: string;
  description: string;
  url?: string;
  blogUrl?: string;
  tech?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
  url?: string;
}

export interface Skill {
  name: string;
  category: string;
  repoUrl?: string;
}

export interface Certificate {
  name: string;
  issuer: string;
  date?: string;
  credentialUrls: string[];
}

export interface Achievement {
  title: string;
  description: string;
}

export interface Profile {
  personal: {
    name: string;
    title: string;
    bio: string;
    email?: string;
    location?: string;
    avatar?: string;
  };
  social: SocialLink[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  skills: Skill[];
  certificates: Certificate[];
  achievements: Achievement[];
}

/** Fallback profile when repo not available */
export const FALLBACK_PROFILE: Profile = {
  personal: {
    name: "Avinash",
    title: "Software Engineer",
    bio: "Building software and sharing knowledge through this blog.",
    email: "contact@example.com",
  },
  social: [],
  experience: [],
  projects: [],
  education: [],
  skills: [],
  certificates: [],
  achievements: [],
};
