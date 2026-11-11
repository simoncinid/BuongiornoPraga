const buildDir=process.env.NEXT_DIST_DIR||".next";
const otherBuilds=[".next",".next-platform",".next-qa",".next-http"].filter(d=>d!==buildDir).map(d=>`./${d}/**`);
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingExcludes: {
    "/*": [
      "./tmp/**",
      "./output/**",
      "./screenshots/**",
      "./privato/**",
      "./*.pdf",
      "./*.docx*",
      "./.env*",
      "./.data/**",
      "./.git/**",
      ...otherBuilds,
      "./.next-corrupt-*/**",
    ],
  },
  distDir: buildDir,
  output: "standalone",
  devIndicators: false,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(process.env.MEDIA_PUBLIC_BASE
        ? [
            {
              protocol: "https",
              hostname: new URL(process.env.MEDIA_PUBLIC_BASE).hostname,
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.googleadservices.com https://www.tripadvisor.com https://www.jscache.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.digitaloceanspaces.com https://images.unsplash.com https://www.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.tripadvisor.com; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com; frame-src https://www.google.com https://www.tripadvisor.com https://td.doubleclick.net; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
      {
        source: "/gestisci-prenotazione/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};
export default nextConfig;
