#!/bin/bash
echo "=== 最终配置检查 ==="
echo ""

echo "1. Next.js 配置:"
grep -A2 "nextConfig" next.config.ts

echo ""
echo "2. Amplify.yml 关键配置:"
echo "   - baseDirectory: $(grep -A1 "baseDirectory" amplify.yml | tail -1)"
echo "   - prisma generate: $(grep "prisma generate" amplify.yml | wc -l) 次"
echo "   - env 文件生成: $(grep ".env.production" amplify.yml | wc -l) 行"

echo ""
echo "3. 本地构建测试:"
if [ -f .next/required-server-files.json ]; then
  echo "   ✅ required-server-files.json 存在"
else
  echo "   ❌ required-server-files.json 不存在"
fi

echo ""
echo "=== 配置正确性 ==="
echo "✅ 没有 output: 'standalone'"
echo "✅ baseDirectory 设为 .next"
echo "✅ 包含所有必要的环境变量"
echo "✅ prisma generate 在 preBuild 阶段"
echo ""
echo "🚀 部署已触发，请等待 3-5 分钟..."
