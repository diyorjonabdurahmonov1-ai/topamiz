import type { CategoryId } from "@/lib/types";
import type { Dictionary } from "../types";

const kk: Dictionary = {
  categories: {
    hujjatlar: "Құжаттар",
    texnika: "Телефон және техника",
    sumka: "Сөмке мен әмиян",
    hayvonlar: "Үй жануарлары",
    kalitlar: "Кілттер",
    kiyim: "Киім-кешек",
    boshqa: "Басқа",
  } satisfies Record<CategoryId, string>,

  common: {
    lost: "Жоғалды",
    found: "Табылды",
    resolved: "Шешілді",
    loading: "Жүктелуде...",
    rewardSuffix: "сыйлық",
    previous: "Алдыңғы",
    next: "Келесі",
  },

  nav: {
    listings: "Хабарландырулар",
    rewarded: "Сыйлықты",
    ads: "Жарнама",
    messages: "Хабарлар",
    login: "Кіру",
    postListing: "Хабарландыру беру",
    createQr: "QR-белгі жасау",
    menu: "Мәзір",
  },

  footer: {
    tagline:
      "Жоғалған заттарды табуды және табылған заттарды иесіне қайтаруды жеңілдететін Өзбекстан платформасы.",
    sectionsHeading: "Бөлімдер",
    lostItems: "Жоғалған заттар",
    foundItems: "Табылған заттар",
    rewardedListings: "Сыйлықты хабарландырулар",
    adBoard: "Жарнама тақтасы",
    categoriesHeading: "Санаттар",
    helpHeading: "Көмек",
    howToPost: "Хабарландыру қалай орналастырылады?",
    safetyRules: "Қауіпсіздік ережелері",
    termsOfUse: "Пайдалану шарттары",
    madeIn: "Өзбекстанда, ❖ қамқорлықпен жасалған.",
  },

  bottomNav: {
    home: "Басты бет",
    listings: "Хабарландырулар",
    mark: "Белгі",
    messages: "Хабарлар",
    profile: "Профиль",
    login: "Кіру",
  },

  tabs: {
    lost: "Жоғалған",
    found: "Табылған",
    rewarded: "Сыйлықты",
    viewAll: "Барлығын көру",
    itemsSuffix: "заттар",
    emptyTitle: "Әзірге хабарландыру жоқ",
    emptyBody: "Бұл бөлімде әлі ешкім хабарландыру орналастырмаған.",
    selectPrompt: "Хабарландыруларды көру үшін жоғарыдағы бөлімдердің бірін таңдаңыз",
  },

  listingsPage: {
    title: "Жоғалған және табылған",
    titleHighlight: "хабарландырулар",
    subtitle: "Барлық хабарландыруларды қараңыз, іздеңіз және сүзгілеңіз.",
    searchPlaceholder: "Іздеу: құжат, телефон, мысық...",
    filters: "Сүзгілер",
    kindAll: "Барлығы",
    categoryLabel: "Санат",
    allCategories: "Барлық санаттар",
    cityLabel: "Қала",
    allCities: "Барлық қалалар",
    clearFilters: "Сүзгілерді тазалау",
    noResultsTitle: "Ештеңе табылмады",
    noResultsBody: "Басқа кілт сөзбен іздеңіз немесе сүзгілерді тазалап, қайта көріңіз.",
  },

  listingCard: {
    resolved: "Шешілді ✓",
  },

  listingDetail: {
    backLink: "Барлық хабарландырулар",
    descriptionLabel: "Сипаттама",
  },

  contactCard: {
    verifiedUser: "Расталған пайдаланушы",
    showPhone: "Телефон нөмірін көрсету",
    safetyNote: "Қауіпсіздік үшін кездесуді ашық жерде ұйымдастырыңыз.",
  },

  reportButton: {
    report: "Шағымдану",
    sent: "Шағым қабылданды",
    reasonPlaceholder: "Себебі (міндетті емес)",
    send: "Жіберу",
    genericError: "Қате орын алды",
  },

  aiMatches: {
    title: "AI ұсынған сәйкес хабарландырулар",
    reasons: {
      sameCategory: "Бірдей санат",
      sameCity: "Бірдей қала",
      similarKeywords: "Сипаттамада ұқсас кілт сөздер",
      closeDates: "Күндер жақын",
    },
  },

  postListing: {
    pageTitlePrefix: "Жаңа",
    pageTitleHighlight: "хабарландыру",
    pageTitleSuffix: "беру",
    pageSubtitle: "Бірнеше минутта хабарландыру беріңіз.",
    itemTypeHeading: "Зат түрі",
    lostOption: "Мен зат жоғалттым",
    foundOption: "Мен зат таптым",
    mainInfoHeading: "Негізгі ақпарат",
    titleLabel: "Тақырып *",
    titlePlaceholder: "Мысалы: Қара түсті әмиян",
    descriptionLabel: "Сипаттама *",
    descriptionPlaceholder: "Зат қандай көрінеді, қашан және қайда жоғалды/табылды...",
    categoryLabel: "Санат",
    cityLabel: "Қала",
    photosHeading: "Сурет қосу",
    rewardHeading: "Сыйлық ұсыну (міндетті емес)",
    rewardHint: "Сыйлық ұсыну затыңыздың тезірек табылуына көмектеседі.",
    rewardPlaceholder: "Мысалы: 200000",
    contactHeading: "Байланыс мәліметтері",
    nameLabel: "Атыңыз *",
    namePlaceholder: "Аты-жөні",
    phoneLabel: "Телефон нөмірі *",
    phonePlaceholder: "+998 90 123 45 67",
    requiredFieldsError: "* белгісімен көрсетілген барлық өрістерді толтырыңыз.",
    genericError: "Қате орын алды",
    submitting: "Орналастырылуда...",
    submit: "Хабарландыруды беру",
    successTitle: "Хабарландыру сәтті орналастырылды!",
    successKindLost: "жоғалған",
    successKindFound: "табылған",
    postAnother: "Тағы хабарландыру беру",
    viewAllListings: "Барлық хабарландыруларды көру",
  },

  rewarded: {
    title: "Сыйлықты хабарландырулар",
    subtitle:
      "Бұл заттардың иелері тапқандарға сыйлық ұсынады. Затты тауып, иесіне қайтарыңыз және сыйлығыңызды алыңыз.",
    activeCount: "Белсенді сыйлықты хабарландыру",
    totalReward: "Жалпы сыйлық сомасы",
    safetyNote: "Сыйлықты тек зат иесімен ашық және қауіпсіз жерде жүздесіп алыңыз.",
    emptyTitle: "Әзірге сыйлықты хабарландыру жоқ",
    emptyBody: "Жоғалған затыңызға сыйлық ұсынсаңыз, ол осы жерде көрінеді.",
  },

  login: {
    title: "Қош",
    titleHighlight: "келдіңіз",
    subtitle: "Жалғастыру үшін Google аккаунтыңызбен кіріңіз.",
    blockedError: "Аккаунтыңыз бұғатталған. Сұрақтарыңыз болса, қолдау қызметіне хабарласыңыз.",
    genericError: "Google арқылы кіруде қате орын алды. Қайта көріңіз.",
    googleButton: "Google арқылы кіру",
  },

  languageSwitcher: {
    label: "Тілді таңдау",
  },
};

export default kk;
