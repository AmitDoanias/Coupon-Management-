import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — blocks embedding the app in an iframe on other sites
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing — browser must respect declared content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer info sent to external sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features the app doesn't use
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  // Legacy XSS filter (still respected by some older browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
