import { lazy, ComponentType } from 'react';

// 定义组件导入函数的类型
type ComponentImport<T extends ComponentType<any>> = () => Promise<{ default: T }>;

/**
 * 重试导入逻辑
 */
const retryImport = async <T>(
  fn: () => Promise<T>, 
  retriesLeft: number, 
  interval: number
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retriesLeft === 0) {
      throw error;
    }
    // 指数退避或固定间隔，这里使用固定间隔
    await new Promise(resolve => setTimeout(resolve, interval));
    return retryImport(fn, retriesLeft - 1, interval);
  }
};

/**
 * 带有重试机制的 React.lazy
 * @param componentImport 动态导入函数，例如 () => import('./MyComponent')
 * @param retries 重试次数，默认为 3
 * @param interval 重试间隔（毫秒），默认为 1500
 */
export const lazyWithRetry = <T extends ComponentType<any>>(
  componentImport: ComponentImport<T>,
  retries = 3,
  interval = 1500
) => {
  return lazy(async () => {
    return retryImport(componentImport, retries, interval);
  });
};

/**
 * 预加载组件资源
 * @param componentImports 动态导入函数数组
 */
export const preloadComponents = (componentImports: (() => Promise<any>)[]) => {
  const runPreload = () => {
    componentImports.forEach(importFn => {
      try {
        importFn();
      } catch (error) {
        console.warn('Preload failed', error);
      }
    });
  };

  // 使用 requestIdleCallback 在浏览器空闲时加载
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPreload);
  } else {
    // 降级方案：延迟执行
    setTimeout(runPreload, 2000);
  }
};
