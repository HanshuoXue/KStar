#!/bin/bash

# API 测试脚本
# 使用方法: ./test-api.sh

echo "=== KStar API 测试 ==="
echo ""

# 设置基础 URL
BASE_URL="${API_URL:-http://localhost:3000}"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 测试函数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "测试: $description... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} (状态码: $status_code)"
        if [ -n "$VERBOSE" ]; then
            echo "响应: $body"
            echo ""
        fi
    else
        echo -e "${RED}✗${NC} (期望: $expected_status, 实际: $status_code)"
        echo "响应: $body"
        echo ""
    fi
}

echo "1. 健康检查"
test_endpoint "GET" "/api/health" "" "200" "健康检查端点"

echo ""
echo "2. 环境变量检查"
test_endpoint "GET" "/api/env-check" "" "200" "环境变量检查"

echo ""
echo "3. 系统状态"
test_endpoint "GET" "/api/status" "" "200" "系统状态检查"

echo ""
echo "4. 用户 API (需要认证)"
test_endpoint "GET" "/api/user" "" "401" "未认证用户访问"

echo ""
echo "5. 歌曲 API"
test_endpoint "GET" "/api/songs" "" "401" "未认证获取歌曲列表"
test_endpoint "POST" "/api/songs" '{"title":"Test"}' "401" "未认证创建歌曲"

echo ""
echo "6. 下载 API"
test_endpoint "GET" "/api/download" "" "401" "未认证查询下载任务"
test_endpoint "POST" "/api/download" '{"url":"https://youtube.com/watch?v=test"}' "401" "未认证创建下载任务"

echo ""
echo "7. 歌词 API"
test_endpoint "GET" "/api/lyrics?songId=test" "" "401" "未认证获取歌词"
test_endpoint "POST" "/api/lyrics" '{"songId":"test","lyrics":"Test lyrics"}' "401" "未认证生成歌词时间轴"

echo ""
echo "=== 测试完成 ==="
echo ""
echo "提示: 设置 VERBOSE=1 可以查看详细响应"
echo "提示: 设置 API_URL 可以测试不同环境 (如: API_URL=https://your-app.amplifyapp.com ./test-api.sh)" 