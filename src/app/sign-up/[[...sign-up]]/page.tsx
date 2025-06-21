import { SignUp } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'

export default function Page() {
  const t = useTranslations('auth')
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{t('signUpTitle')}</h1>
          <p className="text-gray-600">创建你的 KStar 账户，开始音域分析之旅</p>
        </div>
        <SignUp 
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