import type { Ad, Category, Listing } from "./types";

export const categories: Category[] = [
  { id: "hujjatlar", label: "Hujjatlar", icon: "IdCard" },
  { id: "texnika", label: "Telefon va texnika", icon: "Smartphone" },
  { id: "sumka", label: "Sumka va hamyon", icon: "Briefcase" },
  { id: "hayvonlar", label: "Uy hayvonlari", icon: "PawPrint" },
  { id: "kalitlar", label: "Kalitlar", icon: "KeyRound" },
  { id: "kiyim", label: "Kiyim-kechak", icon: "Shirt" },
  { id: "boshqa", label: "Boshqa", icon: "Sparkles" },
];

export const cities: string[] = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Farg'ona",
  "Namangan",
  "Nukus",
  "Qarshi",
];

export const listings: Listing[] = [
  {
    id: "l-1001",
    kind: "lost",
    title: "Qora rangli pasport va haydovchilik guvohnomasi",
    description:
      "Chilonzor metro bekati yaqinida, avtobusda hujjatlarim solingan qora papka tushib qolgan. Ichida pasport, haydovchilik guvohnomasi va bank kartasi bor.",
    category: "hujjatlar",
    city: "Toshkent",
    district: "Chilonzor",
    date: "2026-09-14",
    reward: 300000,
    contactName: "Aziz Karimov",
    contactPhone: "+998 90 123 45 67",
    status: "active",
    colorFrom: "#6366f1",
    colorTo: "#22d3ee",
    views: 482,
  },
  {
    id: "l-1002",
    kind: "found",
    title: "iPhone 13, ko'k rangli, ekran himoyasi bilan",
    description:
      "Amir Temur xiyoboni skverida skameykada topildi. Qulf ekrani ochilmagan, ega bo'lsa tasvirini yuborib tasdiqlashi kerak.",
    category: "texnika",
    city: "Toshkent",
    district: "Yunusobod",
    date: "2026-09-15",
    contactName: "Dilnoza Yusupova",
    contactPhone: "+998 91 234 56 78",
    status: "active",
    colorFrom: "#0ea5e9",
    colorTo: "#22d3ee",
    views: 915,
  },
  {
    id: "l-1003",
    kind: "lost",
    title: "Jasur ismli oq-jigarrang uy mushugi",
    description:
      "Bizning mushugimiz Jasur balkondan chiqib ketgan, bo'ynida qizil ipdan qilingan taqinchoq bor, juda quvnoq va odamlarga o'rganib qolgan.",
    category: "hayvonlar",
    city: "Samarqand",
    district: "Markaziy",
    date: "2026-09-12",
    reward: 500000,
    contactName: "Malika Tosheva",
    contactPhone: "+998 93 345 67 89",
    status: "active",
    colorFrom: "#f59e0b",
    colorTo: "#f97316",
    views: 1204,
  },
  {
    id: "l-1004",
    kind: "found",
    title: "Qora charm hamyon, ichida naqd pul va kartalar",
    description:
      "Bozor hududida yerda yotgan hamyon topildi. Ichida bir nechta bank kartasi va shaxsiy hujjat bor, ega bo'lsa politsiya orqali yoki to'g'ridan-to'g'ri bog'lanishi mumkin.",
    category: "sumka",
    city: "Buxoro",
    date: "2026-09-13",
    contactName: "Sardor Aliyev",
    contactPhone: "+998 94 456 78 90",
    status: "active",
    colorFrom: "#a855f7",
    colorTo: "#6366f1",
    views: 356,
  },
  {
    id: "l-1005",
    kind: "lost",
    title: "Mashina kalitlari, Chevrolet belgisi bilan",
    description:
      "Ikkita kalit ulangan, biri mashina uchun, ikkinchisi kvartira eshigi uchun. Katta bozor atrofida yo'qotilgan.",
    category: "kalitlar",
    city: "Andijon",
    date: "2026-09-10",
    reward: 150000,
    contactName: "Bekzod Nazarov",
    contactPhone: "+998 95 567 89 01",
    status: "active",
    colorFrom: "#22c55e",
    colorTo: "#16a34a",
    views: 210,
  },
  {
    id: "l-1006",
    kind: "found",
    title: "Bolalar uchun sariq velosiped",
    description:
      "Hovli oldida ostona yaqinida turgan kichik sariq velosiped topildi, egasi tasvirlab bersa qaytariladi.",
    category: "boshqa",
    city: "Namangan",
    date: "2026-09-09",
    contactName: "Nodira Rashidova",
    contactPhone: "+998 97 678 90 12",
    status: "resolved",
    colorFrom: "#eab308",
    colorTo: "#f59e0b",
    views: 128,
  },
  {
    id: "l-1007",
    kind: "lost",
    title: "Ko'k rangli sport kurtka, orqasida raqam bor",
    description:
      "Stadion yaqinida sport zali kiyinish xonasida qoldirilgan bo'lishi mumkin, kurtkaning ichki cho'ntagida talaba bileti bor.",
    category: "kiyim",
    city: "Farg'ona",
    date: "2026-09-08",
    contactName: "Ulug'bek Qodirov",
    contactPhone: "+998 99 789 01 23",
    status: "active",
    colorFrom: "#0ea5e9",
    colorTo: "#6366f1",
    views: 97,
  },
  {
    id: "l-1008",
    kind: "found",
    title: "Samsung planshet, jigarrang g'ilof bilan",
    description:
      "Kutubxona o'qish zalida stol ustida qoldirilgan planshet topildi. Xavfsizlik xonasida saqlanmoqda.",
    category: "texnika",
    city: "Toshkent",
    district: "Mirzo Ulug'bek",
    date: "2026-09-07",
    contactName: "Kamola Sattorova",
    contactPhone: "+998 90 890 12 34",
    status: "active",
    colorFrom: "#6366f1",
    colorTo: "#a855f7",
    views: 274,
  },
  {
    id: "l-1009",
    kind: "lost",
    title: "Oltin rangli uzuk, ichiga ism yozilgan",
    description:
      "To'y marosimidan qaytishda mehmonxona hovlisida tushib qolgan bo'lishi mumkin. Uzuk ichiga \"M & A\" harflari yozilgan, juda qadrli xotira.",
    category: "boshqa",
    city: "Toshkent",
    district: "Shayxontohur",
    date: "2026-09-16",
    reward: 1000000,
    contactName: "Munisa Ergasheva",
    contactPhone: "+998 93 901 23 45",
    status: "active",
    colorFrom: "#f5a524",
    colorTo: "#fbbf24",
    views: 641,
  },
  {
    id: "l-1010",
    kind: "found",
    title: "Kumush rangli AirPods, futlyari bilan",
    description:
      "Universitet oshxonasi yonidagi skameykada topildi, futlyarida kichik chizilgan belgisi bor.",
    category: "texnika",
    city: "Samarqand",
    date: "2026-09-11",
    contactName: "Javlon Mirzayev",
    contactPhone: "+998 91 012 34 56",
    status: "active",
    colorFrom: "#22d3ee",
    colorTo: "#0ea5e9",
    views: 189,
  },
  {
    id: "l-1011",
    kind: "lost",
    title: "Jigarrang ryukzak, noutbuk va daftarlar bilan",
    description:
      "Elektron poyezdda yoki bekatda qoldirilgan bo'lishi mumkin. Ichida ish noutbuki va muhim hujjatlar bor, mukofot beriladi.",
    category: "sumka",
    city: "Toshkent",
    district: "Mirobod",
    date: "2026-09-15",
    reward: 400000,
    contactName: "Sherzod Yoldashev",
    contactPhone: "+998 94 123 45 67",
    status: "active",
    colorFrom: "#7c3aed",
    colorTo: "#22d3ee",
    views: 523,
  },
  {
    id: "l-1012",
    kind: "lost",
    title: "Kichik oq kuchukcha, quloqlari uzun",
    description:
      "Bog' aylanasida sayr paytida yo'qolgan, juda qo'rqoq va begonalardan yashiradi, iltimos ko'rgan bo'lsangiz xabar bering.",
    category: "hayvonlar",
    city: "Qarshi",
    date: "2026-09-16",
    reward: 250000,
    contactName: "Zilola Ahmedova",
    contactPhone: "+998 95 234 56 78",
    status: "active",
    colorFrom: "#f97316",
    colorTo: "#f5a524",
    views: 334,
  },
];

export const ads: Ad[] = [
  {
    id: "ad-1",
    title: "SecureTag — buyumingizga QR yorliq",
    subtitle: "Har qanday buyumga yopishtiring, topgan odam bir zumda sizga bog'lanadi.",
    cta: "Buyurtma berish",
    href: "#",
    colorFrom: "#6366f1",
    colorTo: "#22d3ee",
    badge: "Sponsor",
  },
  {
    id: "ad-2",
    title: "PetChip klinikasi",
    subtitle: "Uy hayvoningizni chip bilan belgilang, yo'qotib qo'ymang.",
    cta: "Batafsil",
    href: "#",
    colorFrom: "#f59e0b",
    colorTo: "#f97316",
    badge: "Reklama",
  },
  {
    id: "ad-3",
    title: "Topamiz Biznes",
    subtitle: "Do'koningiz yoki xizmatingizni shu yerda minglab foydalanuvchiga ko'rsating.",
    cta: "Reklama joylashtirish",
    href: "/reklama",
    colorFrom: "#a855f7",
    colorTo: "#6366f1",
    badge: "Bizning taklif",
  },
];

export function getListingById(id: string): Listing | undefined {
  return listings.find((l) => l.id === id);
}

export function getRewardedListings(): Listing[] {
  return listings
    .filter((l) => l.status === "active" && typeof l.reward === "number")
    .sort((a, b) => (b.reward ?? 0) - (a.reward ?? 0));
}

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

// Intl.NumberFormat/DateTimeFormat("uz-UZ") render inconsistently between the
// server and browser ICU data, which breaks hydration — format manually instead.
export function formatSom(amount: number): string {
  const grouped = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} so'm`;
}

export function formatDate(iso: string): string {
  // Parsed as UTC midnight since these are date-only strings; read back with
  // the UTC getters so the result doesn't shift with the viewer's timezone.
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${day}-${UZ_MONTHS[date.getUTCMonth()]}`;
}
