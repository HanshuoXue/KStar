#!/bin/bash

# KStar API 自动化测试脚本 (测试模式)
# 使用特殊头部绕过 Clerk 认证进行自动化测试

set -e

# 配置
API_URL=${API_URL:-"http://localhost:3000"}
VERBOSE=${VERBOSE:-0}

# 测试头部
TEST_HEADERS=(
  -H "x-test-mode: true"
  -H "x-test-secret: kstar-test-2024"
  -H "x-test-user-id: test-user-12345"
  -H "Content-Type: application/json"
)

# 辅助函数
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $1"
}

test_api() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local data=${4:-""}
  local description=$5
  
  printf "测试: %-30s " "$description"
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "${TEST_HEADERS[@]}" "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "${TEST_HEADERS[@]}" -d "$data" "$API_URL$endpoint")
  fi
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status_code" == "$expected_status" ]; then
    echo "✓ (状态码: $status_code)"
    if [ $VERBOSE -eq 1 ]; then
      echo "响应: $body"
      echo ""
    fi
  else
    echo "✗ (期望: $expected_status, 实际: $status_code)"
    echo "响应: $body"
    echo ""
  fi
}

echo "=== KStar API 自动化测试 (测试模式) ==="
echo "🧪 使用测试头部绕过认证"
echo ""

# 1. 基础健康检查 (无需认证)
echo "1. 基础API检查"
test_api "GET" "/api/health" "200" "" "健康检查"
test_api "GET" "/api/env-check" "200" "" "环境变量检查"
test_api "GET" "/api/status" "200" "" "系统状态检查"
echo ""

# 2. 用户API测试 (使用测试认证)
echo "2. 用户 API 测试"
test_api "GET" "/api/user" "200" "" "获取用户信息"
test_api "PATCH" "/api/user" "200" "" "更新用户统计"
echo ""

# 3. 歌曲API测试
echo "3. 歌曲 API 测试" 
test_api "GET" "/api/songs" "200" "" "获取歌曲列表"

# 创建测试歌曲
song_data='{
  "title": "测试歌曲",
  "artist": "测试歌手",
  "duration": 180,
  "sourceUrl": "https://www.youtube.com/watch?v=test123",
  "sourceType": "YOUTUBE"
}'
test_api "POST" "/api/songs" "200" "$song_data" "创建歌曲记录"
echo ""

# 4. 下载API测试
echo "4. 下载 API 测试"
test_api "GET" "/api/download" "200" "" "查询下载任务"

# 创建下载任务
download_data='{
  "url": "https://www.youtube.com/watch?v=test123",
  "title": "测试下载",
  "quality": "best"
}'
test_api "POST" "/api/download" "200" "$download_data" "创建下载任务"
echo ""

# 5. 歌词API测试
echo "5. 歌词 API 测试"
# 使用有效的 MongoDB ObjectId (24字符十六进制)
test_song_id="507f1f77bcf86cd799439011"
test_api "GET" "/api/lyrics?songId=$test_song_id" "200" "" "获取歌词"

# 生成歌词时间轴
lyrics_data='{
  "songId": "'$test_song_id'",
  "lyrics": "这是一首测试歌曲\n用来验证系统功能",
  "language": "zh"
}'
test_api "POST" "/api/lyrics" "200" "$lyrics_data" "生成歌词时间轴"
echo ""

echo "=== 测试完成 ==="
echo ""
echo "💡 提示:"
echo "  - 设置 VERBOSE=1 可以查看详细响应"
echo "  - 设置 API_URL 可以测试不同环境"
echo "  - 测试模式使用特殊头部绕过认证"
echo "  - 生产环境不会响应测试头部" 