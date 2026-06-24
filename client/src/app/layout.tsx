import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://radiantraysindia.com"),
  title: {
    default: "Radiant Rays",
    template: "%s | Radiant Rays",
  },
  description:
    "Radiant Rays builds cleanroom equipment, biosafety cabinets, laminar air flow systems, pass boxes and industrial contamination-control solutions.",
  keywords: [
    "Radiant Rays",
    "cleanroom equipment",
    "biosafety cabinets",
    "laminar air flow",
    "pass boxes",
    "air shower systems",
    "cleanroom furniture",
  ],
  openGraph: {
    title: "Radiant Rays",
    description:
      "Enterprise-grade cleanroom equipment and contamination-control systems for regulated industries.",
    url: "https://radiantraysindia.com",
    siteName: "Radiant Rays Pvt. Ltd.",
    type: "website",
    images: [{ url: "https://radiantraysindia.com/logo.png", width: 2024, height: 777, alt: "Radiant Rays Pvt. Ltd." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Radiant Rays",
    description:
      "Enterprise-grade cleanroom equipment and contamination-control systems for regulated industries.",
    images: ["https://radiantraysindia.com/logo.png"],
  },
  verification: {
    google: "5rpas7khMdhvoukTd9MLr1DfuPzz7tuXhIpdX3uyDgM",
  },
};

import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { GlobalShell } from "@/components/global-shell";
import { Toaster } from "sonner";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <GlobalShell>
                {children}
              </GlobalShell>
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
                toastOptions={{
                  style: { fontSize: "13px", fontWeight: "600" },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
