import type { CategoryId } from "@/lib/types";

export interface Dictionary {
  categories: Record<CategoryId, string>;

  common: {
    lost: string;
    found: string;
    resolved: string;
    loading: string;
    rewardSuffix: string;
    previous: string;
    next: string;
  };

  nav: {
    listings: string;
    rewarded: string;
    ads: string;
    messages: string;
    login: string;
    postListing: string;
    createQr: string;
    menu: string;
  };

  footer: {
    tagline: string;
    sectionsHeading: string;
    lostItems: string;
    foundItems: string;
    rewardedListings: string;
    adBoard: string;
    categoriesHeading: string;
    helpHeading: string;
    howToPost: string;
    safetyRules: string;
    termsOfUse: string;
    madeIn: string;
  };

  bottomNav: {
    home: string;
    listings: string;
    mark: string;
    messages: string;
    profile: string;
    login: string;
  };

  tabs: {
    lost: string;
    found: string;
    rewarded: string;
    viewAll: string;
    itemsSuffix: string;
    emptyTitle: string;
    emptyBody: string;
    selectPrompt: string;
  };

  listingsPage: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    searchPlaceholder: string;
    filters: string;
    kindAll: string;
    categoryLabel: string;
    allCategories: string;
    cityLabel: string;
    allCities: string;
    clearFilters: string;
    noResultsTitle: string;
    noResultsBody: string;
  };

  listingCard: {
    resolved: string;
  };

  listingDetail: {
    backLink: string;
    descriptionLabel: string;
  };

  contactCard: {
    verifiedUser: string;
    showPhone: string;
    safetyNote: string;
  };

  reportButton: {
    report: string;
    sent: string;
    reasonPlaceholder: string;
    send: string;
    genericError: string;
  };

  aiMatches: {
    title: string;
    reasons: {
      sameCategory: string;
      sameCity: string;
      similarKeywords: string;
      closeDates: string;
    };
  };

  postListing: {
    pageTitlePrefix: string;
    pageTitleHighlight: string;
    pageTitleSuffix: string;
    pageSubtitle: string;
    itemTypeHeading: string;
    lostOption: string;
    foundOption: string;
    mainInfoHeading: string;
    titleLabel: string;
    titlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    categoryLabel: string;
    cityLabel: string;
    photosHeading: string;
    rewardHeading: string;
    rewardHint: string;
    rewardPlaceholder: string;
    contactHeading: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    requiredFieldsError: string;
    genericError: string;
    submitting: string;
    submit: string;
    successTitle: string;
    successKindLost: string;
    successKindFound: string;
    postAnother: string;
    viewAllListings: string;
  };

  rewarded: {
    title: string;
    subtitle: string;
    activeCount: string;
    totalReward: string;
    safetyNote: string;
    emptyTitle: string;
    emptyBody: string;
  };

  login: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    blockedError: string;
    genericError: string;
    googleButton: string;
  };

  languageSwitcher: {
    label: string;
  };
}
