export interface LegalSection {
  title: string;
  body: string;
  link?: { href: string; label: string };
}

export interface LegalDoc {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export interface LegalContent {
  privacy: LegalDoc;
  terms: LegalDoc;
  safety: {
    title: string;
    intro: string;
    // Same order in every language — SAFETY_ICONS pairs with it by index.
    rules: { title: string; body: string }[];
    fraudTitle: string;
    // Contains {email}, where the contact address link goes.
    fraudBody: string;
  };
}
