import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://pitchmint.novamintnetworks.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/onboarding/",
          "/sequences/",
          "/prospects/",
          "/analytics/",
          "/billing/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
