import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleanroom Products | Biosafety Cabinets, LAF, Pass Boxes | Radiant Rays Pvt. Ltd.",
  description: "Browse Radiant Rays' full catalog of premium-grade cleanroom equipment — biosafety cabinets, laminar air flow workstations, pass boxes, air showers, and modular furniture. B2B & B2C.",
  alternates: { canonical: "https://radiantraysindia.com/products" },
  openGraph: {
    title: "Cleanroom Products | Radiant Rays Pvt. Ltd.",
    description: "Premium-grade cleanroom equipment — biosafety cabinets, LAF workstations, pass boxes, air showers.",
    url: "https://radiantraysindia.com/products",
    type: "website",
    siteName: "Radiant Rays Pvt. Ltd.",
    images: [{ url: "https://radiantraysindia.com/logo.jpeg", width: 2024, height: 777, alt: "Radiant Rays Pvt. Ltd." }],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
