#!/bin/bash

# 替换为你的实际 Amplify URL
URL="https://main.d2t18tt2z5krry.amplifyapp.com"

echo "=== 快速诊断 Amplify 部署 ==="
echo ""

echo "1. 检查主页:"
curl -I "$URL" 2>/dev/null | head -n 1

echo ""
echo "2. 检查 Health API:"
curl -s "$URL/api/health" | head -c 200

echo ""
echo "3. 检查 Env Check API:"
curl -s "$URL/api/env-check" | head -c 200

echo ""
echo "4. 获取错误详情:"
curl -v "$URL/api/health" 2>&1 | grep -E "(HTTP|Error|error)" | head -5

