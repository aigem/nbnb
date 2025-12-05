# Gemini 3 Pro Client (Frontend Only)

这是一个基于 React 的现代化纯前端应用，专为与 Google 的 **Gemini 3 Pro** 模型交互而设计。它提供了一个流畅的聊天界面，支持多模态输入、**Pipeline编排工作流**（串行/并行/组合模式），并在等待 AI 思考时提供趣味性的互动体验。

## ✨ 主要特性

### 🎨 核心功能

- **纯前端架构**：基于 React 19 + Vite 6 构建，无需后端服务器，直接在浏览器中运行
- **Gemini 3 Pro 支持**：默认配置为 `gemini-3-pro-image-preview` 模型，支持最新的 AI 能力
- **多模态交互**：
  - 支持文本对话
  - 支持图片上传与分析（最多支持 14 张参考图片）
  - 支持在页面任意位置粘贴剪贴板图片，自动加入参考图列表
  - **✨ 拖拽上传**：支持将图片直接拖拽到输入框上传，无需点击按钮

### 🔄 Pipeline Orchestration - 管道编排 (新增)

高级图片生成工作流系统，支持复杂的批量处理和自动化流程：

- **🔗 串行模式 (Serial)**：
  - 步骤按顺序执行，每步使用前一步的输出作为输入
  - 适用场景：渐进式优化、风格转换链
  - 示例：照片 → 线稿 → 水彩画 → 增强细节

- **⚡ 并行模式 (Parallel)**：
  - 所有步骤同时执行，共享同一组初始图片
  - 适用场景：多风格探索、快速生成变体
  - 示例：照片 → [动漫风格, 油画风格, 赛博朋克, 极简风格]（同时生成）

- **🎯 组合模式 (Combination)**：
  - 笛卡尔积：每张图片 × 每条提示词
  - 生成 n×m 张输出（n 张图 × m 条提示词）
  - 适用场景：批量风格迁移、AI-toolkit 训练数据集生成
  - 示例：2 张照片 × 3 个风格 = 6 张生成图

- **⚙️ 高级特性**：
  - 每步独立选择模型（Gemini 3 Pro、2.5 Flash 等）
  - 自定义提示词库（支持 JSON 模板预设）
  - 串行模式支持步骤重排（上移/下移）
  - 实时进度跟踪与错误处理
  - 支持 1-14 张初始参考图片

- **📦 预设模板系统**：
  - 5 个内置模板可快速开始（风格迁移、渐进优化、多风格探索、数据集生成、批量组合）
  - JSON 文件存储在 `public/templates/` 目录
  - 支持自定义添加和修改模板
  - 一键应用，快速配置复杂工作流

### 🖼️ 图片功能

- **📥 拖拽上传**：
  - 将图片拖拽到输入框区域即可上传
  - 拖拽时显示蓝色高亮边框提示
  - 支持同时拖拽多张图片

- **💾 一键下载**：
  - 生成的图片悬停显示下载按钮
  - 支持思维链中的图片下载
  - 自动命名：`gemini-image-{时间戳}.{扩展名}`

- **📚 图片历史记录**：
  - 自动收集所有生成的图片（最多保留 100 张）
  - 2x2 网格预览布局
  - 点击图片全屏查看 + 提示词详情
  - 支持单张下载或批量管理
  - 数据持久化保存到浏览器本地

### 💰 余额管理 (新增)

- **API 余额查询**：
  - 实时显示 API Key 余额信息
  - 三栏显示：总额度 / 已使用 / 剩余
  - 支持手动刷新余额
  - 自动查询（首次打开设置面板时）
  - 支持自定义 API Endpoint

### 🎮 等待街机模式

- **Waiting Arcade Mode**：
  - 在模型进行长思维链思考时，自动激活"街机模式"
  - **内置小游戏**：包含 **贪吃蛇 (Snake)**、**恐龙跑酷 (Dino)**、**2048** 和 **生命游戏 (Game of Life)**
  - **自适应体验**：游戏根据当前的**主题（明/暗）**和**设备类型（桌面/移动）**自动切换，打发等待时间

### 🧠 思维链可视化

- 通过可折叠的 UI 展示模型的思维过程（Thinking Process）
- 支持查看详细步骤
- 显示思考耗时

### 🎨 现代化 UI/UX

- **流畅交互**：实时流式响应，配合打字机效果
- **交互反馈**：集成 Toast 通知、全局对话框及操作音效
- **主题切换**：支持明亮（Light）、暗黑（Dark）及跟随系统主题
- **响应式设计**：完美适配桌面端和移动端

### 📝 Markdown 渲染

- 完美支持代码块高亮
- 支持表格、列表、引用等富文本格式
- 支持 GFM (GitHub Flavored Markdown)

### ⚙️ 高度可配置

- **API 设置**：支持自定义 API Endpoint 和模型名称
- **图像参数**：可调整生成图像的分辨率（1K/2K/4K）和长宽比
- **Grounding**：集成 Google Search Grounding 开关，支持联网搜索
- **安全隐私**：API Key 安全存储在本地浏览器中（LocalStorage），刷新页面不丢失，方便持续使用。随时可在设置中清除

## 🛠️ 技术栈

- **核心框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite 6](https://vitejs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式方案**: [Tailwind CSS 4](https://tailwindcss.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **AI SDK**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai)
- **图标库**: [Lucide React](https://lucide.dev/)
- **Markdown**: React Markdown + Remark GFM

## 🚀 快速开始

### 前置要求

- Node.js (建议 v18 或更高版本)
- **Bun** (>= 1.2.1) - 本项目强制使用 Bun 作为包管理器
- Google Gemini API Key ([在此获取](https://api.kuai.host/register?aff=z2C8)

### 安装与运行

1. **克隆仓库**

   ```bash
   git clone https://github.com/aigem/nb.git
   cd nb
   ```

2. **安装依赖**

   > 本项目配置了 `preinstall` 钩子，强制使用 `bun` 安装依赖。

   ```bash
   bun install
   ```

3. **启动开发服务器**

   ```bash
   bun dev
   ```

   启动后，在浏览器访问控制台输出的地址（通常是 `http://localhost:3000`）。

4. **构建生产版本**

   ```bash
   bun build
   ```

## ⚙️ 使用说明

### 1. 配置 API Key

首次进入应用时，会弹窗提示输入 **Gemini API Key**。

> 注意：API Key 将安全存储在您的浏览器本地（LocalStorage），以便下次访问时自动加载。您可以在设置面板中随时将其清除。

### 2. URL 参数配置

支持通过 URL 参数快速预设配置，方便分享或特定场景使用：

- `apikey`: 预填 API Key
- `endpoint`: 自定义 API 端点 (Base URL)
- `model`: 自定义模型名称

**示例：**
```
http://localhost:3000/?endpoint=https://my-proxy.com&model=gemini-2.0-flash
```

### 3. 图片上传方式

支持三种图片上传方式：

#### 方式一：点击上传
- 点击输入框左侧的 📷 图标
- 选择图片文件（最多 14 张）

#### 方式二：拖拽上传 ✨ (新增)
- 直接将图片拖拽到输入框区域
- 看到蓝色高亮边框后松开鼠标
- 图片自动上传并显示预览

#### 方式三：移动端拍照 📱✨ (新增)
- **仅手机端可见**：屏幕宽度 < 640px 时自动显示拍照按钮
- **位置**：普通输入框和批量编排面板均支持
- **操作**：点击 📷 拍照按钮直接调用摄像头
- **即拍即用**：无需保存到相册，拍摄后立即加入参考图列表

### 4. 图片历史记录 ✨ (新增)

点击顶部导航栏的 **🖼️ 图片图标**（带蓝色脉冲徽章）打开历史记录面板：

- **查看历史**：2x2 网格显示所有生成的图片
- **预览大图**：点击图片查看全屏预览 + 提示词详情
- **下载图片**：悬停显示下载按钮，或在预览模式下一键下载
- **清空历史**：点击顶部垃圾桶图标清空所有记录

### 5. 查看 API 余额 ✨ (新增)

打开设置面板（右上角 ⚙️ 图标），顶部显示余额卡片：

- **总额度**：你的 API Key 总额度
- **已使用**：近 100 天的消费金额
- **剩余**：剩余可用额度
- **刷新**：点击右上角刷新按钮更新数据

> 注意：余额查询功能仅支持 OpenAI 兼容的 API Endpoint（如 `https://api.kuai.host`）

### 6. Pipeline Orchestration - 管道编排 ✨ (新增)

点击输入框右侧的 **紫色"批量编排"** 按钮打开编排面板：

#### 串行模式使用流程：
1. 选择 **串行模式**
2. 上传 1-14 张初始图片（或使用摄像头拍照）
3. 添加多个处理步骤（每步输入提示词）
4. 可选：为每步选择不同的模型
5. 可选：调整步骤顺序（上移/下移按钮）
6. 点击"开始执行"观看逐步转换

#### 并行模式使用流程：
1. 选择 **并行模式**
2. 上传 1-14 张初始图片
3. 添加多个处理步骤（所有步骤共享初始图）
4. 快速应用预设模板（如"多风格探索"）
5. 点击"开始执行"同时生成所有变体

#### 组合模式使用流程：
1. 选择 **组合模式**
2. 上传多张初始图片（如 2-3 张）
3. 添加多条样式提示词（如 3-4 条）
4. 系统自动计算总生成数（n×m）
5. 点击"开始执行"批量生成所有组合

#### 预设模板库：
- **风格迁移**：串行，3步（线稿 → 水彩 → 增强细节）
- **渐进优化**：串行，3步（逐步优化图片质量）
- **多风格探索**：并行，4步（同时生成 4 种不同风格）
- **数据集生成**：并行，10步（AI-toolkit 训练数据集，多角度/姿势）
- **批量组合**：组合，3步（每张图×每个风格）

#### 自定义 JSON 模板 ✨ (高级功能)

所有预设模板存储在 `public/templates/*.json`，支持自由编辑和扩展：

**添加新模板步骤：**
1. 在 `public/templates/` 目录下创建新的 `.json` 文件
2. 使用以下结构编写模板：
   ```json
   {
     "name": "我的自定义工作流",
     "description": "简短描述这个模板的用途",
     "mode": "serial",
     "steps": [
       "第一步：将照片转换为线稿",
       "第二步：添加水彩风格",
       "第三步：增强细节和色彩"
     ]
   }
   ```
3. 将文件路径添加到 `src/services/pipelineTemplateService.ts` 的 `TEMPLATE_FILES` 数组中
4. 刷新页面，新模板即可在下拉菜单中使用

**模板字段说明：**
- `name`: 模板名称（显示在下拉菜单中）
- `description`: 模板描述（可选）
- `mode`: 执行模式，可选值：`"serial"` | `"parallel"` | `"combination"`
- `steps`: 提示词数组，每个元素是一个步骤的提示词字符串

**修改现有模板：**
- 直接编辑 `public/templates/` 下的 JSON 文件
- 修改 `steps` 数组中的提示词内容
- 保存后刷新页面即可生效（无需重新编译）

### 7. 高级设置

点击右上角的设置图标（⚙️）打开设置面板，可以调整：

- **主题外观**：切换深色/浅色模式
- **图像生成设置**：调整分辨率和比例
- **Google Search Grounding**：开启后允许模型通过 Google 搜索获取实时信息
- **思维链开关**：显示/隐藏模型的思考过程
- **流式响应**：逐 token 流式传输或一次性响应
- **数据管理**：清除对话历史或重置 API Key

## 📂 项目结构

```
├── components/               # UI 组件
│   ├── games/                   # 街机模式小游戏 (Snake, Dino, 2048, Life)
│   ├── ui/                      # 通用 UI 组件 (Toast, Dialog)
│   ├── ApiKeyModal.tsx          # API Key 输入弹窗
│   ├── ChatInterface.tsx        # 主聊天区域
│   ├── InputArea.tsx            # 输入框与文件上传 (支持拖拽)
│   ├── MessageBubble.tsx        # 消息气泡与 Markdown 渲染 (支持下载)
│   ├── SettingsPanel.tsx        # 设置面板 (含余额显示)
│   ├── ImageHistoryPanel.tsx    # 图片历史记录面板 ✨
│   ├── PipelineModal.tsx        # Pipeline编排面板 (串行/并行/组合) ✨
│   └── ThinkingIndicator.tsx    # 思维链指示器与游戏入口
├── services/                 # 服务层
│   ├── geminiService.ts         # Google GenAI SDK 集成
│   ├── balanceService.ts        # API 余额查询服务 ✨
│   └── pipelineTemplateService.ts # Pipeline模板加载服务 ✨
├── store/                    # 状态管理
│   ├── useAppStore.ts           # 应用核心状态 (含图片历史)
│   └── useUiStore.ts            # UI 交互状态 (含Pipeline状态)
├── utils/                    # 工具函数
│   ├── messageUtils.ts          # 消息处理工具
│   └── soundUtils.ts            # 音效处理工具
├── public/templates/         # Pipeline预设模板 ✨
│   ├── style-transfer.json      # 风格迁移模板
│   ├── progressive-enhancement.json # 渐进优化模板
│   ├── multi-style-exploration.json # 多风格探索模板
│   ├── dataset-generation.json  # 数据集生成模板
│   └── batch-combination.json   # 批量组合模板
├── types.ts                  # TypeScript 类型定义
├── App.tsx                   # 根组件
├── index.tsx                 # 入口文件
└── CLAUDE.md                 # 项目开发文档 ✨
```

## 🎯 功能对比

| 功能 | 原版 | 当前版本 |
|------|------|----------|
| 图片上传 | ✅ 点击上传 | ✅ 点击 + 拖拽上传 |
| 图片下载 | ❌ 需右键另存为 | ✅ 悬停一键下载 |
| 图片历史 | ❌ 无 | ✅ 自动收集 + 预览 |
| API 余额 | ❌ 无 | ✅ 实时查询显示 |
| Pipeline编排 | ❌ 无 | ✅ 串行/并行/组合三种模式 |
| 批量处理 | ❌ 无 | ✅ 支持 JSON 模板 + 自定义工作流 |
| 项目文档 | ⚠️ 基础 README | ✅ README + CLAUDE.md |

## 📝 开发文档

详细的技术架构和开发指南请查看 [CLAUDE.md](./CLAUDE.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

AGPL-3.0

## 🙏 致谢

- 参考项目：faithleysath/UndyDraw
- API 赞助：[Kuai API](https://api.kuai.host/register?aff=z2C8)
