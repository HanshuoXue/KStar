#!/bin/bash

# 请将这里替换为你的实际 Amplify URL
AMPLIFY_URL="https://main.d2t18tt2z5krry.amplifyapp.com"

echo "=== 诊断 AWS Amplify 部署问题 ==="
echo ""

echo "1. 测试 Health API:"
curl -s "$AMPLIFY_URL/api/health" | jq . || echo "❌ Health API 失败"

echo ""
echo "2. 测试 Env Check API:"
curl -s "$AMPLIFY_URL/api/env-check" | jq '.summary' || echo "❌ Env Check API 失败"

echo ""
echo "3. 检查首页响应:"
curl -I "$AMPLIFY_URL/" 2>/dev/null | head -n 3

echo ""
echo "=== 诊断完成 ===" 