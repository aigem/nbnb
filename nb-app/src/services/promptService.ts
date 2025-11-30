import { PromptItem } from '../types';

// 多重数据源（按优先级排序）
const PROMPT_SOURCES = [
  '/api/prompts', // Vercel Edge Function (开发环境通过 Vite 代理到 jsDelivr)
  'https://cdn.jsdelivr.net/gh/glidea/banana-prompt-quicker@main/prompts.json', // jsDelivr CDN
  'https://raw.githubusercontent.com/glidea/banana-prompt-quicker/main/prompts.json', // GitHub Raw
  'https://glidea.github.io/banana-prompt-quicker/prompts.json', // GitHub Pages 备用
];

const CACHE_KEY = 'prompt_library_cache';
const CACHE_VERSION = 'v3'; // 更改版本号会清除旧缓存
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天（提示词数据不常更新）

// 内存缓存层（避免重复解析 localStorage）
let memoryCache: PromptItem[] | null = null;
let memoryCacheTimestamp = 0;

interface CachedData {
  prompts: PromptItem[];
  timestamp: number;
  version?: string; // 缓存版本号
}

/**
 * 从缓存或 API 获取提示词数据（优化版：内存缓存 + 多源备用 + 预加载）
 */
export async function fetchPrompts(): Promise<PromptItem[]> {
  try {
    // 1. 首先检查内存缓存（最快）
    const memoryCached = getMemoryCachedPrompts();
    if (memoryCached) {
      console.log('✓ Prompts loaded from memory cache');
      return memoryCached;
    }

    // 2. 检查 localStorage 缓存
    const cached = getCachedPrompts();
    if (cached) {
      console.log('✓ Prompts loaded from localStorage cache');
      // 更新内存缓存
      memoryCache = cached;
      memoryCacheTimestamp = Date.now();
      return cached;
    }

    // 3. 缓存过期或不存在，从多个源依次尝试获取
    console.log('Cache miss, fetching from remote sources...');
    const validPrompts = await fetchFromMultipleSources();

    // 4. 缓存数据到内存和 localStorage
    memoryCache = validPrompts;
    memoryCacheTimestamp = Date.now();
    cachePrompts(validPrompts);

    console.log(`✓ Fetched ${validPrompts.length} prompts successfully`);
    return validPrompts;
  } catch (error) {
    console.error('❌ Failed to fetch prompts:', error);

    // 如果所有源都失败，尝试返回过期的缓存数据（降级策略）
    const staleCache = getStaleCache();
    if (staleCache) {
      console.warn('⚠ Using stale cache as fallback');
      return staleCache;
    }

    throw new Error('无法获取提示词数据，请检查网络连接后重试');
  }
}

/**
 * 从多个数据源依次尝试获取（容错机制）
 */
async function fetchFromMultipleSources(): Promise<PromptItem[]> {
  const errors: string[] = [];

  for (let i = 0; i < PROMPT_SOURCES.length; i++) {
    const source = PROMPT_SOURCES[i];
    try {
      console.log(`Trying source ${i + 1}/${PROMPT_SOURCES.length}: ${source}`);

      const response = await fetch(source, {
        headers: {
          'Accept': 'application/json',
        },
        // 10秒超时
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 验证数据格式
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected array');
      }

      // 过滤并验证每个提示词项
      const validPrompts: PromptItem[] = data.filter(isValidPromptItem);

      if (validPrompts.length === 0) {
        throw new Error('No valid prompts found in data');
      }

      console.log(`✓ Successfully fetched from source ${i + 1}: ${validPrompts.length} prompts`);
      return validPrompts;
    } catch (error) {
      const errorMsg = `Source ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.warn(errorMsg);
      // 继续尝试下一个源
      continue;
    }
  }

  // 所有源都失败
  throw new Error(`All sources failed:\n${errors.join('\n')}`);
}

/**
 * 从内存缓存读取提示词（性能最优）
 */
function getMemoryCachedPrompts(): PromptItem[] | null {
  if (!memoryCache || memoryCache.length === 0) {
    return null;
  }

  const now = Date.now();
  // 检查内存缓存是否过期
  if (now - memoryCacheTimestamp > CACHE_DURATION) {
    memoryCache = null;
    memoryCacheTimestamp = 0;
    return null;
  }

  return memoryCache;
}

/**
 * 从 localStorage 缓存读取提示词(仅返回未过期的数据)
 */
function getCachedPrompts(): PromptItem[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    const now = Date.now();

    // 检查缓存版本，版本不匹配则清除旧缓存
    if (data.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // 检查缓存是否过期
    if (now - data.timestamp > CACHE_DURATION) {
      return null;
    }

    return data.prompts;
  } catch (error) {
    console.error('Failed to read cache:', error);
    return null;
  }
}

/**
 * 获取过期的缓存数据(网络请求失败时的备选方案)
 */
function getStaleCache(): PromptItem[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    return data.prompts;
  } catch (error) {
    return null;
  }
}

/**
 * 缓存提示词数据
 */
function cachePrompts(prompts: PromptItem[]): void {
  try {
    const data: CachedData = {
      prompts,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to cache prompts:', error);
    // 缓存失败不影响主流程,静默失败
  }
}

/**
 * 验证提示词项是否有效
 */
function isValidPromptItem(item: any): item is PromptItem {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.title === 'string' &&
    typeof item.preview === 'string' &&
    typeof item.prompt === 'string' &&
    typeof item.author === 'string' &&
    typeof item.link === 'string' &&
    (item.mode === 'edit' || item.mode === 'generate') &&
    typeof item.category === 'string'
  );
}

/**
 * 获取所有唯一的分类
 */
export function getCategories(prompts: PromptItem[]): string[] {
  const categories = new Set<string>();
  prompts.forEach(p => { categories.add(p.category); });
  return ['全部', ...Array.from(categories).sort()];
}

/**
 * 清除所有缓存（内存 + localStorage）
 */
export function clearPromptsCache(): void {
  try {
    // 清除内存缓存
    memoryCache = null;
    memoryCacheTimestamp = 0;
    // 清除 localStorage 缓存
    localStorage.removeItem(CACHE_KEY);
    console.log('✓ Prompts cache cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

/**
 * 预加载提示词数据（后台静默加载，不阻塞UI）
 */
export function preloadPrompts(): void {
  // 使用 setTimeout 确保不阻塞主线程
  setTimeout(async () => {
    try {
      console.log('🔄 Preloading prompts in background...');
      await fetchPrompts();
    } catch (error) {
      // 预加载失败静默处理，不影响用户体验
      console.warn('Preload failed (non-critical):', error);
    }
  }, 2000); // 应用启动 2 秒后预加载
}
