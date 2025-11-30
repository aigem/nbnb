import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, ExternalLink } from 'lucide-react';
import { PromptItem } from '../types';
import { fetchPrompts, getCategories } from '../services/promptService';

interface PromptQuickPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  searchQuery?: string;
}

export const PromptQuickPicker: React.FC<PromptQuickPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  searchQuery = '',
}) => {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<PromptItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['全部']);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredPrompt, setHoveredPrompt] = useState<PromptItem | null>(null);
  const [search, setSearch] = useState(searchQuery);
  const [isLoading, setIsLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 加载提示词数据
  useEffect(() => {
    if (isOpen && prompts.length === 0) {
      loadPrompts();
    }
  }, [isOpen]);

  // 聚焦搜索框
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 过滤提示词（支持分类和搜索）
  useEffect(() => {
    let filtered = prompts;

    // 先按分类筛选
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // 再按搜索词筛选
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(query) ||
          p.prompt.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.author.toLowerCase().includes(query)
      );
    }

    setFilteredPrompts(filtered);
    setSelectedIndex(0);
  }, [search, prompts, selectedCategory]);

  // 滚动到选中项
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // 自动设置预览为当前选中项
  useEffect(() => {
    if (filteredPrompts[selectedIndex] && !hoveredPrompt) {
      setHoveredPrompt(filteredPrompts[selectedIndex]);
    }
  }, [selectedIndex, filteredPrompts]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPrompts();
      setPrompts(data);
      setFilteredPrompts(data);
      setCategories(getCategories(data));
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredPrompts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPrompts[selectedIndex]) {
          handleSelect(filteredPrompts[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleSelect = (prompt: PromptItem) => {
    onSelect(prompt.prompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        tabIndex={-1}
      />

      {/* 快速选择器 */}
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-6xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden">

          {/* 搜索框 */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gradient-to-r from-amber-50 to-amber-50 dark:from-gray-800 dark:to-gray-900">
            <Search className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索提示词..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-sm"
            />
            <button
              onClick={onClose}
              className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 分类筛选 */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 主体区域：左右布局 */}
          <div className="flex h-[500px]">
            {/* 左侧：提示词列表 */}
            <div className="flex-1 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto overscroll-contain"
                onKeyDown={handleKeyDown}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Sparkles className="h-6 w-6 animate-pulse" />
                      <span className="text-sm">加载中...</span>
                    </div>
                  </div>
                ) : filteredPrompts.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-6 w-6" />
                      <span className="text-sm">未找到匹配的提示词</span>
                    </div>
                  </div>
                ) : (
                  filteredPrompts.map((prompt, index) => (
                    <div
                      key={`${prompt.title}-${prompt.category}`}
                      onClick={() => handleSelect(prompt)}
                      onMouseEnter={() => setHoveredPrompt(prompt)}
                      className={`px-4 py-3 cursor-pointer transition border-b border-gray-100 dark:border-gray-700/50 last:border-0 ${
                        index === selectedIndex
                          ? 'bg-amber-50 dark:bg-amber-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* 序号 */}
                        <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium ${
                          index === selectedIndex
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {index + 1}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {prompt.title}
                            </h3>
                            <span className="shrink-0 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              {prompt.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {prompt.prompt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 左侧底部提示 */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-mono">↑↓</kbd>
                      导航
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-mono">Enter</kbd>
                      选择
                    </span>
                    提示词来源于： <a
                      href="https://github.com/glidea/banana-prompt-quicker"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      Banana Prompt Quicker
                    </a>
                  </div>
                  <span>{filteredPrompts.length} 个结果</span>
                </div>
              </div>
            </div>

            {/* 右侧：详情预览 */}
            <div className="w-80 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
              {hoveredPrompt ? (
                <PromptDetailPreview prompt={hoveredPrompt} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">悬停查看详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// 提示词详情预览组件
interface PromptDetailPreviewProps {
  prompt: PromptItem;
}

const PromptDetailPreview: React.FC<PromptDetailPreviewProps> = ({ prompt }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="p-4 space-y-4">
      {/* 预览图 */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-gray-400 animate-pulse" />
              </div>
            )}
            <img
              src={prompt.preview}
              alt={prompt.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <Sparkles className="h-12 w-12" />
          </div>
        )}
      </div>

      {/* 标题和标签 */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">
          {prompt.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            {prompt.category}
          </span>
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            {prompt.mode === 'edit' ? '编辑' : '生成'}
          </span>
        </div>
      </div>

      {/* 提示词内容 */}
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          提示词内容
        </div>
        <div className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
          {prompt.prompt}
        </div>
      </div>

      {/* 作者信息 */}
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          作者
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {prompt.author}
        </div>
      </div>

      {/* 查看详情链接 */}
      {prompt.link && (
        <a
          href={prompt.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition"
        >
          <ExternalLink className="h-4 w-4" />
          查看详情
        </a>
      )}
    </div>
  );
};
