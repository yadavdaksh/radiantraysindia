import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Radiant Rays Pvt. Ltd.",
  description: "Get in touch with Radiant Rays for cleanroom equipment quotes, technical support, or custom solutions. Call +91 92117 81378 or email info@radiantraysindia.com.",
  alternates: { canonical: "https://radiantraysindia.com/contact" },
  openGraph: {
    title: "Contact Radiant Rays Pvt. Ltd.",
    description: "Reach our sales and technical team for cleanroom equipment quotes and support.",
    url: "https://radiantraysindia.com/contact",
    type: "website",
    siteName: "Radiant Rays Pvt. Ltd.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
