import { SignIn } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'

export default function Page() {
  const t = useTranslations('auth')
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{t('signInTitle')}</h1>
          <p className="text-gray-600">登录到你的 KStar 账户</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border-0",
            }
          }}
        />
      </div>
    </div>
  )
}