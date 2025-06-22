#!/bin/bash

# 音乐功能测试脚本
# 测试下载音乐和获取歌词功能

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API 基础URL
BASE_URL="http://localhost:3000/api"

# 测试用户凭据
TEST_CLERK_ID="test_clerk_123"
TEST_EMAIL="test@example.com"

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}     KStar 音乐功能测试 (测试模式)      ${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# 1. 测试使用 Jamendo 免费音乐下载
echo -e "${YELLOW}1. 测试使用 Jamendo 免费音乐下载${NC}"
echo -e "${GREEN}   使用 Jamendo 提供的免费音乐进行测试${NC}"
echo ""

# 测试下载 Jamendo 音乐 (Summer Vibes)
echo -e "${BLUE}测试下载: Summer Vibes by Roa Music${NC}"
DOWNLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/download" \
  -H "Content-Type: application/json" \
  -H "X-Test-Mode: true" \
  -H "X-Test-User-Id: $TEST_CLERK_ID" \
  -d '{
    "url": "https://www.jamendo.com/track/1781603/summer-vibes"
  }')

echo "响应: $DOWNLOAD_RESPONSE" | jq '.'
TASK_ID=$(echo $DOWNLOAD_RESPONSE | jq -r '.data.taskId')
SONG_ID=$(echo $DOWNLOAD_RESPONSE | jq -r '.data.songId')
echo ""

# 2. 检查下载状态
echo -e "${YELLOW}2. 检查下载任务状态${NC}"
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/download?taskId=$TASK_ID" \
  -H "X-Test-Mode: true" \
  -H "X-Test-User-Id: $TEST_CLERK_ID")

echo "任务状态: "
echo $STATUS_RESPONSE | jq '.'
echo ""

# 3. 获取用户歌曲列表
echo -e "${YELLOW}3. 获取用户歌曲列表${NC}"
SONGS_RESPONSE=$(curl -s -X GET "$BASE_URL/songs" \
  -H "X-Test-Mode: true" \
  -H "X-Test-User-Id: $TEST_CLERK_ID")

echo "歌曲列表: "
echo $SONGS_RESPONSE | jq '.'
echo ""

# 4. 测试获取歌词
echo -e "${YELLOW}4. 测试获取歌词${NC}"
if [ ! -z "$SONG_ID" ] && [ "$SONG_ID" != "null" ]; then
  LYRICS_RESPONSE=$(curl -s -X GET "$BASE_URL/lyrics?songId=$SONG_ID" \
    -H "X-Test-Mode: true" \
    -H "X-Test-User-Id: $TEST_CLERK_ID")
  
  echo "歌词数据: "
  echo $LYRICS_RESPONSE | jq '.'
  echo ""
fi

# 5. 测试生成歌词时间轴
echo -e "${YELLOW}5. 测试生成歌词时间轴${NC}"
if [ ! -z "$SONG_ID" ] && [ "$SONG_ID" != "null" ]; then
  LYRICS_SYNC_RESPONSE=$(curl -s -X POST "$BASE_URL/lyrics" \
    -H "Content-Type: application/json" \
    -H "X-Test-Mode: true" \
    -H "X-Test-User-Id: $TEST_CLERK_ID" \
    -d "{
      \"songId\": \"$SONG_ID\",
      \"lyrics\": \"Feel the summer breeze\nDancing through the trees\nGolden sunset skies\nMagic in our eyes\",
      \"language\": \"eng\"
    }")
  
  echo "歌词时间轴: "
  echo $LYRICS_SYNC_RESPONSE | jq '.'
  echo ""
fi

# 6. 测试更多 Jamendo 歌曲
echo -e "${YELLOW}6. 测试更多 Jamendo 免费音乐${NC}"
echo -e "${GREEN}   Jamendo 提供超过 500,000 首免费音乐${NC}"
echo ""

# 示例 URLs
echo -e "${BLUE}更多可用的 Jamendo 测试链接:${NC}"
echo "1. https://www.jamendo.com/track/1972914/cinematic-documentary"
echo "2. https://www.jamendo.com/track/1884133/inspiring-cinematic-background"
echo "3. https://www.jamendo.com/track/1781603/summer-vibes"
echo ""

# 7. 测试通用下载链接
echo -e "${YELLOW}7. 测试通用下载链接${NC}"
echo -e "${GREEN}   使用 test:// 协议进行快速测试${NC}"
TEST_DOWNLOAD=$(curl -s -X POST "$BASE_URL/download" \
  -H "Content-Type: application/json" \
  -H "X-Test-Mode: true" \
  -H "X-Test-User-Id: $TEST_CLERK_ID" \
  -d '{
    "url": "test://example-song"
  }')

echo "测试下载响应: "
echo $TEST_DOWNLOAD | jq '.'
echo ""

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}     音乐功能测试完成！                  ${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "${BLUE}说明:${NC}"
echo "1. 测试模式使用 Jamendo 的免费音乐作为示例"
echo "2. 实际生产环境可以支持 YouTube、Bilibili、网易云等平台"
echo "3. 歌词功能支持时间轴同步显示"
echo "4. 所有数据都可以通过 API 获取和管理"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo "- Jamendo 提供完全免费且合法的音乐下载"
echo "- 可以访问 https://www.jamendo.com 浏览更多音乐"
echo "- API 支持批量处理和自动化工作流" 