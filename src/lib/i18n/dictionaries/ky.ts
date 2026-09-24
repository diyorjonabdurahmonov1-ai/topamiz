import type { CategoryId } from "@/lib/types";
import type { Dictionary } from "../types";

const ky: Dictionary = {
  categories: {
    hujjatlar: "Документтер",
    texnika: "Телефон жана техника",
    sumka: "Баштык жана капчык",
    hayvonlar: "Үй жаныбарлары",
    kalitlar: "Ачкычтар",
    kiyim: "Кийим-кече",
    boshqa: "Башка",
  } satisfies Record<CategoryId, string>,

  common: {
    lost: "Жоголду",
    found: "Табылды",
    resolved: "Чечилди",
    loading: "Жүктөлүүдө...",
    rewardSuffix: "сыйлык",
    previous: "Мурунку",
    next: "Кийинки",
  },

  nav: {
    listings: "Жарыялар",
    rewarded: "Сыйлыктуу",
    ads: "Жарнама",
    messages: "Билдирүүлөр",
    login: "Кирүү",
    postListing: "Жарыя жайгаштыруу",
    createQr: "QR-белги түзүү",
    menu: "Меню",
  },

  footer: {
    tagline:
      "Жоголгон заттарды табууну жана табылган заттарды ээсине кайтарууну жеңилдеткен Өзбекстан платформасы.",
    sectionsHeading: "Бөлүмдөр",
    lostItems: "Жоголгон заттар",
    foundItems: "Табылган заттар",
    rewardedListings: "Сыйлыктуу жарыялар",
    adBoard: "Жарнама тактасы",
    categoriesHeading: "Категориялар",
    helpHeading: "Жардам",
    howToPost: "Жарыя кантип жайгаштырылат?",
    safetyRules: "Коопсуздук эрежелери",
    termsOfUse: "Колдонуу шарттары",
    madeIn: "Өзбекстанда, ❖ кам көрүп жасалган.",
  },

  bottomNav: {
    home: "Башкы бет",
    listings: "Жарыялар",
    mark: "Белги",
    messages: "Билдирүүлөр",
    profile: "Профиль",
    login: "Кирүү",
  },

  tabs: {
    lost: "Жоголгон",
    found: "Табылган",
    rewarded: "Сыйлыктуу",
    viewAll: "Баарын көрүү",
    itemsSuffix: "заттар",
    emptyTitle: "Азырынча жарыя жок",
    emptyBody: "Бул бөлүмдө азырынча эч ким жарыя жайгаштырган эмес.",
    selectPrompt: "Жарыяларды көрүү үчүн жогорудагы бөлүмдөрдүн бирин тандаңыз",
  },

  listingsPage: {
    title: "Жоголгон жана табылган",
    titleHighlight: "жарыялар",
    subtitle: "Бардык жарыяларды көрүңүз, издеңиз жана чыпкалаңыз.",
    searchPlaceholder: "Издөө: документ, телефон, мышык...",
    filters: "Чыпкалар",
    kindAll: "Баары",
    categoryLabel: "Категория",
    allCategories: "Бардык категориялар",
    cityLabel: "Шаар",
    allCities: "Бардык шаарлар",
    clearFilters: "Чыпкаларды тазалоо",
    noResultsTitle: "Эч нерсе табылган жок",
    noResultsBody: "Башка ачкыч сөз менен издеңиз же чыпкаларды тазалап, кайра аракет кылыңыз.",
  },

  listingCard: {
    resolved: "Чечилди ✓",
  },

  listingDetail: {
    backLink: "Бардык жарыялар",
    descriptionLabel: "Сүрөттөмө",
  },

  contactCard: {
    verifiedUser: "Ырасталган колдонуучу",
    showPhone: "Телефон номерин көрсөтүү",
    safetyNote: "Коопсуздук үчүн жолугушууну ачык жерде уюштуруңуз.",
  },

  reportButton: {
    report: "Даттануу",
    sent: "Даттануу кабыл алынды",
    reasonPlaceholder: "Себеби (милдеттүү эмес)",
    send: "Жөнөтүү",
    genericError: "Ката кетти",
  },

  aiMatches: {
    title: "AI сунуштаган дал келген жарыялар",
    reasons: {
      sameCategory: "Бирдей категория",
      sameCity: "Бирдей шаар",
      similarKeywords: "Сүрөттөмөдө окшош ачкыч сөздөр",
      closeDates: "Даталар жакын",
    },
  },

  postListing: {
    pageTitlePrefix: "Жаңы",
    pageTitleHighlight: "жарыя",
    pageTitleSuffix: "жайгаштыруу",
    pageSubtitle: "Бир нече мүнөттө жарыя жайгаштырыңыз.",
    itemTypeHeading: "Зат түрү",
    lostOption: "Мен зат жоготтум",
    foundOption: "Мен зат таптым",
    mainInfoHeading: "Негизги маалымат",
    titleLabel: "Аталышы *",
    titlePlaceholder: "Мисалы: Кара түстөгү капчык",
    descriptionLabel: "Сүрөттөмө *",
    descriptionPlaceholder: "Зат кандай көрүнөт, качан жана кайда жоголгон/табылган...",
    categoryLabel: "Категория",
    cityLabel: "Шаар",
    photosHeading: "Сүрөт кошуу",
    rewardHeading: "Сыйлык сунуштоо (милдеттүү эмес)",
    rewardHint: "Сыйлык сунуштоо заттын тезирээк табылышына жардам берет.",
    rewardPlaceholder: "Мисалы: 200000",
    contactHeading: "Байланыш маалыматы",
    nameLabel: "Атыңыз *",
    namePlaceholder: "Аты-жөнү",
    phoneLabel: "Телефон номери *",
    phonePlaceholder: "+998 90 123 45 67",
    requiredFieldsError: "Сураныч, * менен белгиленген бардык талааларды толтуруңуз.",
    genericError: "Ката кетти",
    submitting: "Жайгаштырылууда...",
    submit: "Жарыяны жайгаштыруу",
    successTitle: "Жарыя ийгиликтүү жайгаштырылды!",
    successKindLost: "жоголгон",
    successKindFound: "табылган",
    postAnother: "Дагы жарыя жайгаштыруу",
    viewAllListings: "Бардык жарыяларды көрүү",
  },

  rewarded: {
    title: "Сыйлыктуу жарыялар",
    subtitle:
      "Бул заттардын ээлери тапкандарга сыйлык сунушташат. Затты тапкан соң, ээсине кайтарыңыз жана сыйлыгыңызды алыңыз.",
    activeCount: "Активдүү сыйлыктуу жарыя",
    totalReward: "Жалпы сыйлык суммасы",
    safetyNote: "Сыйлыкты зат ээси менен ачык жана коопсуз жерде жеке жолугушуп гана алыңыз.",
    emptyTitle: "Азырынча сыйлыктуу жарыя жок",
    emptyBody: "Жоголгон затыңызга сыйлык сунуштасаңыз, ал бул жерде көрүнөт.",
  },

  login: {
    title: "Кош",
    titleHighlight: "келдиңиз",
    subtitle: "Улантуу үчүн Google аккаунтуңуз менен кириңиз.",
    blockedError: "Аккаунтуңуз бөгөттөлгөн. Суроолор болсо, колдоо кызматына кайрылыңыз.",
    genericError: "Google аркылуу кирүүдө ката кетти. Кайра аракет кылыңыз.",
    googleButton: "Google аркылуу кирүү",
  },

  languageSwitcher: {
    label: "Тилди тандоо",
  },
};

export default ky;
