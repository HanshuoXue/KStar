import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export default getRequestConfig(async () => {
  let locale = 'zh'; // 默认语言
  
  try {
  const cookieStore = await cookies();
    locale = cookieStore.get('locale')?.value || 'zh';
  } catch (error) {
    // 在某些环境中 cookies() 可能会失败，使用默认值
    console.warn('Failed to read locale from cookies, using default:', error);
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});