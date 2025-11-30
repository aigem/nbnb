import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useUiStore } from '../store/useUiStore';
import { get as getItem } from 'idb-keyval';
import { X, Download, Trash2, ImageIcon, Search, Copy, ArrowRight, ArrowLeft, RefreshCw, Loader2, Edit } from 'lucide-react';
import { ImageHistoryItem } from '../types';
import { downloadImage } from '../utils/imageUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageHistoryPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { imageHistory, clearImageHistory, deleteImageFromHistory, setInputText, cleanInvalidHistory } = useAppStore();
  const { showDialog, addToast, setPendingReferenceImage } = useUiStore();
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);
  const [fullResData, setFullResData] = useState<string | null>(null);
  const [loadingFullRes, setLoadingFullRes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 自动清理无效历史记录
  useEffect(() => {
    cleanInvalidHistory();
  }, [cleanInvalidHistory]);

  // 加载大图数据
  useEffect(() => {
    if (selectedImage) {
        setLoadingFullRes(true);
        getItem(`image_data_${selectedImage.id}`)
            .then((data) => {
                if (data) {
                    setFullResData(data as string);
                } else {
                    // 如果找不到原图，尝试使用缩略图显示（虽然很模糊）
                    setFullResData(selectedImage.thumbnailData || null);
                }
            })
            .catch(err => {
                console.error("Failed to load full image", err);
                setFullResData(selectedImage.thumbnailData || null);
            })
            .finally(() => setLoadingFullRes(false));
    } else {
        setFullResData(null);
        setLoadingFullRes(false);
    }
  }, [selectedImage]);

  // Filter images based on search term
  const filteredHistory = useMemo(() => {
    // 基础过滤：必须包含缩略图数据才显示，避免破图
    let list = imageHistory.filter(item => !!item.thumbnailData);
    
    if (searchTerm.trim()) {
        list = list.filter((item) =>
          item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    return list;
  }, [imageHistory, searchTerm]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateImage(-1);
      if (e.key === 'ArrowRight') navigateImage(1);
      if (e.key === 'Escape') setSelectedImage(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, filteredHistory]);

  const navigateImage = (direction: -1 | 1) => {
    if (!selectedImage) return;
    const currentIndex = filteredHistory.findIndex(img => img.id === selectedImage.id);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < filteredHistory.length) {
      setSelectedImage(filteredHistory[newIndex]);
    }
  };

  const handleDownload = async (image: ImageHistoryItem, e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    let data: string | undefined;

    // 优先使用当前已加载的大图
    if (selectedImage?.id === image.id && fullResData) {
        data = fullResData;
    } else {
        // 否则异步从 IDB 获取
        try {
            data = await getItem(`image_data_${image.id}`);
        } catch (err) {
            console.error(err);
        }
    }

    if (data) {
        downloadImage(image.mimeType, data, `image-${image.timestamp}.${image.mimeType.split('/')[1]}`);
        addToast('图片已下载', 'success');
    } else {
        addToast('下载失败：找不到原图', 'error');
    }
  };

  const handleDeleteImage = (image: ImageHistoryItem, e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    showDialog({
      type: 'confirm',
      title: '删除图片',
      message: '确定要删除这张图片吗？此操作无法撤销。',
      confirmLabel: '删除',
      onConfirm: () => {
        deleteImageFromHistory(image.id);
        if (selectedImage?.id === image.id) setSelectedImage(null);
        addToast('图片已删除', 'success');
      }
    });
  };

  const handleReusePrompt = (prompt: string) => {
    setInputText(prompt);
    onClose(); // Close panel to go back to chat
    addToast('提示词已填入输入框', 'success');
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    addToast('提示词已复制', 'success');
  };

  const handleReEdit = async (image: ImageHistoryItem, e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    let data: string | undefined;

    // 优先使用当前已加载的大图
    if (selectedImage?.id === image.id && fullResData) {
      data = fullResData;
    } else {
      // 否则异步从 IDB 获取
      try {
        data = await getItem(`image_data_${image.id}`);
      } catch (err) {
        console.error(err);
      }
    }

    if (data) {
      setPendingReferenceImage({
        base64Data: data,
        mimeType: image.mimeType,
        timestamp: Date.now()
      });
      onClose(); // Close panel to return to chat
      addToast('图片已添加为参考图', 'success');
    } else {
      addToast('加载失败：找不到原图', 'error');
    }
  };

  const handleClearHistory = () => {
    showDialog({
      type: 'confirm',
      title: '清空图片历史',
      message: '确定要清空所有图片历史记录吗?此操作无法撤销。',
      confirmLabel: '清空',
      onConfirm: () => {
        clearImageHistory();
        addToast('图片历史已清空', 'success');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-950 shadow-2xl z-50 flex flex-col transition-transform duration-300">
        {/* Header */}
        <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-10">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">图片历史</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">({filteredHistory.length})</span>
            </div>
            <div className="flex items-center gap-2">
              {imageHistory.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition"
                  title="清空所有历史"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索提示词..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-amber-500 dark:text-white placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
              <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">
                {searchTerm ? '未找到匹配的图片' : '还没有生成过图片'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredHistory.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-pointer hover:ring-2 hover:ring-amber-500 transition shadow-sm"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={`data:${image.mimeType};base64,${image.thumbnailData}`}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                    }}
                  />

                  {/* Overlay Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleReEdit(image, e)}
                      className="p-1.5 rounded-md bg-amber-600/90 hover:bg-amber-500 text-white backdrop-blur-sm transition-colors"
                      title="再次编辑"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDownload(image, e)}
                      className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-colors"
                      title="下载"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteImage(image, e)}
                      className="p-1.5 rounded-md bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-sm transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Prompt Preview */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white line-clamp-2 drop-shadow-md">{image.prompt || '无描述'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-white/95 dark:bg-black/95 z-60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          {/* Navigation Buttons */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage(-1);
            }}
            disabled={filteredHistory.findIndex(img => img.id === selectedImage.id) === 0}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage(1);
            }}
            disabled={filteredHistory.findIndex(img => img.id === selectedImage.id) === filteredHistory.length - 1}
          >
            <ArrowRight className="h-6 w-6" />
          </button>

          <div 
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Image */}
            <div className="relative flex-1 min-h-0 flex items-center justify-center">
              {loadingFullRes ? (
                  <div className="flex flex-col items-center gap-2 text-white">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span>加载原图中...</span>
                  </div>
              ) : (
                  <img
                    src={`data:${selectedImage.mimeType};base64,${fullResData || selectedImage.thumbnailData}`}
                    alt={selectedImage.prompt}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                  />
              )}
            </div>

            {/* Info & Actions */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl p-4 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
                <div className="flex-1">
                   <p className="text-sm font-medium mb-1 line-clamp-2" title={selectedImage.prompt}>
                     {selectedImage.prompt || '无描述'}
                   </p>
                   <p className="text-xs text-gray-500 dark:text-gray-400">
                     {new Date(selectedImage.timestamp).toLocaleString()} 
                     {selectedImage.modelName && ` · ${selectedImage.modelName}`}
                   </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyPrompt(selectedImage.prompt)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-300 dark:hover:text-white transition"
                    title="复制提示词"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteImage(selectedImage)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:hover:text-red-300 transition"
                    title="删除图片"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                     onClick={() => setSelectedImage(null)}
                     className="sm:hidden p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                 <button
                  onClick={() => handleReEdit(selectedImage)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition"
                 >
                   <Edit className="h-4 w-4" />
                   <span>再次编辑</span>
                 </button>
                 <button
                  onClick={() => handleReusePrompt(selectedImage.prompt)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-lg font-medium transition"
                 >
                   <RefreshCw className="h-4 w-4" />
                   <span>用提示词</span>
                 </button>
                 <button
                  onClick={() => handleDownload(selectedImage)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg font-medium transition"
                 >
                   <Download className="h-4 w-4" />
                   <span>下载</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
