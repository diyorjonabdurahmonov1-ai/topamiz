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
    close: string;
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
    loadMore: string;
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
    locateMeButton: string;
    locating: string;
    locateMeSuccess: string;
    locateMeError: string;
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

  profile: {
    editProfile: string;
    noBio: string;
    namePlaceholder: string;
    bioPlaceholder: string;
    cancel: string;
    save: string;
    myMessages: string;
    myQrTags: string;
    adminPanel: string;
    logout: string;
    genericError: string;
  };

  publicProfile: {
    noBio: string;
    writeMessage: string;
  };

  messages: {
    title: string;
    searchPlaceholder: string;
    noUsersFound: string;
    qrNotificationsHeading: string;
    itemFallback: string;
    noNameFallback: string;
    conversationsHeading: string;
    noConversations: string;
    noMessagesYet: string;
    messagePlaceholder: string;
    sendAriaLabel: string;
  };

  tags: {
    createPageTitlePrefix: string;
    createPageTitleHighlight: string;
    createPageSubtitle: string;
    myTagsTitle: string;
    newButton: string;
    emptyTitle: string;
    emptyBody: string;
    createButton: string;
    aboutItemHeading: string;
    itemNameLabel: string;
    itemNamePlaceholder: string;
    itemDescLabel: string;
    itemDescPlaceholder: string;
    photoHeading: string;
    nameRequiredError: string;
    photoRequiredError: string;
    genericError: string;
    creating: string;
    submit: string;
    readyTitle: string;
    readyBody: string;
    downloadButton: string;
    myTagsLink: string;
    foundBadge: string;
    download: string;
    view: string;
    copyLink: string;
    copied: string;
    reactivate: string;
    markFound: string;
    deleteConfirm: string;
    delete: string;
    publicBadge: string;
    resolvedBadge: string;
    descriptionLabel: string;
    resolvedNotice: string;
    writeToOwner: string;
    guestNamePlaceholder: string;
    guestPhonePlaceholder: string;
    contactMessagePlaceholder: string;
    sentTitle: string;
    sentBody: string;
    messageRequiredError: string;
    send: string;
    loginHint: string;
  };

  map: {
    listView: string;
    mapView: string;
    myLocationButton: string;
    locating: string;
    locationError: string;
    viewListing: string;
    you: string;
  };

  ads: {
    pageTitle: string;
    pageSubtitle: string;
    monthlyUsers: string;
    monthlyViews: string;
    currentBannerHeading: string;
    fallbackAlt: string;
    inquiryHeading: string;
    inquirySubtitle: string;
    companyLabel: string;
    companyPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    commentLabel: string;
    commentPlaceholder: string;
    requiredError: string;
    submit: string;
    successTitle: string;
    successBody: string;
  };
}
