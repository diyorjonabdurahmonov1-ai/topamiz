import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { getCurrentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/messages";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Topamiz — Yo'qolgan buyumni topish platformasi",
  description:
    "Topamiz — yo'qolgan yoki topilgan buyumlar uchun e'lon platformasi. AI yordamida moslashtirish, mukofotli e'lonlar va reklama taxtachasi.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Topamiz",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
