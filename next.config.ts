import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DS ship เป็น TypeScript source — ถ้าไม่ transpile จะ build ไม่ผ่าน
  transpilePackages: ["@peckey954/ui"],
};

export default nextConfig;
