import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery | Radiant Rays India",
  description: "View our cleanroom installations, ISO-certified biosafety cabinets, laminar air flow workstations, and modular cleanroom projects across India.",
  alternates: { canonical: "https://radiantraysindia.com/gallery" },
  openGraph: {
    title: "Cleanroom Project Gallery | Radiant Rays India",
    description: "Photo gallery of Radiant Rays cleanroom installations and equipment.",
    url: "https://radiantraysindia.com/gallery",
    type: "website",
    siteName: "Radiant Rays India",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
