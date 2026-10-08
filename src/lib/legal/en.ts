import type { LegalContent } from "./types";

const en: LegalContent = {
  "privacy": {
    "title": "Privacy Policy",
    "intro": "What data Findo collects, how it's used, and how you can delete it.",
    "sections": [
      {
        "title": "1. What data we collect",
        "body": "When you sign up with a phone number, your name, phone number and password are stored — the password is never stored as is, only in an irreversibly encrypted (hashed) form that nobody, including the site owner, can read. When you sign in with Google, your name, email and profile picture are taken from your account. When you create a listing or a QR tag, the title, description, photos, location, phone number and reward amount you enter are stored. Your messages to other users and the photos you send are stored on the site as well."
      },
      {
        "title": "2. Device and visit data",
        "body": "If the site owner has enabled them, Google Analytics and/or Yandex Metrica may collect anonymous, aggregated statistics such as which city and device you visit from and which pages you view. If you subscribe to push notifications, your browser's notification address (push endpoint) is stored — it's used only to send notifications to you."
      },
      {
        "title": "3. How we use your data",
        "body": "Your data is used only to run the service: showing your listing to other users, letting you exchange messages, and sending notifications about found and lost items. Your data is never sold to third parties or passed on to other companies for advertising."
      },
      {
        "title": "4. Third-party services",
        "body": "We use Eskiz (eskiz.uz) to send verification codes by SMS — it receives only your number and the text of the message containing the code. You can also sign in with your Google account (Google Sign-In). Maps are displayed with OpenStreetMap/CARTO tiles — those requests go from your browser directly to the map service. If the site owner has enabled them, Google Analytics and Yandex Metrica are used for anonymous visit statistics. Each service has its own privacy policy."
      },
      {
        "title": "5. How long data is kept",
        "body": "Your profile, listings and messages are kept for as long as your account is active. You can delete any single listing from your profile at any time."
      },
      {
        "title": "6. Deleting your account and data",
        "body": "You can delete your account completely at any time — this irreversibly deletes your profile, messages and QR tags (your listings stay on the site, but without an owner). You can do this from your profile page or via the link below.",
        "link": {
          "href": "/hisobni-ochirish",
          "label": "Account deletion page"
        }
      },
      {
        "title": "7. Children's privacy",
        "body": "Findo is not intended for children under 13 and does not knowingly collect their data."
      },
      {
        "title": "8. Changes to this policy",
        "body": "This privacy policy may be updated from time to time. Important changes will be announced on this page."
      },
      {
        "title": "9. Contact",
        "body": "If you have questions or requests about your data, write to info@findo.net.uz."
      }
    ]
  },
  "terms": {
    "title": "Terms of Use",
    "intro": "Please read the following terms before using the Findo platform.",
    "sections": [
      {
        "title": "1. About the platform",
        "body": "Findo (findo.net.uz) is a platform for posting and searching listings about lost and found items and contacting their owners. By using the service, you agree to the terms below."
      },
      {
        "title": "2. Registration",
        "body": "To post listings, create QR tags or message other users, you need to register — with your phone number (confirmed by an SMS code) and a password, or with your Google account. Never share your password: you are responsible for everything done through your account."
      },
      {
        "title": "3. Content of listings and messages",
        "body": "Listings, photos and messages you post must be accurate and truthful. Posting fake listings, claiming someone else's item as your own, or promising a reward for fraudulent purposes is strictly prohibited."
      },
      {
        "title": "4. Prohibited actions",
        "body": "Any listing or message that is illegal, abusive, incites violence, or aims to deceive or harass other users is prohibited. When such cases are found, the listing is removed and the account may be blocked."
      },
      {
        "title": "5. Reports and moderation",
        "body": "Users can report any listing. A listing that receives several independent reports is reviewed automatically and removed if a violation is confirmed. Findo's administration reserves the right to remove a listing or account without prior notice when necessary."
      },
      {
        "title": "6. Meetings between users",
        "body": "Findo is only a means of connecting users with each other; it does not take part in meetings, reward payments or item handovers between them and is not liable for any harm that may arise in that process. Advice on meeting safely is on the Safety Rules page."
      },
      {
        "title": "7. Personal data",
        "body": "When you register, your name and phone number are taken — or your name and email if you sign in with Google. The name, phone number and photos you enter in a listing are visible to other users, so enter only what's necessary. Your data is never sold to third parties or passed on for advertising."
      },
      {
        "title": "8. Changes to the service",
        "body": "Findo's features and these terms may be updated over time. Important changes will be announced on this page."
      },
      {
        "title": "9. Contact",
        "body": "If you have questions or suggestions, write to info@findo.net.uz."
      }
    ]
  },
  "safety": {
    "title": "Safety Rules",
    "intro": "Handing over a lost or found item always means meeting a stranger. Follow these rules to protect yourself and your belongings.",
    "rules": [
      {
        "title": "Meet only in open, busy places",
        "body": "Always arrange to hand over or receive an item in an open, well-lit, busy place (a shopping centre, a metro station, outside a police station). Never invite a stranger to your home or any other enclosed place."
      },
      {
        "title": "Don't go alone if you can help it",
        "body": "Bring a family member or friend to the meeting, or at least tell someone close to you where you're going and who you're meeting."
      },
      {
        "title": "Hand over a reward only after seeing the item",
        "body": "If a reward was promised, give it only in person, once you've confirmed the item really is yours. Being asked to transfer money to a bank card in advance can be a sign of fraud."
      },
      {
        "title": "Share personal information carefully",
        "body": "In listings and messages, share only what's needed for the meeting (name, phone number). Never send your passport number, bank card number or passwords to a stranger."
      },
      {
        "title": "Report suspicious behaviour",
        "body": "If the other person makes odd demands (payment in advance, moving to another site, etc.) or a listing looks fake, use the \"Report\" button on the listing page — our team will review it."
      },
      {
        "title": "Findo is not an intermediary",
        "body": "Findo is a platform that connects users with each other; we are not responsible for the content of listings or the outcome of meetings. All agreements and meetings are made at the users' own responsibility."
      }
    ],
    "fraudTitle": "If you run into fraud",
    "fraudBody": "If someone tries to defraud you of money or personal information, stop the conversation right away and write to {email}, or contact the police where appropriate."
  }
};

export default en;
