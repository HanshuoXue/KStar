#!/bin/bash

# 替换为你的 Amplify 应用 URL
AMPLIFY_URL="https://main.d2t18tt2z5krry.amplifyapp.com"

echo "检查 AWS Amplify 部署状态..."
echo "================================"

# 检查主页
echo "1. 检查主页:"
curl -I "$AMPLIFY_URL/" 2>/dev/null | head -n 1

echo ""
echo "2. 检查 Health API:"
echo "--------------------------------"
curl -s "$AMPLIFY_URL/api/health" | python3 -m json.tool

echo ""
echo "3. 检查环境变量状态:"
echo "--------------------------------"
curl -s "$AMPLIFY_URL/api/env-check" 2>/dev/null | python3 -m json.tool || echo "env-check endpoint 不存在"

echo ""
echo "4. 完整的 Health API 响应:"
echo "--------------------------------"
curl -v "$AMPLIFY_URL/api/health" 2>&1 | grep -E "(HTTP|{|})"|head -20

echo ""
echo "================================"
echo "如果看到 500 错误，请检查 AWS Amplify 控制台的 CloudWatch 日志" 