export type ProductType = "B2B" | "B2C";

export type ProductRecord = {
  name: string;
  slug: string;
  type: ProductType;
  category: string;
  summary: string;
  description: string;
  features: string[];
  specifications: { label: string; value: string }[];
  variants: string[];
  applications: string[];
};

export const products: ProductRecord[] = [
  {
    name: "Biosafety Cabinet Class II A2",
    slug: "biosafety-cabinet-class-ii-a2",
    type: "B2B",
    category: "Biosafety Cabinets",
    summary:
      "HEPA filtered containment cabinet for laboratory and pharmaceutical workflows.",
    description:
      "A class II A2 biosafety cabinet for personnel, product and environmental protection in regulated laboratory environments.",
    features: [
      "Front access sash control",
      "HEPA supply and exhaust filtration",
      "Low noise airflow design",
      "Stainless steel working surface",
    ],
    specifications: [
      { label: "Sizes", value: "2x2x2, 3x2x2, 4x2x2, 5x2x2, 6x2x2" },
      { label: "Installation", value: "Bench top or floor standing" },
      { label: "Sash", value: "Manual or automatic" },
    ],
    variants: ["Class I", "Class II A2", "Class III"],
    applications: ["Pharmaceutical labs", "Biotech R&D", "Hospital pathology"],
  },
  {
    name: "Laminar Air Flow System",
    slug: "laminar-air-flow-system",
    type: "B2B",
    category: "Laminar Air Flow",
    summary:
      "Sterile work zone with controlled HEPA filtered airflow for critical preparation tasks.",
    description:
      "A clean bench system designed for product protection and particulate reduction in cleanroom workspaces.",
    features: [
      "Vertical and horizontal airflow options",
      "HEPA H14 filtration",
      "Illuminated work area",
      "Powder-coated industrial frame",
    ],
    specifications: [
      { label: "Airflow", value: "Controlled laminar displacement" },
      { label: "Material", value: "SS 304 / powder coated mild steel" },
      { label: "Power", value: "Single phase industrial supply" },
    ],
    variants: ["Vertical", "Horizontal"],
    applications: ["Sterile compounding", "Electronics assembly", "Research labs"],
  },
  {
    name: "Pass Box System",
    slug: "pass-box-system",
    type: "B2B",
    category: "Pass Boxes",
    summary:
      "Material transfer chamber for reducing contamination between cleanroom zones.",
    description:
      "Static or dynamic pass boxes for safe movement of materials between controlled environments.",
    features: [
      "Interlocked doors",
      "UV and HEPA options",
      "Stainless steel internal finish",
      "Wall mounted integration",
    ],
    specifications: [
      { label: "Type", value: "Static / Dynamic" },
      { label: "Interlock", value: "Mechanical or electromagnetic" },
      { label: "Finish", value: "SS 304" },
    ],
    variants: ["Static", "Dynamic"],
    applications: ["Pharmaceutical plants", "Microelectronics", "Aseptic transfer"],
  },
  {
    name: "Cleanroom Storage Cabinet",
    slug: "cleanroom-storage-cabinet",
    type: "B2C",
    category: "Cleanroom Furniture",
    summary:
      "Practical storage cabinet for cleanroom accessories, garments and consumables.",
    description:
      "A durable storage solution for cleanroom operations with easy maintenance and professional styling.",
    features: ["Rust resistant finish", "Easy wipe surfaces", "Modular shelving"],
    specifications: [
      { label: "Use", value: "Storage and organization" },
      { label: "Material", value: "Industrial grade metal" },
      { label: "Commerce", value: "Price, cart and checkout enabled" },
    ],
    variants: ["Single door", "Double door"],
    applications: ["Production areas", "Lab support rooms", "Healthcare facilities"],
  },
];

export const categories = [
  {
    name: "Biosafety Cabinets",
    slug: "biosafety-cabinets",
    summary: "Containment systems for safe sample handling and aerosol protection.",
  },
  {
    name: "Laminar Air Flow",
    slug: "laminar-air-flow",
    summary: "HEPA filtered clean workstations for controlled environments.",
  },
  {
    name: "Pass Boxes",
    slug: "pass-boxes",
    summary: "Transfer chambers for controlled material movement.",
  },
  {
    name: "Cleanroom Furniture",
    slug: "cleanroom-furniture",
    summary: "Storage, benches and garment support solutions.",
  },
];

export const industries = [
  {
    name: "Healthcare",
    slug: "healthcare",
    summary: "Clinical environments and sterile handling needs.",
  },
  {
    name: "Pharmaceutical",
    slug: "pharmaceutical",
    summary: "Drug manufacturing and regulated production lines.",
  },
  {
    name: "Biotechnology",
    slug: "biotechnology",
    summary: "R&D, molecular biology and bioscience workflows.",
  },
  {
    name: "Research Labs",
    slug: "research-labs",
    summary: "Precision workspaces for experimentation and development.",
  },
  {
    name: "Hospitals",
    slug: "hospitals",
    summary: "Treatment, diagnostics and secure sample handling.",
  },
  {
    name: "Electronics Industry",
    slug: "electronics-industry",
    summary: "ESD conscious and contamination-sensitive assembly areas.",
  },
];

export const gallery = [
  {
    title: "Cleanroom installation",
    category: "Installations",
    description: "Precision installation for production and research environments.",
  },
  {
    title: "Manufacturing floor",
    category: "Manufacturing",
    description: "Industrial fabrication and quality inspection processes.",
  },
  {
    title: "Client handover",
    category: "Projects",
    description: "Project delivery and commissioning support.",
  },
];

export const testimonials = [
  {
    name: "Dr. Meera Shah",
    company: "Pharma Lab India",
    quote:
      "The product quality and quotation response time made the procurement process much smoother.",
  },
  {
    name: "Arjun Rao",
    company: "Biotech Facility",
    quote:
      "Strong engineering, clean finish and practical after-sales coordination.",
  },
];

export const getProductBySlug = (slug: string) =>
  products.find((product) => product.slug === slug);

export const getCategoryBySlug = (slug: string) =>
  categories.find((category) => category.slug === slug);

export const getIndustryBySlug = (slug: string) =>
  industries.find((industry) => industry.slug === slug);

export const getProductImage = (slug: string, apiImages?: { url: string }[] | any, variants?: any[]) => {
  // Product-level images first
  if (apiImages && apiImages.length > 0) {
    const primary = apiImages.find((img: any) => img.isPrimary)?.url || apiImages[0].url;
    if (primary) return primary;
  }
  // Fall back to default variant's image
  if (variants && variants.length > 0) {
    const defVar = variants.find((v: any) => v.isDefault) || variants[0];
    const varImg = defVar?.images?.find((i: any) => i.isPrimary)?.url
      || defVar?.images?.[0]?.url
      || defVar?.imageUrl;
    if (varImg) return varImg;
  }
  const cleanSlug = slug ? slug.toLowerCase().trim() : "";
  if (cleanSlug.includes("biosafety")) return "/images/products/biosafety-cabinet-class-ii-a2.png";
  if (cleanSlug.includes("laminar")) return "/images/products/laminar-air-flow-system.png";
  if (cleanSlug.includes("pass-box") || cleanSlug.includes("passbox") || cleanSlug.includes("pass")) return "/images/products/pass-box-system.png";
  if (cleanSlug.includes("storage") || cleanSlug.includes("cabinet") || cleanSlug.includes("furniture")) return "/images/products/cleanroom-storage-cabinet.png";
  return "/images/products/biosafety-cabinet-class-ii-a2.png";
};

