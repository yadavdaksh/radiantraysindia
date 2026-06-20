import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/checkout",
          "/cart",
          "/wishlist",
          "/login",
          "/register",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://radiantraysindia.com/sitemap.xml",
  };
}
