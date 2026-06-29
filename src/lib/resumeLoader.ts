/**
 * resumeLoader.ts — type definitions matching the actual profile.json schema from Blog-space
 */

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
  open_in_new_tab?: boolean;
  is_visible?: boolean;
}

export interface ExperiencePoint {
  text?: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  location?: string;
  /** Actual field in profile.json is `points`, not `description` */
  points?: string[];
  /** Legacy field — kept for backwards compat */
  description?: string;
  highlights?: string[];
  companyUrl?: string;
  open_in_new_tab?: boolean;
  is_visible?: boolean;
}

export interface ProjectLink {
  label: string;
  url: string;
  open_in_new_tab?: boolean;
  is_visible?: boolean;
}

export interface Project {
  name: string;
  description: string;
  tech?: string[];
  /** New schema: array of labelled links */
  links?: ProjectLink[];
  /** Legacy fields */
  url?: string;
  blogUrl?: string;
  is_visible?: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
  /** New: institutionUrl instead of url */
  institutionUrl?: string;
  url?: string;
  open_in_new_tab?: boolean;
  is_visible?: boolean;
}

export interface Skill {
  name: string;
  /** New schema has no category — we derive one or use 'General' */
  category?: string;
  /** New: githubProject instead of repoUrl */
  githubProject?: string;
  repoUrl?: string;
  open_in_new_tab?: boolean;
  is_visible?: boolean;
}

export interface Certificate {
  name: string;
  issuer: string;
  date?: string;
  credentialUrls?: string[];
  credentialLinks?: { label: string; url: string }[];
  is_visible?: boolean;
}

export interface Achievement {
  title: string;
  description: string;
  is_visible?: boolean;
}

export interface Profile {
  personal: {
    name: string;
    /** New: role/title */
    role?: string;
    title?: string;
    bio: string;
    email?: string;
    location?: string;
    /** New: profile_picture instead of avatar */
    profile_picture?: string;
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
