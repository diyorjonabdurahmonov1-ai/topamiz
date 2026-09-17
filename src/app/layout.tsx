import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
