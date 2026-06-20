import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleanroom Products | Biosafety Cabinets, LAF, Pass Boxes | Radiant Rays Pvt. Ltd.",
  description: "Browse Radiant Rays' full catalog of ISO-certified cleanroom equipment — biosafety cabinets, laminar air flow workstations, pass boxes, air showers, and modular furniture. B2B & B2C.",
  alternates: { canonical: "https://radiantraysindia.com/products" },
  openGraph: {
    title: "Cleanroom Products | Radiant Rays Pvt. Ltd.",
    description: "ISO 9001:2015 certified cleanroom equipment — biosafety cabinets, LAF workstations, pass boxes, air showers.",
    url: "https://radiantraysindia.com/products",
    type: "website",
    siteName: "Radiant Rays Pvt. Ltd.",
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
