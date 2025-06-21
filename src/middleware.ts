import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 暂时禁用中间件来诊断500错误
export default clerkMiddleware()

export const config = {
  matcher: [],  // 暂时不匹配任何路由
}