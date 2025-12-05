# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nbnb (NB Nano Banana) is a pure frontend web application built with React/Preact that provides a chat interface for interacting with Google's Gemini 3 Pro AI model. The application supports multimodal inputs (text and images), displays AI thinking processes, includes mini-games for waiting periods, and manages image history with persistent storage.

**Key Features:**
- **Multimodal Chat**: Text and image inputs with streaming responses
- **Pipeline Orchestration**: Serial and parallel image generation workflows with step-level model selection
- **Batch Generation**: Normal batch mode for repeated generations
- **Image Re-editing**: Click generated images to use as reference in new generations
- **Prompt Library**: Built-in curated prompt templates from GitHub
- **Quick Prompt Picker**: Trigger with `/t` for fast prompt selection
- **Image History**: Persistent storage with thumbnail optimization
- **Arcade Mode**: Mini-games during AI thinking periods
- **Black-Gold Aesthetic**: Amber/gold color scheme throughout the UI
- **PWA Support**: Installable as standalone app

**Key Architecture Decisions:**
- **Preact Aliasing**: Uses Preact instead of React for smaller bundle size. All React imports are aliased to `preact/compat` in both `vite.config.ts` and `tsconfig.json`
- **Pure Frontend**: No backend server - all API calls go directly to Gemini endpoints from the browser
- **Persistent Storage**: Uses IndexedDB (via `idb-keyval`) for large data (images) and Zustand persistence for settings/metadata
- **Image Storage Strategy**: Thumbnails stored in Zustand state, full images stored separately in IndexedDB to avoid state bloat
- **Lazy API Key Check**: API key is only validated when user attempts to generate content, not on app startup

## Development Commands

### Build and Development
```bash
# Install dependencies (must use Bun, enforced by preinstall hook)
bun install

# Start dev server (runs on http://localhost:3000)
bun dev

# Build for production
bun build

# Preview production build
bun preview
```

**Note:** This project enforces Bun as the package manager through a `preinstall` script. Using npm/yarn/pnpm will fail.

## State Management Architecture

### Two-Store Pattern
The application uses two separate Zustand stores:

1. **`useAppStore`** (`src/store/useAppStore.ts`) - Persistent application state:
   - API key, settings, chat messages
   - Image history (thumbnails only, full images in IndexedDB)
   - Balance information
   - Persisted to IndexedDB via custom storage adapter

2. **`useUiStore`** (`src/store/useUiStore.ts`) - Ephemeral UI state:
   - Modal/panel visibility
   - Toasts and dialogs
   - Batch generation mode (`'off' | 'normal'`)
   - Pending reference image for re-editing
   - Temporary references (attachments, abort controllers)
   - NOT persisted

### Pipeline Orchestration

The application supports advanced pipeline orchestration for complex image generation workflows (`PipelineModal.tsx`, `ChatInterface.tsx`):

**Execution Modes:**

1. **Serial Mode** (`'serial'`):
   - Steps execute sequentially
   - Each step uses the previous step's output as input
   - Use case: Progressive refinement, style transformation
   - Example: Photo → Sketch → Watercolor → Enhanced Details
   - Failure strategy: One step fails, entire pipeline stops

2. **Parallel Mode** (`'parallel'`):
   - All steps execute simultaneously
   - All steps share the same initial images
   - Use case: Multi-style exploration, variant generation
   - Example: Photo → [Anime, Oil Painting, Cyberpunk, Minimalist] (all at once)
   - Failure strategy: Individual failures don't affect other tasks
   - **Display**: All generated images appear in a single model message

3. **Combination Mode** (`'combination'`):
   - Cartesian product: Each image × Each prompt
   - Generates n×m outputs (n images × m prompts)
   - Use case: Batch style transfer, dataset generation with variations
   - Example: 2 photos × 3 style prompts = 6 generated images
   - Failure strategy: Individual failures don't affect other tasks
   - **Display**: All generated images appear in a single model message

**Step-Level Features:**
- **Model Selection**: Each step can specify a different model (Gemini 3 Pro, 2.5 Flash, etc.)
- **Custom Prompts**: Each step has independent prompt input
- **Reordering**: Serial mode supports step reordering (up/down buttons)
- **Multi-Image Support**: Supports 1-14 initial reference images

**Preset Templates:**

The application uses a JSON-based template system for pipeline presets. Templates are stored as individual JSON files in `public/templates/`:

Available Templates:
- `style-transfer.json` - 风格迁移 (Style Transfer) - Serial, 3 steps
- `progressive-enhancement.json` - 渐进优化 (Progressive Enhancement) - Serial, 3 steps
- `multi-style-exploration.json` - 多风格探索 (Multi-Style Exploration) - Parallel, 4 steps
- `dataset-generation.json` - 快速炼丹数据集生成 (Dataset Generation) - Parallel, 10 steps
- `batch-combination.json` - 批量组合生成 (Batch Combination) - Combination, 3 steps

**Template Management:**
- **Template Service**: `src/services/pipelineTemplateService.ts` handles loading and caching
- **Template Loading**: Templates are fetched from `/templates/*.json` on component mount
- **Caching**: In-memory cache to avoid redundant network requests
- **Adding New Templates**:
  1. Create a new JSON file in `public/templates/` with the structure:
     ```json
     {
       "name": "模板名称",
       "description": "模板描述",
       "mode": "serial" | "parallel" | "combination",
       "steps": ["step1 prompt", "step2 prompt", ...]
     }
     ```
  2. Add the file path to `TEMPLATE_FILES` array in `pipelineTemplateService.ts`
- **Modifying Templates**: Edit the JSON files directly - changes take effect on page reload

**Implementation Details:**
- Pipeline state stored in `useUiStore` (ephemeral)
- Execution engine: `executeSerialPipeline()` and `executeParallelPipeline()` in `ChatInterface.tsx`
- Model switching: Temporarily switches settings per step, restores after completion
- Progress tracking: Reuses batch progress bar
- Template loading: Dynamic fetch with error handling and loading states

### Batch Generation Mode

The application also supports simple batch generation (`InputArea.tsx`):

**Normal Batch** (`'normal'`):
- Repeat the same prompt + images N times (1-4)
- User selects count via number buttons
- Example: Generate 4 random variations of the same concept
- All batch tasks execute sequentially with 500ms delay between generations to avoid rate limiting

### Image History Storage Pattern
Images use a split storage approach to optimize performance:
- **State (Zustand)**: Stores thumbnails (~200x200px) and metadata
- **IndexedDB**: Stores full-resolution images keyed by `image_data_${id}`
- **Migration**: `cleanInvalidHistory()` migrates old format (full images in state) to new format

## Prompt Library Data Management

### Prompt Service (`src/services/promptService.ts`)

The prompt library uses a robust multi-layer caching and failover system for optimal performance and reliability:

**Data Sources (Priority Order):**
1. `/api/prompts` - Vercel Edge Function with CDN caching (production) or Vite proxy to jsDelivr (development)
2. `https://cdn.jsdelivr.net/gh/...` - jsDelivr CDN (国内访问友好)
3. `https://raw.githubusercontent.com/...` - GitHub Raw (备用)
4. `https://glidea.github.io/...` - GitHub Pages (最后备用)

**Caching Strategy (3-Tier):**
1. **Memory Cache** (fastest, 7 days TTL)
   - In-memory array of prompts
   - Zero parsing overhead
   - Cleared on page refresh

2. **localStorage Cache** (persistent, 7 days TTL)
   - Survives page refresh
   - Versioned cache (v3) - auto-clears on version mismatch
   - JSON parsing only when memory cache misses

3. **Stale Cache Fallback**
   - If all network sources fail
   - Returns expired cache data
   - Graceful degradation

**Preloading:**
- Automatic background preload 2 seconds after app mount
- Non-blocking, silent failure
- Ensures instant open on first user interaction

**Failover Mechanism:**
- Sequential source attempts with detailed error logging
- 10-second timeout per source
- Continues to next source on failure
- Aggregated error reporting

**Development Environment:**
- Vite proxy configured: `/api/prompts` → jsDelivr CDN
- No need for Vercel deployment to test locally

## API Integration

### Gemini Service (`src/services/geminiService.ts`)
Handles communication with Google GenAI SDK:

**Key Functions:**
- `streamGeminiResponse()`: Streaming API calls (default)
- `generateContent()`: Non-streaming API calls
- Both functions filter out `thought` parts from history before sending to API
- Error handling includes Chinese error messages for common API errors (401, 403, 429, etc.)

**Configuration:**
- Custom endpoint: `settings.customEndpoint` (default: `https://api.kuai.host`)
- Model name: `settings.modelName` (default: `gemini-3-pro-image-preview`)
- Supports Google Search Grounding via `settings.useGrounding`
- Thinking process visibility via `settings.enableThinking`

### Balance Service (`src/services/balanceService.ts`)
Queries API balance from OpenAI-compatible endpoints:
- Fetches subscription limit: `/v1/dashboard/billing/subscription`
- Fetches usage (100 days): `/v1/dashboard/billing/usage`
- Supports "unlimited" accounts (hardLimitUsd >= 100000000)

## Component Architecture

### Lazy Loading Strategy
All heavy components are lazy-loaded with retry logic (`src/utils/lazyLoadUtils.ts`):
- `ApiKeyModal`, `SettingsPanel`, `ImageHistoryPanel`, `PromptLibraryPanel`
- All game components (`SnakeGame`, `DinoGame`, `LifeGame`, `Puzzle2048`)
- Preloaded after initial mount to prepare for user interaction

### Main Component Flow
1. **`App.tsx`**: Root component, handles theme, PWA install prompt, header navigation
2. **`ChatInterface.tsx`**: Message list and scroll management
3. **`InputArea.tsx`**: Text input + image upload (supports drag-and-drop)
4. **`MessageBubble.tsx`**: Renders individual messages with Markdown + image download
5. **`ThinkingIndicator.tsx`**: Shows AI thinking animation and arcade mode entry

### Arcade Mode (Waiting Games)
When AI is thinking (with `enableThinking: true`), users can play mini-games:
- Triggered via gamepad icon in `ThinkingIndicator`
- Games: Snake, Dino Runner, 2048, Conway's Game of Life
- Auto-adapts to current theme and device type

## Type System (`src/types.ts`)

### Core Types
- **`Part`**: Text or image content, optionally marked as `thought` (thinking process)
- **`Content`**: Array of parts with role (`user` | `model`)
- **`ChatMessage`**: Extends Content with id, timestamp, error state, thinking duration
- **`Attachment`**: File + preview + base64 data for API
- **`ImageHistoryItem`**: Thumbnail + metadata, optional full base64 (stored in IDB)

## Configuration and URL Parameters

### Supported URL Parameters
- `?apikey=xxx`: Pre-fill API key
- `?endpoint=https://example.com`: Override API endpoint
- `?model=gemini-xyz`: Override model name

### Settings (`AppSettings` type)
- Resolution: `'1K' | '2K' | '4K'`
- Aspect ratio: `'Auto' | '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9'`
- Model selection: `'gemini-3-pro-image-preview' | 'gemini-2.5-flash-image-preview' | 'gemini-2.5-flash-image'`
- Google Search Grounding toggle
- Thinking process visibility
- Stream vs non-stream response
- Theme: `'light' | 'dark' | 'system'`

### UI Theme
The application uses a **black-gold aesthetic** with amber (#F59E0B) as the primary accent color:
- Primary buttons and active states: Amber/Gold
- Icons and highlights: Amber shades
- Background: Black/Dark gray to White gradient
- All interactive elements use amber for hover/focus states

### Mobile Responsiveness
The application is fully optimized for mobile devices with responsive design:

**Mobile Camera Upload:**
- Camera button (📷) visible only on mobile devices (< 640px)
- Uses HTML5 `capture="environment"` to access device camera
- Directly opens camera app for photo capture
- Available in both InputArea and PipelineModal
- Touch-friendly button sizing and placement

**Settings Panel Mobile Optimization:**
- Always accessible via Settings button in header (no longer requires API key)
- Slides in from right as 90% width overlay (shows backdrop on left)
- Compact spacing and font sizes on mobile (using Tailwind `sm:` breakpoints)
- Touch-friendly buttons and controls (minimum 40px touch targets)
- Sticky header with close button for easy dismissal
- Smooth slide-in/slide-out animations (300ms transition)
- Backdrop click to close on mobile

**Mobile-Specific Features:**
- Text sizes scale down appropriately: `text-xs sm:text-sm`, `text-[10px] sm:text-xs`
- Icon sizes: `h-3.5 w-3.5 sm:h-4 sm:w-4` for compact display
- Padding: `p-2 sm:p-3`, `p-2.5 sm:p-3` for tighter mobile layouts
- Gaps: `gap-1.5 sm:gap-2` for optimized spacing
- Toggle switches scaled to mobile: `h-5 w-9 sm:h-6 sm:w-11`
- Bottom safe area support with `pb-safe` class
- Settings button shows active state (amber highlight) when panel is open

**Responsive Breakpoints:**
- Mobile: < 640px (compact, touch-optimized)
- Desktop: ≥ 640px (spacious, mouse-optimized)

**Key Mobile UX Patterns:**
- Full-height overlay panels on mobile
- Backdrop dimming with blur effect
- Gesture-friendly dismiss (backdrop tap)
- Reduced animation duration for snappier feel
- Always-visible settings access (not hidden behind API key requirement)

## Key User Features

### Image Re-editing
Users can click generated images to use them as reference in new generations:

1. **Conversation Images** (`MessageBubble.tsx`):
   - Hover over generated images to see "再次编辑" (Edit) button
   - Click to add image to input attachments automatically

2. **History Images** (`ImageHistoryPanel.tsx`):
   - Grid view: Hover shows amber edit button
   - Lightbox view: Bottom action bar includes "再次编辑" button
   - Click to add to input and close panel

Implementation uses `pendingReferenceImage` state in `useUiStore` that `InputArea` monitors and auto-converts to attachment.

### Prompt Quick Selection
- Type `/t` in input to trigger `PromptQuickPicker`
- Replaces `/t` with selected prompt
- Keyboard navigation: Arrow keys + Enter
- Categories filterable

### API Key Handling
- No longer checks for API key on app startup
- Modal only appears when user attempts generation without key
- **Always-visible Key icon button** in header allows users to set/change API key anytime
- Balance display only shows when API key is present
- Clear API Key button in settings only appears when key exists
- Header buttons (GitHub, theme toggle, Key) always visible for better UX

## PWA Support

- Service worker via `vite-plugin-pwa`
- Manifest configured for standalone mode
- Install prompt captured and shown in header
- Theme color dynamically updated based on dark/light mode

## Testing Features

### Testing Image Upload and Re-edit
1. **Upload**: Click camera icon, drag images, paste anywhere, or **tap camera button to take photo (mobile only)**
2. **Re-edit from conversation**:
   - Generate an image
   - Hover over the generated image in chat
   - Click amber "再次编辑" button
   - Image appears in input attachment area
3. **Re-edit from history**:
   - Click image history icon (with amber pulse badge)
   - Hover over thumbnail → click amber edit button
   - OR click thumbnail → click "再次编辑" in lightbox modal

### Testing Pipeline Orchestration

1. **Serial Mode**:
   - Click "批量编排(实验功能)" button (purple)
   - Select "串行模式"
   - Upload 1 image (or tap camera button on mobile to take photo)
   - Add 3 steps with custom prompts
   - Optionally select different models per step
   - Click "开始执行"
   - Observe step-by-step transformation

2. **Parallel Mode**:
   - Click "批量编排(实验功能)" button
   - Select "并行模式"
   - Upload 1 image (or tap camera button on mobile)
   - Click "多风格探索" template
   - Click "开始执行"
   - **Expected**: All 4 generated images appear in a single model message
   - Check image history to see all individual images

3. **Step-Level Model Selection**:
   - Serial mode with 3 steps
   - Step 1: Use "Gemini 3 Pro"
   - Step 2: Use "Gemini 2.5 Flash"
   - Step 3: Use "Default"
   - Verify each step uses the specified model

### Testing Batch Generation
1. **Normal Batch**:
   - Click "普通批量" button
   - Select count (1-4)
   - Enter prompt + optional images
   - Send to generate N variations

### Testing Prompt Features
1. **Quick Picker**: Type `/t` in input to trigger selector
2. **Prompt Library**: Click Sparkles icon in header (requires API key)

### Testing Image History
1. Generate images via chat
2. Click image icon in header (with amber pulse badge)
3. View grid, click for full preview with prompt details
4. Download individual or clear all
5. Test re-edit from both grid and lightbox views

## Common Development Patterns

### Adding New Settings
1. Update `AppSettings` interface in `src/types.ts`
2. Add default value in `useAppStore` initial state
3. Add UI control in `SettingsPanel.tsx`
4. Use via `settings` object in relevant components

### Adding New UI State
1. Add to `useUiStore` if non-persistent (modals, panels)
2. Add to `useAppStore` only if needs persistence

### Error Handling
- Gemini errors are caught and formatted in Chinese via `formatGeminiError()`
- Toast notifications for user feedback (via `useUiStore` actions)
- Global dialog for important alerts (via `GlobalDialog` component)

## Build Configuration

### Vite Config (`vite.config.ts`)
- Server runs on port 3000, host 0.0.0.0
- Manual chunks: `google-genai`, `markdown-libs` (optimizes caching)
- Preact aliases configured for React compatibility
- PWA with auto-update and dev mode enabled

### TypeScript Config (`tsconfig.json`)
- Target: ES2022
- JSX Import Source: `preact`
- Path alias: `@/*` → `./src/*`
- React/React-DOM aliased to Preact compat

## Known Issues and Constraints

- Balance API only works with OpenAI-compatible endpoints (not native Gemini API)
- Some models don't support thinking mode - disable `enableThinking` if errors occur
- Image uploads limited to 14 attachments per message
- History limited to 100 images (oldest auto-pruned)
