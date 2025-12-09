# [NB Nano Banana - 全能香蕉图创平台](https://nbnb.kuai.host/)

> 🚀 基于 Gemini 3 Pro 的新一代 AI 图像生成工具，纯前端架构，开箱即用

![file_1764935463266_720.png](https://api.apifox.com/api/v1/projects/7516691/resources/601450/image-preview)

![file_1764935456658_426.png](https://api.apifox.com/api/v1/projects/7516691/resources/601449/image-preview)


## 📖 项目简介

**NB Nano Banana** 是一款现代化的纯前端 AI 图像生成平台，专为 Google Gemini 3 Pro 模型打造。无需后端服务器，所有功能在浏览器中直接运行。提供直观的聊天式交互界面、强大的 Pipeline 工作流编排系统，以及丰富的图像管理功能。

**核心理念**：让 AI 图像生成变得简单、高效、有趣。

---

> ### 应用地址：<Icon icon="lucide-banana"/> https://nbnb.kuai.host/

<Icon icon="lucide-github"/> https://github.com/aigem/nbnb/

## [📚 完整使用教程](https://www.kuai.host/7798503m0)

### 请点个小星星！！！

---

## ✨ 主要功能

### 1️⃣ 多模态交互
- **文本对话** + **图像生成**：支持纯文本或图文混合输入
- **多图上传**：一次最多支持 14 张参考图片
- **便捷输入**：
  - 点击上传、拖拽上传、粘贴上传
  - **📱 移动端拍照**：手机端（< 640px）自动显示拍照按钮，直接调用摄像头，无需保存相册，普通输入框和批量编排均支持

### 2️⃣ Pipeline 工作流编排 🔥
强大的批量处理引擎，支持三种执行模式：

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **串行模式** | 步骤顺序执行，逐步转换 | 风格迁移、渐进优化 |
| **并行模式** | 同时生成多个变体 | 多风格探索、快速试错 |
| **组合模式** | n张图 × m个提示词 = n×m张输出 | 批量数据集生成 |

**高级特性**：
- ✅ 每步独立选择模型（Gemini 3 Pro / 2.5 Flash 等）
- ✅ 5 个内置预设模板，一键应用复杂工作流
- ✅ **自定义 JSON 模板**：在 `public/templates/` 创建 `.json` 文件，定义 `name`、`mode`、`steps` 字段，添加路径到 `pipelineTemplateService.ts`，刷新页面即可使用
- ✅ 实时进度跟踪与错误处理

### 3️⃣ 智能图像管理
- **历史记录**：自动保存所有生成图片（最多 100 张）
- **一键下载**：悬停显示下载按钮，支持批量下载
- **再次编辑**：点击历史图片直接用作新生成的参考图
- **持久化存储**：使用 IndexedDB 存储，刷新不丢失

### 4️⃣ API 余额管理 💰
- 实时显示 API Key 的总额度、已用额度、剩余额度
- 支持手动刷新，自动查询（首次打开设置时）
- 兼容 OpenAI 格式的 API Endpoint

### 5️⃣ 等待街机模式 🎮
AI 思考时不再无聊：
- 自动激活小游戏（贪吃蛇、恐龙跑酷、2048、生命游戏）
- 游戏自适应当前主题和设备类型
- 生成完成后自动关闭

### 6️⃣ 现代化体验
- **流式响应**：实时打字机效果
- **主题切换**：明亮 / 暗黑 / 跟随系统
- **响应式设计**：完美适配桌面和移动端
- **PWA 支持**：可安装为独立应用

---

## 🎯 核心卖点

### 为什么选择 NB Nano Banana？

| 💎 卖点 | 🔍 说明 |
|---------|---------|
| **纯前端架构** | 无需服务器，0 部署成本，EdgeOne Pages / GitHub Pages / Vercel 一键托管 |
| **Pipeline 编排** | 业界首创的串行/并行/组合三合一工作流系统，支持复杂批量处理 |
| **JSON 模板系统** | 5 个内置预设 + 可自定义 JSON 模板，热更新工作流配置，无需重新编译 |
| **移动端拍照** | 手机端直接调用相机上传，快速捕捉灵感，支持双端（输入框+批量编排） |
| **开箱即用** | 无需配置后端，输入 API Key 即可立即使用 |
| **数据安全** | API Key 和历史记录仅存储在本地浏览器，不上传任何服务器 |
| **性能优化** | 基于 React 19 + Vite 6 + Bun，极速构建和运行 |
| **完全开源** | AGPL-3.0 协议，代码透明可审计 |

**适用人群**：
- 🎨 **设计师**：快速生成多风格图像原型
- 🤖 **AI 工程师**：批量生成训练数据集（AI-toolkit / LoRA 炼丹）
- 📱 **产品经理**：探索多种视觉方案
- 🔬 **研究者**：自动化图像处理流程

---

## 🚀 快速部署

### 方式一：本地运行（推荐开发测试）

**前置要求**：
- Node.js 18+
- **Bun** 1.2.1+ （项目强制使用 Bun）

**步骤**：
```bash
# 1. 克隆仓库
git clone https://github.com/aigem/nbnb.git
cd nbnb

# 2. 安装依赖
bun install

# 3. 启动开发服务器
bun dev

# 访问 http://localhost:3000
```

### 方式二：Vercel 部署（推荐生产环境）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aigem/nbnb)

1. 点击上方按钮，一键导入项目到 Vercel
2. 等待自动构建完成（约 1-2 分钟）
3. 访问分配的域名即可使用

### 方式三：GitHub Pages 部署

```bash
# 1. 构建生产版本
bun build

# 2. 将 dist/ 目录推送到 gh-pages 分支
# 或使用 GitHub Actions 自动化部署
```

### 方式四：Docker 部署

```bash
# 1. 构建镜像
docker build -t nb-nano-banana .

# 2. 运行容器
docker run -p 3000:3000 nb-nano-banana
```

---

## 🔑 获取 API Key

### 推荐渠道：Kuai API（国内友好）

NB Nano Banana 默认使用 **Kuai API** 作为 Gemini 模型的接入点，提供更稳定的国内访问体验。

**注册链接**：[https://api.kuai.host/register?aff=z2C8](https://api.kuai.host/register?aff=z2C8)

**优势**：
- ✅ 国内直连，无需科学上网
- ✅ 支持 Gemini 3 Pro / 2.5 Flash 等最新模型
- ✅ OpenAI 兼容格式，支持余额查询
- ✅ 按量计费，首次注册有免费额度

**注册流程**：
1. 访问注册链接并创建账号
2. 完成实名认证（可选）
3. 进入控制台 → API Keys 页面
4. 点击"创建 API Key"并复制

### 官方渠道：Google AI Studio

**注册链接**：[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

**注意事项**：
- ⚠️ 需要科学上网访问
- ⚠️ 部分地区不可用（中国大陆 / 香港等）
- ⚠️ 官方 API 不支持余额查询功能

---

## ⚙️ 首次使用配置

### 1. 输入 API Key
启动应用后，点击右上角的 **钥匙图标（🔑）**，输入你的 API Key。

> 💡 API Key 会安全保存在浏览器本地存储中，下次访问自动加载。

### 2. 通过 URL 参数预配置（可选）

支持通过 URL 参数快速设置，方便分享或特定场景：

```
https://your-domain.com/?apikey=YOUR_KEY&endpoint=https://api.kuai.host&model=gemini-3-pro-image-preview
```

**参数说明**：
- `apikey`：预填 API Key
- `endpoint`：自定义 API 端点
- `model`：自定义模型名称

### 3. 调整高级设置
点击右上角 **设置图标（⚙️）**，可调整：
- 图像分辨率（1K / 2K / 4K）
- 长宽比（1:1 / 16:9 / 9:16 等）
- Google Search Grounding（联网搜索）
- 思维链显示开关
- 主题外观

---

## 📚 快速上手示例

### 示例 1：单张图片生成
1. 在输入框输入提示词："一只赛博朋克风格的猫"
2. 点击发送按钮
3. 等待生成，查看结果

### 示例 2：参考图风格迁移
1. 上传一张照片（拖拽到输入框）
2. 输入："转换为水彩画风格"
3. 发送查看效果

### 示例 3：Pipeline 批量生成
1. 点击"批量编排"按钮
2. 选择"并行模式"
3. 上传 1 张照片
4. 点击"多风格探索"模板（自动填充 4 个风格提示词）
5. 点击"开始执行"
6. 一次性生成 4 种不同风格的图像

### 示例 4：数据集生成（AI 炼丹）
1. 点击"批量编排"→"组合模式"
2. 上传 3 张不同角度的照片
3. 添加 5 条风格提示词（如"正面"、"侧面"、"特写"等）
4. 自动计算：3×5 = 15 张输出
5. 开始执行，批量下载所有图片用于训练

---

## 🛡️ 隐私与安全

- **本地存储**：API Key 和历史记录仅存储在您的浏览器中
- **无数据上传**：不向任何第三方服务器发送数据
- **开源透明**：所有代码公开可审计
- **一键清除**：随时在设置中清除 API Key 和历史记录

---

## 📞 支持与反馈

- **问题报告**：[GitHub Issues](https://github.com/aigem/nbnb/issues)
- **功能建议**：[GitHub Discussions](https://github.com/aigem/nbnb/discussions)
- **技术文档**：查看仓库中的 [CLAUDE.md](./CLAUDE.md)

---

## 📄 开源协议

本项目采用 **AGPL-3.0** 协议开源。

- ✅ 允许商业使用
- ✅ 允许修改和分发
- ⚠️ 修改后的代码必须开源
- ⚠️ 网络服务部署必须开源

---

## 🙏 致谢

- 参考项目：[faithleysath/UndyDraw](https://github.com/faithleysath/UndyDraw)
- API 服务赞助：[Kuai API](https://api.kuai.host/register?aff=z2C8)
- 技术栈：React、Vite、Tailwind CSS、Zustand、Google GenAI SDK

---

**🎉 开始你的 AI 图像创作之旅吧！**
