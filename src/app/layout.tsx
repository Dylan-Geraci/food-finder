import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { AuthModal } from "@/components/AuthModal";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HomePlate — Home-cooked meals near you",
  description:
    "A local marketplace for home-cooked meals: find real cooks in your neighborhood, not marketplace clutter.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-white">
        <AuthProvider>
          <Navbar />
          {/* pb clears the mobile bottom tab bar; none needed at md+ */}
          <div className="pb-16 md:pb-0">{children}</div>
          <BottomNav />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
