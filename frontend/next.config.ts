import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "http://10.13.59.246:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.13.59.190:3000",
    "http://192.168.1.5:3000"
  ],
    

  
};

export default nextConfig;
