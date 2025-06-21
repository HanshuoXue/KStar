import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { zhCN, enUS } from '@clerk/localizations'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'
import "./globals.css";

export const metadata: Metadata = {
  title: "KStar - 音频分析平台",
  description: "AI驱动的音频分析和音域匹配平台",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value || 'zh'
  const messages = await getMessages()
  
  // 根据语言选择 Clerk 本地化
  const clerkLocalization = locale === 'zh' ? zhCN : enUS

  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang={locale}>
        <body className="antialiased">
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}