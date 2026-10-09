import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import VideoUploadIndicator from "@/components/VideoUploadIndicator";
import AppChrome from "@/components/AppChrome";
import Analytics from "@/components/Analytics";
import { getCurrentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/messages";
import { unreadNotificationCount } from "@/lib/notifications";
import NotificationCenter from "@/components/NotificationCenter";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const TITLE = `${SITE_NAME} — Yo'qolgan buyumni topish platformasi`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Every page already sets its own full "X — Findo" string, so this is
  // only a fallback for a future page that doesn't — deliberately no
  // `title.template`, since Next.js applies a template to a child's plain
  // string title too and would double-suffix all of them.
  title: TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "yo'qolgan buyum",
    "topilgan buyum",
    "e'lon",
    "QR belgi",
    "O'zbekiston",
    "Toshkent",
    "Findo",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const unreadCount = user ? unreadTotal(user.id) : 0;
  const notificationCount = user ? unreadNotificationCount(user.id) : 0;
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html lang={locale} className={`${manrope.variable} dark`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            var t = localStorage.getItem('topamiz-theme');
            if (t === 'light') document.documentElement.classList.remove('dark');
            else document.documentElement.classList.add('dark');
          } catch (e) {}`}
        </Script>
        <Analytics />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-foreground antialiased selection:bg-brand-via/30">
        <AppChrome
          navbar={<Navbar user={user} unreadCount={unreadCount} notificationCount={notificationCount} locale={locale} dict={dict} />}
          footer={<Footer dict={dict} locale={locale} />}
          bottomNav={<BottomNav user={user} unreadCount={unreadCount} dict={dict} />}
        >
          {children}
        </AppChrome>
        <VideoUploadIndicator dict={dict} />
        {user && (
          <NotificationCenter dict={dict} initialCounts={{ messages: unreadCount, notifications: notificationCount }} />
        )}
      </body>
    </html>
  );
}
