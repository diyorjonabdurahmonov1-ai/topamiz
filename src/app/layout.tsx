import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { getCurrentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/messages";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const TITLE = `${SITE_NAME} — Yo'qolgan buyumni topish platformasi`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Every page already sets its own full "X — Topamiz" string, so this is
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
    "Topamiz",
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

  return (
    <html lang="uz" className={`${manrope.variable} dark`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            var t = localStorage.getItem('topamiz-theme');
            if (t === 'light') document.documentElement.classList.remove('dark');
            else document.documentElement.classList.add('dark');
          } catch (e) {}`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-bg text-foreground antialiased selection:bg-brand-via/30">
        <Navbar user={user} unreadCount={unreadCount} />
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
        <div className="hidden sm:block">
          <Footer />
        </div>
        <BottomNav user={user} unreadCount={unreadCount} />
      </body>
    </html>
  );
}
