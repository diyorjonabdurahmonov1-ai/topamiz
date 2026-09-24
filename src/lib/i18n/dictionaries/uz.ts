import type { CategoryId } from "@/lib/types";
import type { Dictionary } from "../types";

const uz: Dictionary = {
  categories: {
    hujjatlar: "Hujjatlar",
    texnika: "Telefon va texnika",
    sumka: "Sumka va hamyon",
    hayvonlar: "Uy hayvonlari",
    kalitlar: "Kalitlar",
    kiyim: "Kiyim-kechak",
    boshqa: "Boshqa",
  } satisfies Record<CategoryId, string>,

  common: {
    lost: "Yo'qoldi",
    found: "Topildi",
    resolved: "Hal qilindi",
    loading: "Yuklanmoqda...",
    rewardSuffix: "mukofot",
    previous: "Oldingilar",
    next: "Keyingilar",
  },

  nav: {
    listings: "E'lonlar",
    rewarded: "Mukofotli",
    ads: "Reklama",
    messages: "Xabarlar",
    login: "Kirish",
    postListing: "E'lon joylash",
    createQr: "QR-belgi yaratish",
    menu: "Menyu",
  },

  footer: {
    tagline:
      "Yo'qolgan buyumlarni topish va topilgan buyumlarni egasiga qaytarishni osonlashtiruvchi O'zbekiston platformasi.",
    sectionsHeading: "Bo'limlar",
    lostItems: "Yo'qolgan buyumlar",
    foundItems: "Topilgan buyumlar",
    rewardedListings: "Mukofotli e'lonlar",
    adBoard: "Reklama taxtachasi",
    categoriesHeading: "Turkumlar",
    helpHeading: "Yordam",
    howToPost: "E'lon qanday joylanadi?",
    safetyRules: "Xavfsizlik qoidalari",
    termsOfUse: "Foydalanish shartlari",
    madeIn: "O'zbekistonda, ❖ g'amxorlik bilan yaratilgan.",
  },

  bottomNav: {
    home: "Bosh sahifa",
    listings: "E'lonlar",
    mark: "Belgilash",
    messages: "Xabarlar",
    profile: "Profil",
    login: "Kirish",
  },

  tabs: {
    lost: "Yo'qolgan",
    found: "Topilgan",
    rewarded: "Mukofotli",
    viewAll: "Barchasini ko'rish",
    itemsSuffix: "buyumlar",
    emptyTitle: "Hozircha e'lonlar yo'q",
    emptyBody: "Bu bo'limda hali hech kim e'lon joylashtirmagan.",
    selectPrompt: "E'lonlarni ko'rish uchun yuqoridagi bo'limlardan birini tanlang",
  },

  listingsPage: {
    title: "Yo'qolgan va topilgan",
    titleHighlight: "e'lonlar",
    subtitle: "Barcha e'lonlarni ko'ring, qidiring va filtrlang.",
    searchPlaceholder: "Qidiruv: hujjat, telefon, mushuk...",
    filters: "Filtrlar",
    kindAll: "Barchasi",
    categoryLabel: "Turkum",
    allCategories: "Barcha turkumlar",
    cityLabel: "Shahar",
    allCities: "Barcha shaharlar",
    clearFilters: "Filtrlarni tozalash",
    noResultsTitle: "Hech narsa topilmadi",
    noResultsBody: "Boshqa kalit so'z bilan qidiring yoki filtrlarni tozalab qayta urinib ko'ring.",
  },

  listingCard: {
    resolved: "Hal qilindi ✓",
  },

  listingDetail: {
    backLink: "Barcha e'lonlar",
    descriptionLabel: "Tavsif",
  },

  contactCard: {
    verifiedUser: "Tasdiqlangan foydalanuvchi",
    showPhone: "Aloqa raqamini ko'rsatish",
    safetyNote: "Xavfsizlik uchun uchrashuvni ochiq joyda tashkillashtiring.",
  },

  reportButton: {
    report: "Shikoyat qilish",
    sent: "Shikoyat qabul qilindi",
    reasonPlaceholder: "Sababi (ixtiyoriy)",
    send: "Yuborish",
    genericError: "Xatolik yuz berdi",
  },

  aiMatches: {
    title: "AI tavsiya etgan mos e'lonlar",
    reasons: {
      sameCategory: "Bir xil turkum",
      sameCity: "Bir xil shahar",
      similarKeywords: "Tavsifda o'xshash kalit so'zlar",
      closeDates: "Sanalar yaqin",
    },
  },

  postListing: {
    pageTitlePrefix: "Yangi",
    pageTitleHighlight: "e'lon",
    pageTitleSuffix: "joylash",
    pageSubtitle: "Bir necha daqiqada e'lon joylang.",
    itemTypeHeading: "Buyum turi",
    lostOption: "Men buyum yo'qotdim",
    foundOption: "Men buyum topdim",
    mainInfoHeading: "Asosiy ma'lumot",
    titleLabel: "Sarlavha *",
    titlePlaceholder: "Masalan: Qora rangli hamyon",
    descriptionLabel: "Tavsif *",
    descriptionPlaceholder: "Buyum qanday ko'rinishga ega, qayerda va qachon yo'qolgan/topilgan...",
    categoryLabel: "Turkum",
    cityLabel: "Shahar",
    photosHeading: "Rasm qo'shish",
    rewardHeading: "Mukofot taklif qilish (ixtiyoriy)",
    rewardHint: "Mukofot taklif qilish buyumingiz tezroq topilishiga yordam beradi.",
    rewardPlaceholder: "Masalan: 200000",
    contactHeading: "Aloqa ma'lumotlari",
    nameLabel: "Ismingiz *",
    namePlaceholder: "Ism Familiya",
    phoneLabel: "Telefon raqami *",
    phonePlaceholder: "+998 90 123 45 67",
    requiredFieldsError: "Iltimos, * bilan belgilangan barcha maydonlarni to'ldiring.",
    genericError: "Xatolik yuz berdi",
    submitting: "Joylanmoqda...",
    submit: "E'lonni joylash",
    successTitle: "E'lon muvaffaqiyatli joylandi!",
    successKindLost: "yo'qolgan",
    successKindFound: "topilgan",
    postAnother: "Yana e'lon joylash",
    viewAllListings: "Barcha e'lonlarni ko'rish",
  },

  rewarded: {
    title: "Mukofotli e'lonlar",
    subtitle:
      "Bu buyumlarning egalari topib berganlarga mukofot taklif qilishadi. Buyumni topib, egasiga qaytarib bering va mukofotingizni oling.",
    activeCount: "Faol mukofotli e'lon",
    totalReward: "Umumiy mukofot summasi",
    safetyNote: "Mukofotni faqat buyum egasi bilan bevosita, ochiq va xavfsiz joyda uchrashib oling.",
    emptyTitle: "Hozircha mukofotli e'lon yo'q",
    emptyBody: "Yo'qolgan buyumingizga mukofot taklif qilsangiz, u shu yerda ko'rinadi.",
  },

  login: {
    title: "Xush",
    titleHighlight: "kelibsiz",
    subtitle: "Davom etish uchun Google hisobingiz bilan kiring.",
    blockedError: "Hisobingiz bloklangan. Savollar bo'lsa, qo'llab-quvvatlash bilan bog'laning.",
    genericError: "Google bilan kirishda xatolik yuz berdi. Qayta urinib ko'ring.",
    googleButton: "Google orqali kirish",
  },

  languageSwitcher: {
    label: "Tilni tanlash",
  },
};

export default uz;
