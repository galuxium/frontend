import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    domains: [
      'lh3.googleusercontent.com', // ✅ Google profile pictures
      'avatars.githubusercontent.com', // ✅ GitHub profile pictures (optional)
      'api.dicebear.com', // ✅ Fallback avatars
      'images.pexels.com', // ✅ Vecteezy images
      'yyajztqaudgsmiinqwnr.supabase.co', // ✅ Supabase Storage (if you serve avatars from there)
      'www.pexels.com'
    ],
  },
};

export default nextConfig;
