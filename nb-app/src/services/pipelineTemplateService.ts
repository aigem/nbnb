import { PipelineTemplate } from '../types';

// 所有模板文件路径
const TEMPLATE_FILES = [
  '/templates/style-transfer.json',
  '/templates/progressive-enhancement.json',
  '/templates/multi-style-exploration.json',
  '/templates/dataset-generation.json',
  '/templates/batch-combination.json'
];

// 内存缓存
let cachedTemplates: PipelineTemplate[] | null = null;

/**
 * 加载所有管道模板
 * @returns Promise<PipelineTemplate[]>
 */
export async function loadPipelineTemplates(): Promise<PipelineTemplate[]> {
  // 如果已有缓存，直接返回
  if (cachedTemplates) {
    return cachedTemplates;
  }

  try {
    const templates: PipelineTemplate[] = [];

    // 并发加载所有模板文件
    const promises = TEMPLATE_FILES.map(async (filePath) => {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          console.error(`Failed to load template: ${filePath}`);
          return null;
        }
        const template: PipelineTemplate = await response.json();
        return template;
      } catch (error) {
        console.error(`Error loading template ${filePath}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);

    // 过滤掉加载失败的模板
    for (const template of results) {
      if (template) {
        templates.push(template);
      }
    }

    // 缓存结果
    cachedTemplates = templates;

    return templates;
  } catch (error) {
    console.error('Error loading pipeline templates:', error);
    return [];
  }
}

/**
 * 清除缓存（用于开发或需要重新加载时）
 */
export function clearTemplateCache(): void {
  cachedTemplates = null;
}

/**
 * 按模式筛选模板
 * @param templates 所有模板
 * @param mode 执行模式
 */
export function filterTemplatesByMode(
  templates: PipelineTemplate[],
  mode: 'serial' | 'parallel' | 'combination'
): PipelineTemplate[] {
  return templates.filter(t => t.mode === mode);
}
