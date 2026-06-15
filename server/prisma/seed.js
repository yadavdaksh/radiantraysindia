import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";

async function main() {
  console.log("🌱 Seeding Radiant Rays database...");

  // ── 1. Roles & Permissions ────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN", label: "Super Administrator", description: "Full system access" },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "MANAGER" },
    update: {},
    create: { name: "MANAGER", label: "Manager", description: "Catalog and order management" },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "EDITOR" },
    update: {},
    create: { name: "EDITOR", label: "Editor", description: "Content and catalog editing" },
  });

  // Permissions
  const permDefs = [
    ["product", "read"], ["product", "create"], ["product", "update"], ["product", "delete"],
    ["category", "read"], ["category", "create"], ["category", "update"], ["category", "delete"],
    ["subcategory", "read"], ["subcategory", "create"], ["subcategory", "update"], ["subcategory", "delete"],
    ["industry", "read"], ["industry", "create"], ["industry", "update"], ["industry", "delete"],
    ["order", "read"], ["order", "update"],
    ["lead", "read"], ["lead", "update"],
    ["customer", "read"],
    ["coupon", "read"], ["coupon", "create"], ["coupon", "update"], ["coupon", "delete"],
    ["gallery", "read"], ["gallery", "create"], ["gallery", "update"], ["gallery", "delete"],
    ["testimonial", "read"], ["testimonial", "create"], ["testimonial", "update"], ["testimonial", "delete"],
    ["setting", "read"], ["setting", "update"],
    ["user", "read"], ["user", "create"], ["user", "update"], ["user", "delete"],
    ["role", "read"], ["role", "create"], ["role", "update"], ["role", "delete"],
    ["permission", "read"],
    ["dashboard", "read"],
    ["activity", "read"],
    ["email", "read"],
    ["banner", "read"], ["banner", "create"], ["banner", "update"], ["banner", "delete"],
  ];

  const perms = [];
  for (const [resource, action] of permDefs) {
    const p = await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action, description: `${resource}:${action}` },
    });
    perms.push(p);
  }

  // Assign all permissions to MANAGER
  await prisma.rolePermission.deleteMany({ where: { roleId: managerRole.id } });
  await prisma.rolePermission.createMany({
    data: perms.map((p) => ({ roleId: managerRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // EDITOR gets catalog + content only
  const editorPerms = perms.filter((p) =>
    ["product", "category", "subcategory", "gallery", "testimonial", "banner", "dashboard"].includes(p.resource)
  );
  await prisma.rolePermission.deleteMany({ where: { roleId: editorRole.id } });
  await prisma.rolePermission.createMany({
    data: editorPerms.map((p) => ({ roleId: editorRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // ── 2. Super Admin user ───────────────────────────────────────
  const adminExists = await prisma.user.findUnique({ where: { email: "admin@radiantraysindia.com" } });
  if (!adminExists) {
    const hashed = await bcrypt.hash("Admin@1234", 12);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@radiantraysindia.com",
        password: hashed,
        roleId: superAdminRole.id,
      },
    });
    console.log("✅ Super Admin: admin@radiantraysindia.com / Admin@1234");
  } else {
    console.log("⏭  Super Admin already exists");
  }

  // ── 3. Categories & Subcategories ────────────────────────────
  const categoryData = [
    {
      name: "Biosafety Cabinets",
      slug: "biosafety-cabinets",
      description: "HEPA filtered containment cabinets for laboratory and pharmaceutical workflows.",
      order: 1,
      subs: ["Class II A2", "Class I", "Class III", "PCR Cabinets"],
    },
    {
      name: "Laminar Air Flow",
      slug: "laminar-air-flow",
      description: "Sterile work zones with controlled HEPA filtered airflow for critical preparation tasks.",
      order: 2,
      subs: ["Vertical LAF", "Horizontal LAF", "Clean Bench", "Ductless Fume Hood"],
    },
    {
      name: "Pass Boxes",
      slug: "pass-boxes",
      description: "Material transfer chambers for reducing contamination between cleanroom zones.",
      order: 3,
      subs: ["Static Pass Box", "Dynamic Pass Box", "UV Pass Box", "Interlock Pass Box"],
    },
    {
      name: "Air Showers",
      slug: "air-showers",
      description: "Personnel decontamination chambers before entering controlled cleanroom environments.",
      order: 4,
      subs: ["Single Blower", "Dual Blower", "Tunnel Type", "Corner Type"],
    },
    {
      name: "Cleanroom Furniture",
      slug: "cleanroom-furniture",
      description: "Stainless steel modular furniture designed for cleanroom compliance.",
      order: 5,
      subs: ["Work Tables", "Storage Cabinets", "Garment Racks", "Trolleys & Carts"],
    },
    {
      name: "HEPA Filter Units",
      slug: "hepa-filter-units",
      description: "High efficiency particulate air filtration systems for cleanroom installations.",
      order: 6,
      subs: ["Fan Filter Units", "HEPA Modules", "Terminal HEPA Boxes"],
    },
  ];

  for (const cat of categoryData) {
    const { subs, ...catData } = cat;
    const category = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: { description: catData.description },
      create: { ...catData, isActive: true },
    });

    for (let i = 0; i < subs.length; i++) {
      const subSlug = `${catData.slug}-${subs[i].toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
      await prisma.subCategory.upsert({
        where: { slug: subSlug },
        update: {},
        create: {
          name: subs[i],
          slug: subSlug,
          categoryId: category.id,
          description: `${subs[i]} — ${catData.name} variant`,
          order: i,
          isActive: true,
        },
      });
    }
    console.log(`✅ Category: ${cat.name} (${subs.length} subcategories)`);
  }

  // ── 4. Industries ─────────────────────────────────────────────
  const industryData = [
    { name: "Pharmaceutical", slug: "pharmaceutical", description: "Drug manufacturing and regulated production lines." },
    { name: "Healthcare", slug: "healthcare", description: "Clinical environments and sterile handling needs." },
    { name: "Biotechnology", slug: "biotechnology", description: "R&D, molecular biology and bioscience workflows." },
    { name: "Research Labs", slug: "research-labs", description: "Precision workspaces for experimentation and development." },
    { name: "Hospitals", slug: "hospitals", description: "Treatment, diagnostics and secure sample handling." },
    { name: "Electronics", slug: "electronics", description: "ESD-conscious and contamination-sensitive assembly." },
    { name: "Food Processing", slug: "food-processing", description: "Clean environments for food safety compliance." },
    { name: "Aerospace", slug: "aerospace", description: "Precision manufacturing in contamination-controlled zones." },
  ];

  for (const ind of industryData) {
    await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: {},
      create: { ...ind, isActive: true },
    });
  }
  console.log(`✅ Industries: ${industryData.length} created`);

  // ── 5. Products ───────────────────────────────────────────────
  const biosafetyCat = await prisma.category.findUnique({ where: { slug: "biosafety-cabinets" } });
  const laminarCat = await prisma.category.findUnique({ where: { slug: "laminar-air-flow" } });
  const passBoxCat = await prisma.category.findUnique({ where: { slug: "pass-boxes" } });
  const furnitureCat = await prisma.category.findUnique({ where: { slug: "cleanroom-furniture" } });
  const airShowerCat = await prisma.category.findUnique({ where: { slug: "air-showers" } });

  const pharmaInd = await prisma.industry.findUnique({ where: { slug: "pharmaceutical" } });
  const bioInd = await prisma.industry.findUnique({ where: { slug: "biotechnology" } });
  const healthInd = await prisma.industry.findUnique({ where: { slug: "healthcare" } });

  const productData = [
    {
      name: "Biosafety Cabinet Class II A2",
      slug: "biosafety-cabinet-class-ii-a2",
      sku: "BSC-IIA2-001",
      productType: "B2B",
      shortDescription: "HEPA filtered containment cabinet for laboratory and pharmaceutical workflows.",
      description: "A Class II A2 biosafety cabinet providing personnel, product, and environmental protection. Features front access sash control, HEPA supply and exhaust filtration, low-noise airflow design, and stainless steel working surface. Suitable for pharma and biotech regulated environments.",
      featured: true,
      isActive: true,
      categoryId: biosafetyCat?.id,
      industryIds: [pharmaInd?.id, bioInd?.id].filter(Boolean),
      variants: [
        { name: "2 Feet", price: null, stock: 8, isDefault: true, specification: { Width: "600mm", Depth: "750mm", Height: "1530mm", Airflow: "0.38 m/s" } },
        { name: "3 Feet", price: null, stock: 6, isDefault: false, specification: { Width: "900mm", Depth: "750mm", Height: "1530mm", Airflow: "0.38 m/s" } },
        { name: "4 Feet", price: null, stock: 4, isDefault: false, specification: { Width: "1200mm", Depth: "750mm", Height: "1530mm", Airflow: "0.38 m/s" } },
        { name: "6 Feet", price: null, stock: 2, isDefault: false, specification: { Width: "1800mm", Depth: "750mm", Height: "1530mm", Airflow: "0.38 m/s" } },
      ],
    },
    {
      name: "Laminar Air Flow Workstation — Vertical",
      slug: "laminar-air-flow-vertical",
      sku: "LAF-VRT-002",
      productType: "B2B",
      shortDescription: "Sterile work zone with controlled vertical HEPA filtered airflow.",
      description: "A vertical laminar flow workstation designed for product protection and particulate reduction in cleanroom workspaces. Features HEPA H14 filtration, illuminated work area, and powder-coated industrial frame. Suitable for sterile compounding and electronics assembly.",
      featured: true,
      isActive: true,
      categoryId: laminarCat?.id,
      industryIds: [pharmaInd?.id, bioInd?.id].filter(Boolean),
      variants: [
        { name: "2×2 Feet", price: null, stock: 10, isDefault: true, specification: { "Work Area": "600×600mm", HEPA: "H14", Noise: "<62dB" } },
        { name: "3×2 Feet", price: null, stock: 8, isDefault: false, specification: { "Work Area": "900×600mm", HEPA: "H14", Noise: "<62dB" } },
        { name: "4×2 Feet", price: null, stock: 5, isDefault: false, specification: { "Work Area": "1200×600mm", HEPA: "H14", Noise: "<62dB" } },
      ],
    },
    {
      name: "Static Pass Box — SS 304",
      slug: "static-pass-box-ss304",
      sku: "PBX-STA-003",
      productType: "B2B",
      shortDescription: "Material transfer chamber for reducing contamination between cleanroom zones.",
      description: "Static pass box with interlocked doors for safe movement of materials between controlled environments. SS 304 internal finish, UV decontamination option, wall-mounted integration. Suitable for pharmaceutical plants and aseptic transfer.",
      featured: true,
      isActive: true,
      categoryId: passBoxCat?.id,
      industryIds: [pharmaInd?.id, healthInd?.id].filter(Boolean),
      variants: [
        { name: '12"×12"×12"', price: null, stock: 15, isDefault: true, specification: { Material: "SS 304", Interlock: "Mechanical", UV: "Optional" } },
        { name: '18"×18"×18"', price: null, stock: 10, isDefault: false, specification: { Material: "SS 304", Interlock: "Mechanical", UV: "Optional" } },
        { name: '24"×24"×24"', price: null, stock: 6, isDefault: false, specification: { Material: "SS 304", Interlock: "Electromagnetic", UV: "Included" } },
      ],
    },
    {
      name: "Dynamic Pass Box with HEPA Filter",
      slug: "dynamic-pass-box-hepa",
      sku: "PBX-DYN-004",
      productType: "B2B",
      shortDescription: "Active HEPA filtered pass box for high-grade contamination control.",
      description: "Dynamic pass box with integrated HEPA filter and blower for active air purging during material transfer. Provides ISO Class 5 conditions inside the chamber. Essential for aseptic pharmaceutical manufacturing.",
      featured: false,
      isActive: true,
      categoryId: passBoxCat?.id,
      industryIds: [pharmaInd?.id].filter(Boolean),
      variants: [
        { name: "Standard", price: null, stock: 8, isDefault: true, specification: { Material: "SS 316", Filter: "HEPA H14", Class: "ISO 5" } },
        { name: "Large", price: null, stock: 4, isDefault: false, specification: { Material: "SS 316", Filter: "HEPA H14", Class: "ISO 5" } },
      ],
    },
    {
      name: "Cleanroom Storage Cabinet — SS 304",
      slug: "cleanroom-storage-cabinet-ss304",
      sku: "FRN-CAB-005",
      productType: "B2C",
      basePrice: 18500,
      salePrice: 16500,
      badge: "SALE",
      shortDescription: "Rust-resistant SS 304 storage cabinet for cleanroom garments and accessories.",
      description: "Durable stainless steel storage cabinet for cleanroom operations. Features rust-resistant finish, easy wipe surfaces, and modular shelving. Available in single and double door configurations. Direct purchase with pan-India shipping.",
      featured: true,
      isActive: true,
      categoryId: furnitureCat?.id,
      industryIds: [pharmaInd?.id, healthInd?.id].filter(Boolean),
      variants: [
        { name: "Single Door 4ft", price: 16500, stock: 20, isDefault: true, specification: { Height: "1200mm", Width: "600mm", Material: "SS 304" } },
        { name: "Double Door 6ft", price: 24500, stock: 12, isDefault: false, specification: { Height: "1800mm", Width: "900mm", Material: "SS 304" } },
      ],
    },
    {
      name: "Cleanroom Work Table — Heavy Duty",
      slug: "cleanroom-work-table-heavy-duty",
      sku: "FRN-TBL-006",
      productType: "B2C",
      basePrice: 12000,
      badge: "NEW",
      shortDescription: "Heavy-duty SS 304 work table with adjustable height for cleanroom environments.",
      description: "Professional cleanroom work table constructed from SS 304 stainless steel. Features adjustable leg height, anti-static options available, and easy-clean surface. Suitable for pharmaceutical and electronics cleanrooms.",
      featured: true,
      isActive: true,
      categoryId: furnitureCat?.id,
      industryIds: [pharmaInd?.id, bioInd?.id].filter(Boolean),
      variants: [
        { name: '4ft × 2ft', price: 12000, stock: 25, isDefault: true, specification: { Length: "1200mm", Width: "600mm", Material: "SS 304" } },
        { name: '6ft × 2ft', price: 16000, stock: 15, isDefault: false, specification: { Length: "1800mm", Width: "600mm", Material: "SS 304" } },
        { name: '8ft × 2.5ft', price: 21000, stock: 8, isDefault: false, specification: { Length: "2400mm", Width: "750mm", Material: "SS 304" } },
      ],
    },
    {
      name: "Air Shower Unit — Single Blower",
      slug: "air-shower-single-blower",
      sku: "ASH-SGL-007",
      productType: "B2B",
      shortDescription: "Personnel decontamination air shower before cleanroom entry.",
      description: "Single blower air shower unit for personnel and material decontamination before entering ISO classified cleanrooms. High-velocity air jets remove particulates from clothing and equipment. SS 304 construction with interlock doors.",
      featured: false,
      isActive: true,
      categoryId: airShowerCat?.id,
      industryIds: [pharmaInd?.id, bioInd?.id].filter(Boolean),
      variants: [
        { name: "Single Person", price: null, stock: 5, isDefault: true, specification: { Capacity: "1 person", Material: "SS 304", "Air Jets": "16 nozzles" } },
        { name: "Double Person", price: null, stock: 3, isDefault: false, specification: { Capacity: "2 persons", Material: "SS 304", "Air Jets": "24 nozzles" } },
      ],
    },
    {
      name: "Laminar Air Flow — Horizontal",
      slug: "laminar-air-flow-horizontal",
      sku: "LAF-HRZ-008",
      productType: "B2B",
      shortDescription: "Horizontal laminar flow clean bench for product protection in sterile preparation.",
      description: "Horizontal laminar flow workstation providing ISO Class 5 conditions for product protection. Features HEPA H13 filtration, stainless steel work surface, and adjustable air velocity control. Widely used in pharmaceutical compounding and microelectronics.",
      featured: false,
      isActive: true,
      categoryId: laminarCat?.id,
      industryIds: [pharmaInd?.id, bioInd?.id].filter(Boolean),
      variants: [
        { name: "2 Feet", price: null, stock: 10, isDefault: true, specification: { Width: "600mm", HEPA: "H13", Velocity: "0.45 m/s" } },
        { name: "4 Feet", price: null, stock: 6, isDefault: false, specification: { Width: "1200mm", HEPA: "H13", Velocity: "0.45 m/s" } },
      ],
    },
  ];

  for (const p of productData) {
    const { variants, categoryId, industryIds, basePrice, salePrice, badge, ...productBase } = p;
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`⏭  Product exists: ${p.name}`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        ...productBase,
        basePrice: basePrice ? basePrice : null,
        salePrice: salePrice ? salePrice : null,
        badge: badge || null,
        productType: p.productType,
        categories: categoryId ? { create: [{ categoryId }] } : undefined,
        industries: industryIds?.length ? { create: industryIds.map((id) => ({ industryId: id })) } : undefined,
      },
    });

    for (const [i, v] of variants.entries()) {
      const varSlug = `${p.slug}-${v.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
      const existingVar = await prisma.productVariant.findFirst({ where: { productId: product.id, slug: varSlug } });
      if (existingVar) continue;
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: v.name,
          slug: varSlug,
          sku: `${p.sku}-V${i + 1}`,
          price: v.price ? v.price : null,
          stock: v.stock,
          specification: v.specification,
          isDefault: v.isDefault,
          isActive: true,
        },
      });
    }
    console.log(`✅ Product: ${p.name} (${variants.length} variants)`);
  }

  // ── 6. Testimonials ───────────────────────────────────────────
  const testimonials = [
    { name: "Dr. Priya Mehta", designation: "QA Manager", company: "Sun Pharma Ltd", rating: 5, quote: "Radiant Rays delivered exactly what we needed — ISO-compliant biosafety cabinets with exceptional finish quality and on-time delivery. Highly recommended for regulated environments." },
    { name: "Arjun Rao", designation: "Facility Head", company: "Biocon Biologics", rating: 5, quote: "Strong engineering, clean SS 304 finish, and excellent post-sales coordination. The pass boxes we ordered exceeded our GMP audit requirements." },
    { name: "Sanjay Verma", designation: "Plant Manager", company: "Cipla Manufacturing", rating: 4, quote: "Responsive quotation process and technical team. The LAF workstations were configured exactly per our room class specifications." },
    { name: "Dr. Kavitha Iyer", designation: "Research Director", company: "CCMB Hyderabad", rating: 5, quote: "We have procured multiple units over three years. Consistent quality, prompt service, and competitive pricing make them our preferred cleanroom equipment vendor." },
  ];

  for (const t of testimonials) {
    const exists = await prisma.testimonial.findFirst({ where: { name: t.name } });
    if (!exists) {
      await prisma.testimonial.create({ data: { ...t, isActive: true } });
    }
  }
  console.log(`✅ Testimonials: ${testimonials.length}`);

  // ── 7. Banners ────────────────────────────────────────────────
  const banners = [
    {
      title: "Precision Containment Systems for Sterile Environments",
      subtitle: "Radiant Rays engineers cleanroom cabinets, biosafety units, LAFs, pass boxes, and custom SS furniture for pharma and biotech.",
      linkUrl: "/products",
      sortOrder: 1,
    },
    {
      title: "GMP Compliant Cleanroom Furniture — Direct from Factory",
      subtitle: "ISO 9001:2015 certified manufacturing. Custom sizes, SS 304/316, CE compliant. Pan-India delivery.",
      linkUrl: "/categories",
      sortOrder: 2,
    },
    {
      title: "B2C Cleanroom Furniture — Shop Online",
      subtitle: "Work tables, storage cabinets, garment racks — stainless steel, ready to ship. Free delivery above ₹5,000.",
      linkUrl: "/products?type=B2C",
      sortOrder: 3,
    },
  ];

  for (const b of banners) {
    const exists = await prisma.banner.findFirst({ where: { title: b.title } });
    if (!exists) {
      await prisma.banner.create({
        data: { ...b, desktopImageUrl: "", mobileImageUrl: "", isActive: true },
      });
    }
  }
  console.log(`✅ Banners: ${banners.length}`);

  // ── 8. Gallery ────────────────────────────────────────────────
  const gallery = [
    { title: "BSC Installation — Pharma Plant Hyderabad", category: "Installations", description: "Class II A2 biosafety cabinet installation in a sterile manufacturing suite.", sortOrder: 1 },
    { title: "LAF Workstation — Research Lab Delhi", category: "Installations", description: "Vertical laminar flow workstation setup in a molecular biology research facility.", sortOrder: 2 },
    { title: "Pass Box Array — Hospital OT", category: "Projects", description: "Dynamic pass box system for operation theatre material transfer at AIIMS.", sortOrder: 3 },
    { title: "Cleanroom Furniture — Biotech Facility", category: "Manufacturing", description: "Custom SS 304 work tables and garment racks delivered to Biocon Biologics.", sortOrder: 4 },
    { title: "Air Shower — Electronics Assembly", category: "Installations", description: "Dual-blower air shower system for a semiconductor assembly cleanroom.", sortOrder: 5 },
    { title: "Factory Floor — Noida Manufacturing", category: "Manufacturing", description: "In-house fabrication and quality control floor at our Noida facility.", sortOrder: 6 },
  ];

  for (const g of gallery) {
    const exists = await prisma.gallery.findFirst({ where: { title: g.title } });
    if (!exists) {
      await prisma.gallery.create({ data: { ...g, imageUrl: "", isActive: true } });
    }
  }
  console.log(`✅ Gallery: ${gallery.length} items`);

  // ── 9. Sample Coupons ─────────────────────────────────────────
  const coupons = [
    { code: "CLEANROOM10", description: "10% off on all orders above ₹5,000", discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 5000, maxDiscount: 2000, isActive: true },
    { code: "WELCOME500", description: "₹500 flat off for first-time buyers above ₹10,000", discountType: "FLAT", discountValue: 500, minOrderValue: 10000, isActive: true },
    { code: "SUMMER20", description: "20% off on B2C furniture — max ₹3,000", discountType: "PERCENTAGE", discountValue: 20, minOrderValue: 2000, maxDiscount: 3000, isActive: true },
  ];

  for (const c of coupons) {
    const exists = await prisma.coupon.findUnique({ where: { code: c.code } });
    if (!exists) {
      await prisma.coupon.create({ data: c });
    }
  }
  console.log(`✅ Coupons: ${coupons.length}`);

  console.log("\n🎉 Seed complete!");
  console.log("   Admin: admin@radiantraysindia.com / Admin@1234");
  console.log("   Coupons: CLEANROOM10, WELCOME500, SUMMER20");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); process.exit(0); });
