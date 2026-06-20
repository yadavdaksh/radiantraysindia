import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers | Radiant Rays Pvt. Ltd.",
  description: "Join Radiant Rays — we're hiring engineers, technicians, and sales professionals to build India's best cleanroom equipment. View open positions.",
  alternates: { canonical: "https://radiantraysindia.com/careers" },
  openGraph: {
    title: "Careers at Radiant Rays Pvt. Ltd.",
    description: "Explore job opportunities at Radiant Rays — cleanroom equipment manufacturer.",
    url: "https://radiantraysindia.com/careers",
    type: "website",
    siteName: "Radiant Rays Pvt. Ltd.",
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
