import type { IconName } from "@/components/ui/icons";

export interface LandingStep {
  title: string;
  body: string;
}

export interface LandingStat {
  value: string;
  label: string;
}

export interface LandingBullet {
  icon: IconName;
  title: string;
  body: string;
}

export interface LandingKidCard {
  icon: IconName;
  title: string;
  body: string;
}

export interface LandingFaq {
  q: string;
  a: string;
}

export interface LandingContent {
  navBrand: string;
  navHowItWorks: string;
  navGames: string;
  navParents: string;
  navFaq: string;
  langToggle: string;
  langToggleLabel: string;
  heroBadge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  ctaStart: string;
  ctaHow: string;
  ctaDashboard: string;
  ctaSignIn: string;
  trustItems: string[];
  stats: LandingStat[];
  parentsEyebrow: string;
  parentsTitle: string;
  parentsSubtitle: string;
  parentsBullets: LandingBullet[];
  reportMockTitle: string;
  reportMockWeek: string;
  reportMockRows: { label: string; value: number; color: string }[];
  reportMockNote: string;
  kidsEyebrow: string;
  kidsTitle: string;
  kidsSubtitle: string;
  kidsCards: LandingKidCard[];
  howEyebrow: string;
  howTitle: string;
  howIntro: string;
  steps: LandingStep[];
  gamesEyebrow: string;
  gamesTitle: string;
  gamesIntro: string;
  gamesLevelLabel: string;
  gamesAdaptiveLabel: string;
  gamesHowToPlay: string;
  gameHints: Record<string, string>;
  faqEyebrow: string;
  faqTitle: string;
  faqSubtitle: string;
  faqs: LandingFaq[];
  safetyTitle: string;
  safetyIntro: string;
  safetyItems: string[];
  disclaimerTitle: string;
  disclaimerBody: string;
  ctaBottomTitle: string;
  ctaBottomBody: string;
  footerRights: string;
  footerPrivacy: string;
  footerTagline: string;
}
