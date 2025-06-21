import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Button } from "@/components/ui/button"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function Home() {
  const t = useTranslations()

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('home.title')}</h1>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <SignedOut>
            <SignInButton>
              <Button>{t('common.login')}</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="outline">仪表板</Button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      
      <main className="text-center">
        <p className="text-lg text-gray-600 mb-8">{t('home.subtitle')}</p>
        
        <SignedOut>
          <div className="space-y-4">
            <h2 className="text-2xl">{t('home.welcomeMessage')}</h2>
            <p className="text-gray-600">{t('home.loginPrompt')}</p>
            
            <div className="flex justify-center gap-4 mt-8">
              <SignInButton>
                <Button size="lg">开始使用</Button>
              </SignInButton>
              <Link href="/sign-up">
                <Button variant="outline" size="lg">注册账户</Button>
              </Link>
            </div>
          </div>
        </SignedOut>
        
        <SignedIn>
          <div className="space-y-4">
            <h2 className="text-2xl">{t('home.welcomeBack')}</h2>
            <p className="text-gray-600">{t('home.startAnalysis')}</p>
            
            <div className="flex justify-center gap-4 mt-8">
              <Link href="/dashboard">
                <Button size="lg">进入仪表板</Button>
              </Link>
              <Button variant="outline" size="lg">🎤 开始分析</Button>
            </div>
          </div>
        </SignedIn>
      </main>
    </div>
  )
}