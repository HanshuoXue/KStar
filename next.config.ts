import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // 移除 standalone 输出，使用默认配置
};

export default withNextIntl(nextConfig);