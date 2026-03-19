import nextConfig from "eslint-config-next/core-web-vitals";

const config = Array.isArray(nextConfig) ? nextConfig : [nextConfig];

export default [
  ...config,
  {
    // shadcn/ui generated components — do not lint
    ignores: ["src/components/ui/**"],
  },
];
