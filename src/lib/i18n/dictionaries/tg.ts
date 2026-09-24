import type { CategoryId } from "@/lib/types";
import type { Dictionary } from "../types";

const tg: Dictionary = {
  categories: {
    hujjatlar: "Ҳуҷҷатҳо",
    texnika: "Телефон ва техника",
    sumka: "Сумка ва ҳамён",
    hayvonlar: "Ҳайвоноти хонагӣ",
    kalitlar: "Калидҳо",
    kiyim: "Либос",
    boshqa: "Дигар",
  } satisfies Record<CategoryId, string>,

  common: {
    lost: "Гумшуда",
    found: "Ёфтшуда",
    resolved: "Ҳал шуд",
    loading: "Бор карда мешавад...",
    rewardSuffix: "мукофот",
    previous: "Қаблӣ",
    next: "Баъдӣ",
  },

  nav: {
    listings: "Эълонҳо",
    rewarded: "Бо мукофот",
    ads: "Реклама",
    messages: "Паёмҳо",
    login: "Ворид шудан",
    postListing: "Эълон гузоштан",
    createQr: "Сохтани QR-нишона",
    menu: "Меню",
  },

  footer: {
    tagline:
      "Платформаи Ӯзбекистон, ки ёфтани чизҳои гумшуда ва баргардонидани чизҳои ёфтшударо ба соҳибонашон осон мекунад.",
    sectionsHeading: "Бахшҳо",
    lostItems: "Чизҳои гумшуда",
    foundItems: "Чизҳои ёфтшуда",
    rewardedListings: "Эълонҳои бо мукофот",
    adBoard: "Тахтаи реклама",
    categoriesHeading: "Категорияҳо",
    helpHeading: "Кӯмак",
    howToPost: "Эълон чӣ тавр гузошта мешавад?",
    safetyRules: "Қоидаҳои бехатарӣ",
    termsOfUse: "Шартҳои истифода",
    madeIn: "Дар Ӯзбекистон, бо ғамхорӣ ❖ сохта шудааст.",
  },

  bottomNav: {
    home: "Саҳифаи асосӣ",
    listings: "Эълонҳо",
    mark: "Нишона",
    messages: "Паёмҳо",
    profile: "Профил",
    login: "Ворид шудан",
  },

  tabs: {
    lost: "Гумшуда",
    found: "Ёфтшуда",
    rewarded: "Бо мукофот",
    viewAll: "Ҳамаро дидан",
    itemsSuffix: "чизҳо",
    emptyTitle: "Ҳанӯз эълон нест",
    emptyBody: "Дар ин бахш то ҳол ҳеҷ кас эълон нагузоштааст.",
    selectPrompt: "Барои дидани эълонҳо яке аз бахшҳои болоро интихоб кунед",
  },

  listingsPage: {
    title: "Эълонҳои гумшуда ва",
    titleHighlight: "ёфтшуда",
    subtitle: "Ҳамаи эълонҳоро бинед, ҷустуҷӯ кунед ва филтр кунед.",
    searchPlaceholder: "Ҷустуҷӯ: ҳуҷҷат, телефон, гурба...",
    filters: "Филтрҳо",
    kindAll: "Ҳама",
    categoryLabel: "Категория",
    allCategories: "Ҳамаи категорияҳо",
    cityLabel: "Шаҳр",
    allCities: "Ҳамаи шаҳрҳо",
    clearFilters: "Пок кардани филтрҳо",
    noResultsTitle: "Чизе ёфт нашуд",
    noResultsBody: "Бо калимаи дигар ҷустуҷӯ кунед ё филтрҳоро пок карда, боз кӯшиш кунед.",
  },

  listingCard: {
    resolved: "Ҳал шуд ✓",
  },

  listingDetail: {
    backLink: "Ҳамаи эълонҳо",
    descriptionLabel: "Тавсиф",
  },

  contactCard: {
    verifiedUser: "Корбари тасдиқшуда",
    showPhone: "Нишон додани рақами телефон",
    safetyNote: "Барои бехатарӣ вохӯриро дар ҷои кушод ташкил кунед.",
  },

  reportButton: {
    report: "Шикоят кардан",
    sent: "Шикоят қабул шуд",
    reasonPlaceholder: "Сабаб (ихтиёрӣ)",
    send: "Фиристодан",
    genericError: "Хатогӣ рӯй дод",
  },

  aiMatches: {
    title: "Эълонҳои мувофиқи пешниҳодкардаи AI",
    reasons: {
      sameCategory: "Категорияи якхела",
      sameCity: "Шаҳри якхела",
      similarKeywords: "Калимаҳои калидии монанд дар тавсиф",
      closeDates: "Санаҳо наздиканд",
    },
  },

  postListing: {
    pageTitlePrefix: "Гузоштани",
    pageTitleHighlight: "эълони",
    pageTitleSuffix: "нав",
    pageSubtitle: "Дар якчанд дақиқа эълон гузоред.",
    itemTypeHeading: "Навъи чиз",
    lostOption: "Ман чизе гум кардам",
    foundOption: "Ман чизе ёфтам",
    mainInfoHeading: "Маълумоти асосӣ",
    titleLabel: "Сарлавҳа *",
    titlePlaceholder: "Масалан: Ҳамёни сиёҳ",
    descriptionLabel: "Тавсиф *",
    descriptionPlaceholder: "Чиз чӣ гуна намуд дорад, дар куҷо ва кай гум/ёфт шудааст...",
    categoryLabel: "Категория",
    cityLabel: "Шаҳр",
    photosHeading: "Илова кардани расм",
    rewardHeading: "Пешниҳоди мукофот (ихтиёрӣ)",
    rewardHint: "Пешниҳоди мукофот ба зудтар ёфта шудани чизи шумо кӯмак мекунад.",
    rewardPlaceholder: "Масалан: 200000",
    contactHeading: "Маълумоти тамос",
    nameLabel: "Номи шумо *",
    namePlaceholder: "Ном ва насаб",
    phoneLabel: "Рақами телефон *",
    phonePlaceholder: "+998 90 123 45 67",
    requiredFieldsError: "Лутфан, ҳамаи майдонҳои бо * қайдшударо пур кунед.",
    genericError: "Хатогӣ рӯй дод",
    submitting: "Гузошта истодааст...",
    submit: "Гузоштани эълон",
    successTitle: "Эълон бомуваффақият гузошта шуд!",
    successKindLost: "гумшуда",
    successKindFound: "ёфтшуда",
    postAnother: "Боз эълон гузоштан",
    viewAllListings: "Дидани ҳамаи эълонҳо",
  },

  rewarded: {
    title: "Эълонҳои бо мукофот",
    subtitle:
      "Соҳибони ин чизҳо ба ёфтагон мукофот пешниҳод мекунанд. Чизро ёфта, ба соҳибаш баргардонед ва мукофоти худро гиред.",
    activeCount: "Эълони фаъоли бо мукофот",
    totalReward: "Маблағи умумии мукофот",
    safetyNote: "Мукофотро танҳо ҳангоми вохӯрии бевосита бо соҳиби чиз дар ҷои кушоду бехатар гиред.",
    emptyTitle: "Ҳанӯз эълони бо мукофот нест",
    emptyBody: "Агар барои чизи гумшудаатон мукофот пешниҳод кунед, он дар ин ҷо намоён мешавад.",
  },

  login: {
    title: "Хуш",
    titleHighlight: "омадед",
    subtitle: "Барои идома додан бо ҳисоби Google-и худ ворид шавед.",
    blockedError: "Ҳисоби шумо блок шудааст. Агар савол бошад, бо дастгирӣ тамос гиред.",
    genericError: "Ҳангоми вуруд бо Google хатогӣ рӯй дод. Бори дигар кӯшиш кунед.",
    googleButton: "Бо Google ворид шудан",
  },

  languageSwitcher: {
    label: "Интихоби забон",
  },
};

export default tg;
