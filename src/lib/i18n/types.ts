import type { CategoryId, PromoCategoryId } from "@/lib/types";

export interface Dictionary {
  categories: Record<CategoryId, string>;
  promoCategories: Record<PromoCategoryId, string>;

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
    mysteryBox: string;
    promo: string;
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
    viewAll: string;
    itemsSuffix: string;
    emptyTitle: string;
    emptyBody: string;
  };

  homeQuickAccess: {
    searchButtonLabel: string;
    categoryHujjatlar: string;
    categoryTelefon: string;
    categoryKalitlar: string;
    categoryHamyon: string;
    categoryHayvon: string;
    categoryKiyim: string;
    categoryBoshqa: string;
    nearbyTitle: string;
    qrTitle: string;
    qrSubtitle: string;
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
    mysteryBox: string;
    promo: string;
  };

  listingDetail: {
    backLink: string;
    descriptionLabel: string;
    showOnMap: string;
    hideMap: string;
    getDirections: string;
    foundItButton: string;
    foundItPlaceholder: string;
    foundItPhotosLabel: string;
    foundItSend: string;
    foundItSuccess: string;
    foundItRequiredError: string;
    foundItGenericError: string;
    mysteryBoxNotice: string;
    mysteryBoxExpiredNotice: string;
    claimantsHeading: string;
    claimantsHint: string;
    claimantConfirmButton: string;
    claimantConfirming: string;
    resolvedByLabel: string;
    videoLockedTitle: string;
    videoLockedBody: string;
    contentLockedTitle: string;
    contentLockedBody: string;
  };

  countdown: {
    label: string;
    startsLabel: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    expired: string;
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
    districtLabel: string;
    districtPlaceholder: string;
    mapPickerHint: string;
    locateMeButton: string;
    locating: string;
    locateMeSuccess: string;
    locateMeError: string;
    locateMePermissionDenied: string;
    detectingLocation: string;
    locationRequiredError: string;
    mediaHeading: string;
    mediaHint: string;
    mediaPhotoTab: string;
    mediaVideoTab: string;
    rewardHeading: string;
    rewardHint: string;
    rewardPlaceholder: string;
    contactHeading: string;
    phoneLabel: string;
    phonePlaceholder: string;
    requiredFieldsError: string;
    genericError: string;
    submitting: string;
    waitingForVideo: string;
    videoBlockingError: string;
    submit: string;
    successTitle: string;
    successKindLost: string;
    successKindFound: string;
    postAnother: string;
    viewAllListings: string;
    mysteryBoxCalloutTitle: string;
    mysteryBoxCalloutBody: string;
    mysteryBoxCalloutButton: string;
    promoCalloutTitle: string;
    promoCalloutBody: string;
    promoCalloutButton: string;
    redactHeading: string;
    redactHint: string;
    redactUndo: string;
    redactSkip: string;
    redactDone: string;
    videoUploadPrompt: string;
    videoUploadHint: string;
    videoUploading: string;
    videoRemove: string;
    videoUploadFailedPrefix: string;
    videoInvalidError: string;
    videoTooLongError: string;
    videoGenericError: string;
    videoProcessing: string;
    videoNetworkError: string;
    videoReadError: string;
    videoServerError: string;
  };

  mysteryBoxForm: {
    pageTitle: string;
    pageSubtitle: string;
    explainHeading: string;
    explainBody: string;
    explainBullet1: string;
    explainBullet2: string;
    explainBullet3: string;
    titleLabel: string;
    titlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    extraInfoLabel: string;
    extraInfoPlaceholder: string;
    photosHeading: string;
    photosRequiredError: string;
    mapPickerHint: string;
    locationRequiredError: string;
    expiryLabel: string;
    expiryHint: string;
    expiryRequiredError: string;
    expiryPastError: string;
    expiryTooFarError: string;
    startLabel: string;
    startHint: string;
    startAfterExpiryError: string;
    requiredFieldsError: string;
    genericError: string;
    submitting: string;
    submit: string;
    successTitle: string;
    successBody: string;
    backToNormalLink: string;
    viewMysteryBoxLink: string;
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

  promo: {
    title: string;
    subtitle: string;
    postButton: string;
    activeCount: string;
    allCategories: string;
    emptyTitle: string;
    emptyBody: string;
  };

  promoForm: {
    pageTitle: string;
    pageSubtitle: string;
    explainHeading: string;
    explainBody: string;
    titleLabel: string;
    titlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    categoryLabel: string;
    tariffsLabel: string;
    tariffsPlaceholder: string;
    mapPickerHint: string;
    contactHeading: string;
    phoneLabel: string;
    requiredFieldsError: string;
    genericError: string;
    submitting: string;
    submit: string;
    successTitle: string;
    successBody: string;
    viewPromoLink: string;
    backToNormalLink: string;
  };

  mysteryBox: {
    title: string;
    subtitle: string;
    activeCount: string;
    emptyTitle: string;
    emptyBody: string;
    loginRequiredTitle: string;
    loginRequiredBody: string;
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
    myListings: string;
    myQrTags: string;
    adminPanel: string;
    logout: string;
    genericError: string;
    pushEnable: string;
    pushEnabled: string;
    pushDenied: string;
    pushError: string;
    changePhoto: string;
    findPeopleHeading: string;
    findPeoplePlaceholder: string;
    deleteAccount: string;
    deleteAccountConfirm: string;
    deleteAccountError: string;
  };

  publicProfile: {
    noBio: string;
    writeMessage: string;
    listingsHeading: string;
    noListings: string;
    addFriend: string;
    friendAdded: string;
    friendsHeading: string;
    noFriends: string;
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
    locationPermissionDenied: string;
    viewListing: string;
    you: string;
    nearbyHeading: string;
    nearbyHint: string;
  };

  myListings: {
    title: string;
    emptyBody: string;
    deleteConfirm: string;
    delete: string;
    markResolved: string;
    markActive: string;
  };

  social: {
    commentsHeading: string;
    commentsEmpty: string;
    commentPlaceholder: string;
    commentSend: string;
    commentLoginPrompt: string;
    commentGenericError: string;
    shareButton: string;
    shareToFriend: string;
    shareExternal: string;
    shareLinkCopied: string;
    shareSearchPlaceholder: string;
    shareSentTitle: string;
    shareSentBody: string;
    shareGenericError: string;
    reelsNavLabel: string;
    reelsEmptyTitle: string;
    reelsEmptyBody: string;
    reelsViewListing: string;
    reelsLoginPrompt: string;
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
    genericError: string;
    submit: string;
    successTitle: string;
    successBody: string;
  };
}
