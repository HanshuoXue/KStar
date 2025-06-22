# KStar 音乐API集成指南

## 概述

KStar 支持多种音乐源的集成，包括免费和商业平台。在测试模式下，我们使用免费的音乐资源来演示功能。

## 支持的音乐平台

### 1. Jamendo (免费音乐平台)

Jamendo 提供超过 500,000 首免费音乐，所有音乐都采用 Creative Commons 许可证。

**优点：**
- 完全免费且合法
- 提供直接的 MP3 下载链接
- 有丰富的元数据（标题、艺术家、专辑等）
- 支持商业使用

**测试示例：**
```bash
# 下载 Jamendo 音乐
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -H "X-Test-Mode: true" \
  -H "X-Test-User-Id: test_clerk_123" \
  -d '{
    "url": "https://www.jamendo.com/track/1781603/summer-vibes"
  }'
```

**示例歌曲：**
- [Summer Vibes](https://www.jamendo.com/track/1781603/summer-vibes) - Roa Music
- [Cinematic Documentary](https://www.jamendo.com/track/1972914/cinematic-documentary) - MaxKoMusic
- [Inspiring Cinematic Background](https://www.jamendo.com/track/1884133/inspiring-cinematic-background) - AGsoundtrax

### 2. Free Music Archive (FMA)

另一个优秀的免费音乐资源库。

**特点：**
- 高质量的独立音乐
- 多种许可证选项
- 可用于商业项目

### 3. YouTube (需要 yt-dlp)

在生产环境中，可以使用 yt-dlp 下载 YouTube 音频。

**注意事项：**
- 需要遵守 YouTube 服务条款
- 仅用于个人使用或获得授权的内容
- 需要安装 yt-dlp 工具

### 4. 网易云音乐 / QQ音乐 / Bilibili

这些平台需要特殊的API处理和可能的认证。

## 歌词获取方案

### 1. LRCLIB (免费歌词API)

LRCLIB 提供免费的歌词API，支持同步歌词。

**API 示例：**
```bash
# 搜索歌词
curl "https://lrclib.net/api/search?artist_name=Ed%20Sheeran&track_name=Perfect"

# 获取同步歌词
curl "https://lrclib.net/api/get?artist_name=Ed%20Sheeran&track_name=Perfect"
```

### 2. Genius (需要API密钥)

Genius 提供详细的歌词和注释，但需要API密钥。

### 3. 自定义歌词

用户可以上传自己的歌词文本，系统会自动生成时间轴。

## 测试模式功能

在测试模式下，系统提供以下功能：

### 1. 模拟下载

```javascript
// 支持的测试URL格式
"https://www.jamendo.com/track/{trackId}/{track-name}"  // Jamendo歌曲
"test://example-song"                                     // 通用测试歌曲
```

### 2. 模拟歌词

系统会根据歌曲返回预设的歌词数据：

```json
{
  "songId": "song123",
  "timeStamps": [
    { "begin": 0, "end": 8, "text": "Feel the summer breeze" },
    { "begin": 8, "end": 16, "text": "Dancing through the trees" }
  ],
  "language": "eng"
}
```

### 3. 音频分析

模拟音频分析数据，包括：
- BPM (节奏)
- 音调
- 能量值
- 情绪分析

## 实际部署建议

### 1. 使用 AWS Lambda 处理音频

```python
# Lambda 函数示例
import yt_dlp
import boto3

def download_audio(url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return info
```

### 2. 使用 S3 存储音频文件

```javascript
// 上传到 S3
const uploadToS3 = async (fileBuffer, fileName) => {
  const command = new PutObjectCommand({
    Bucket: 'kstar-audio',
    Key: fileName,
    Body: fileBuffer,
    ContentType: 'audio/mpeg'
  });
  
  await s3Client.send(command);
};
```

### 3. 使用 SQS 处理异步任务

```javascript
// 发送下载任务到队列
const sendToQueue = async (taskData) => {
  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(taskData)
  });
  
  await sqsClient.send(command);
};
```

## API 使用示例

### 完整的工作流程

```bash
# 1. 创建下载任务
RESPONSE=$(curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url": "https://www.jamendo.com/track/1781603/summer-vibes"}')

TASK_ID=$(echo $RESPONSE | jq -r '.data.taskId')

# 2. 检查任务状态
curl "http://localhost:3000/api/download?taskId=$TASK_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. 获取歌曲列表
curl "http://localhost:3000/api/songs" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. 获取歌词
curl "http://localhost:3000/api/lyrics?songId=SONG_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 最佳实践

1. **版权合规**
   - 仅下载有授权的内容
   - 使用免费音乐平台进行测试
   - 记录所有下载来源

2. **性能优化**
   - 使用异步处理下载任务
   - 实施合理的速率限制
   - 缓存常用数据

3. **错误处理**
   - 实现重试机制
   - 提供清晰的错误信息
   - 记录所有失败的任务

4. **安全考虑**
   - 验证所有输入的URL
   - 限制文件大小
   - 使用安全的存储方案

## 总结

KStar 的音乐功能设计为灵活且可扩展的系统。在测试环境中，我们使用免费的音乐资源来演示功能。在生产环境中，可以轻松集成各种音乐平台和服务，为用户提供丰富的音乐体验。 