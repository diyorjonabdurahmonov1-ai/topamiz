import type { CategoryId } from "@/lib/types";
import type { Dictionary } from "../types";

const en: Dictionary = {
  categories: {
    hujjatlar: "Documents",
    texnika: "Phones & electronics",
    sumka: "Bags & wallets",
    hayvonlar: "Pets",
    kalitlar: "Keys",
    kiyim: "Clothing",
    boshqa: "Other",
  } satisfies Record<CategoryId, string>,

  common: {
    lost: "Lost",
    found: "Found",
    resolved: "Resolved",
    loading: "Loading...",
    rewardSuffix: "reward",
    previous: "Previous",
    next: "Next",
  },

  nav: {
    listings: "Listings",
    rewarded: "Rewarded",
    ads: "Ads",
    messages: "Messages",
    login: "Log in",
    postListing: "Post a listing",
    createQr: "Create QR tag",
    menu: "Menu",
  },

  footer: {
    tagline:
      "An Uzbekistan platform that makes it easy to find lost items and return found ones to their owners.",
    sectionsHeading: "Sections",
    lostItems: "Lost items",
    foundItems: "Found items",
    rewardedListings: "Rewarded listings",
    adBoard: "Ad board",
    categoriesHeading: "Categories",
    helpHeading: "Help",
    howToPost: "How do I post a listing?",
    safetyRules: "Safety rules",
    termsOfUse: "Terms of use",
    madeIn: "Made in Uzbekistan, with care ❖.",
  },

  bottomNav: {
    home: "Home",
    listings: "Listings",
    mark: "Tag",
    messages: "Messages",
    profile: "Profile",
    login: "Log in",
  },

  tabs: {
    lost: "Lost",
    found: "Found",
    rewarded: "Rewarded",
    viewAll: "View all",
    itemsSuffix: "items",
    emptyTitle: "No listings yet",
    emptyBody: "No one has posted a listing in this section yet.",
    selectPrompt: "Choose one of the sections above to see listings",
  },

  listingsPage: {
    title: "Lost and found",
    titleHighlight: "listings",
    subtitle: "Browse, search, and filter all listings.",
    searchPlaceholder: "Search: document, phone, cat...",
    filters: "Filters",
    kindAll: "All",
    categoryLabel: "Category",
    allCategories: "All categories",
    cityLabel: "City",
    allCities: "All cities",
    clearFilters: "Clear filters",
    noResultsTitle: "Nothing found",
    noResultsBody: "Try a different keyword or clear the filters and try again.",
  },

  listingCard: {
    resolved: "Resolved ✓",
  },

  listingDetail: {
    backLink: "All listings",
    descriptionLabel: "Description",
  },

  contactCard: {
    verifiedUser: "Verified user",
    showPhone: "Show phone number",
    safetyNote: "For your safety, arrange to meet in a public place.",
  },

  reportButton: {
    report: "Report",
    sent: "Report submitted",
    reasonPlaceholder: "Reason (optional)",
    send: "Send",
    genericError: "Something went wrong",
  },

  aiMatches: {
    title: "AI-suggested matching listings",
    reasons: {
      sameCategory: "Same category",
      sameCity: "Same city",
      similarKeywords: "Similar keywords in description",
      closeDates: "Close dates",
    },
  },

  postListing: {
    pageTitlePrefix: "Post a",
    pageTitleHighlight: "new",
    pageTitleSuffix: "listing",
    pageSubtitle: "Post a listing in a couple of minutes.",
    itemTypeHeading: "Item type",
    lostOption: "I lost an item",
    foundOption: "I found an item",
    mainInfoHeading: "Basic information",
    titleLabel: "Title *",
    titlePlaceholder: "E.g.: Black wallet",
    descriptionLabel: "Description *",
    descriptionPlaceholder: "What the item looks like, where and when it was lost/found...",
    categoryLabel: "Category",
    cityLabel: "City",
    photosHeading: "Add photos",
    rewardHeading: "Offer a reward (optional)",
    rewardHint: "Offering a reward helps your item get found faster.",
    rewardPlaceholder: "E.g.: 200000",
    contactHeading: "Contact details",
    nameLabel: "Your name *",
    namePlaceholder: "First and last name",
    phoneLabel: "Phone number *",
    phonePlaceholder: "+998 90 123 45 67",
    requiredFieldsError: "Please fill in all fields marked with *.",
    genericError: "Something went wrong",
    submitting: "Posting...",
    submit: "Post listing",
    successTitle: "Listing posted successfully!",
    successKindLost: "lost",
    successKindFound: "found",
    postAnother: "Post another listing",
    viewAllListings: "View all listings",
  },

  rewarded: {
    title: "Rewarded listings",
    subtitle:
      "Owners of these items are offering a reward to whoever finds them. Find the item, return it to its owner, and claim your reward.",
    activeCount: "Active rewarded listings",
    totalReward: "Total reward amount",
    safetyNote: "Only collect a reward by meeting the owner in person, in an open, safe place.",
    emptyTitle: "No rewarded listings yet",
    emptyBody: "If you offer a reward for a lost item, it will appear here.",
  },

  login: {
    title: "Welcome",
    titleHighlight: "back",
    subtitle: "Sign in with your Google account to continue.",
    blockedError: "Your account has been blocked. Contact support if you have questions.",
    genericError: "Something went wrong signing in with Google. Please try again.",
    googleButton: "Continue with Google",
  },

  languageSwitcher: {
    label: "Choose language",
  },
};

export default en;
