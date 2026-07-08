import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery | Radiant Rays Pvt. Ltd.",
  description: "View our cleanroom installations, premium-grade biosafety cabinets, laminar air flow workstations, and modular cleanroom projects across India.",
  alternates: { canonical: "https://radiantraysindia.com/gallery" },
  openGraph: {
    title: "Cleanroom Project Gallery | Radiant Rays Pvt. Ltd.",
    description: "Photo gallery of Radiant Rays cleanroom installations and equipment.",
    url: "https://radiantraysindia.com/gallery",
    type: "website",
    siteName: "Radiant Rays Pvt. Ltd.",
    images: [{ url: "https://radiantraysindia.com/logo.jpeg", width: 2024, height: 777, alt: "Radiant Rays Pvt. Ltd." }],
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
