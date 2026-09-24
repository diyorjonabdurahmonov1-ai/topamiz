import type { CategoryId } from "@/lib/types";
import type { Dictionary } from "../types";

const ru: Dictionary = {
  categories: {
    hujjatlar: "Документы",
    texnika: "Телефоны и техника",
    sumka: "Сумки и кошельки",
    hayvonlar: "Домашние животные",
    kalitlar: "Ключи",
    kiyim: "Одежда",
    boshqa: "Другое",
  } satisfies Record<CategoryId, string>,

  common: {
    lost: "Потеряно",
    found: "Найдено",
    resolved: "Решено",
    loading: "Загрузка...",
    rewardSuffix: "награда",
    previous: "Назад",
    next: "Вперёд",
  },

  nav: {
    listings: "Объявления",
    rewarded: "С наградой",
    ads: "Реклама",
    messages: "Сообщения",
    login: "Войти",
    postListing: "Разместить объявление",
    createQr: "Создать QR-метку",
    menu: "Меню",
  },

  footer: {
    tagline:
      "Узбекская платформа, которая упрощает поиск потерянных вещей и возврат найденных владельцам.",
    sectionsHeading: "Разделы",
    lostItems: "Потерянные вещи",
    foundItems: "Найденные вещи",
    rewardedListings: "Объявления с наградой",
    adBoard: "Доска объявлений",
    categoriesHeading: "Категории",
    helpHeading: "Помощь",
    howToPost: "Как разместить объявление?",
    safetyRules: "Правила безопасности",
    termsOfUse: "Условия использования",
    madeIn: "Сделано в Узбекистане, с заботой ❖.",
  },

  bottomNav: {
    home: "Главная",
    listings: "Объявления",
    mark: "Метка",
    messages: "Сообщения",
    profile: "Профиль",
    login: "Войти",
  },

  tabs: {
    lost: "Потеряно",
    found: "Найдено",
    rewarded: "С наградой",
    viewAll: "Смотреть все",
    itemsSuffix: "вещи",
    emptyTitle: "Пока нет объявлений",
    emptyBody: "В этом разделе ещё никто не разместил объявление.",
    selectPrompt: "Выберите один из разделов выше, чтобы увидеть объявления",
  },

  listingsPage: {
    title: "Потерянные и найденные",
    titleHighlight: "объявления",
    subtitle: "Смотрите, ищите и фильтруйте все объявления.",
    searchPlaceholder: "Поиск: документ, телефон, кошка...",
    filters: "Фильтры",
    kindAll: "Все",
    categoryLabel: "Категория",
    allCategories: "Все категории",
    cityLabel: "Город",
    allCities: "Все города",
    clearFilters: "Сбросить фильтры",
    noResultsTitle: "Ничего не найдено",
    noResultsBody: "Попробуйте другое ключевое слово или сбросьте фильтры и повторите попытку.",
  },

  listingCard: {
    resolved: "Решено ✓",
  },

  listingDetail: {
    backLink: "Все объявления",
    descriptionLabel: "Описание",
  },

  contactCard: {
    verifiedUser: "Подтверждённый пользователь",
    showPhone: "Показать номер телефона",
    safetyNote: "В целях безопасности встречайтесь в открытом месте.",
  },

  reportButton: {
    report: "Пожаловаться",
    sent: "Жалоба принята",
    reasonPlaceholder: "Причина (необязательно)",
    send: "Отправить",
    genericError: "Произошла ошибка",
  },

  aiMatches: {
    title: "Подходящие объявления по мнению ИИ",
    reasons: {
      sameCategory: "Та же категория",
      sameCity: "Тот же город",
      similarKeywords: "Похожие ключевые слова в описании",
      closeDates: "Близкие даты",
    },
  },

  postListing: {
    pageTitlePrefix: "Разместить",
    pageTitleHighlight: "новое",
    pageTitleSuffix: "объявление",
    pageSubtitle: "Разместите объявление за пару минут.",
    itemTypeHeading: "Тип вещи",
    lostOption: "Я потерял вещь",
    foundOption: "Я нашёл вещь",
    mainInfoHeading: "Основная информация",
    titleLabel: "Заголовок *",
    titlePlaceholder: "Например: чёрный кошелёк",
    descriptionLabel: "Описание *",
    descriptionPlaceholder: "Как выглядит вещь, где и когда потеряна/найдена...",
    categoryLabel: "Категория",
    cityLabel: "Город",
    photosHeading: "Добавить фото",
    rewardHeading: "Предложить награду (необязательно)",
    rewardHint: "Награда поможет быстрее найти вашу вещь.",
    rewardPlaceholder: "Например: 200000",
    contactHeading: "Контактные данные",
    nameLabel: "Ваше имя *",
    namePlaceholder: "Имя Фамилия",
    phoneLabel: "Номер телефона *",
    phonePlaceholder: "+998 90 123 45 67",
    requiredFieldsError: "Пожалуйста, заполните все поля, отмеченные *.",
    genericError: "Произошла ошибка",
    submitting: "Публикация...",
    submit: "Разместить объявление",
    successTitle: "Объявление успешно размещено!",
    successKindLost: "потерянных",
    successKindFound: "найденных",
    postAnother: "Разместить ещё одно",
    viewAllListings: "Смотреть все объявления",
  },

  rewarded: {
    title: "Объявления с наградой",
    subtitle:
      "Владельцы этих вещей предлагают награду тем, кто их найдёт. Найдите вещь, верните владельцу и получите свою награду.",
    activeCount: "Активных объявлений с наградой",
    totalReward: "Общая сумма наград",
    safetyNote: "Получайте награду только при личной встрече с владельцем в открытом безопасном месте.",
    emptyTitle: "Пока нет объявлений с наградой",
    emptyBody: "Если вы предложите награду за потерянную вещь, она появится здесь.",
  },

  login: {
    title: "Добро",
    titleHighlight: "пожаловать",
    subtitle: "Войдите через аккаунт Google, чтобы продолжить.",
    blockedError: "Ваш аккаунт заблокирован. По вопросам обращайтесь в поддержку.",
    genericError: "Ошибка при входе через Google. Попробуйте снова.",
    googleButton: "Войти через Google",
  },

  languageSwitcher: {
    label: "Выбор языка",
  },
};

export default ru;
