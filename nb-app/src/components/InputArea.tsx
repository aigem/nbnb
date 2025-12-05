import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ImagePlus, X, Square, Gamepad2, Sparkles, Layers, Workflow, Camera } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useUiStore } from '../store/useUiStore';
import { Attachment } from '../types';
import { PromptQuickPicker } from './PromptQuickPicker';

interface Props {
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  onOpenArcade?: () => void;
  isArcadeOpen?: boolean;
  onOpenPipeline?: () => void;
  disabled: boolean;
}

export const InputArea: React.FC<Props> = ({ onSend, onStop, onOpenArcade, isArcadeOpen, onOpenPipeline, disabled }) => {
  const { inputText, setInputText } = useAppStore();
  const { togglePromptLibrary, isPromptLibraryOpen, batchMode, batchCount, setBatchMode, setBatchCount, pendingReferenceImage, setPendingReferenceImage } = useUiStore();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isQuickPickerOpen, setIsQuickPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounter = useRef(0);

  // 监听待添加的参考图片
  useEffect(() => {
    if (pendingReferenceImage && attachments.length < 14) {
      const { base64Data, mimeType, timestamp } = pendingReferenceImage;

      // 创建一个虚拟 File 对象
      const fileName = `image-${timestamp}.${mimeType.split('/')[1]}`;
      const blob = base64ToBlob(`data:${mimeType};base64,${base64Data}`);
      const file = new File([blob], fileName, { type: mimeType });

      const newAttachment: Attachment = {
        file,
        preview: `data:${mimeType};base64,${base64Data}`,
        base64Data,
        mimeType
      };

      setAttachments(prev => [...prev, newAttachment].slice(0, 14));
      setPendingReferenceImage(null); // 清除待添加图片
    }
  }, [pendingReferenceImage, attachments.length, setPendingReferenceImage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if device is likely mobile/tablet based on screen width
    const isMobile = window.innerWidth < 768;

    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files) {
      await processFiles(Array.from(e.currentTarget.files));
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const processFiles = useCallback(async (files: File[]) => {
    const newAttachments: Attachment[] = [];

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
           const base64 = await fileToBase64(file);
           // Strip the data:image/jpeg;base64, part for the API payload
           const base64Data = base64.split(',')[1];

           newAttachments.push({
             file,
             preview: base64,
             base64Data,
             mimeType: file.type
           });
        } catch (err) {
           console.error("Error reading file", err);
        }
      }
    }

    setAttachments(prev => [...prev, ...newAttachments].slice(0, 14));
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (disabled || attachments.length >= 14) return;

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const imageFiles = Array.from(clipboardData.items)
        .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
        .map(item => item.getAsFile())
        .filter((file): file is File => !!file);

      if (imageFiles.length === 0) return;

      event.preventDefault();
      processFiles(imageFiles);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, processFiles, attachments.length]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current++;

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current--;

    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled || attachments.length >= 14) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if ((!inputText.trim() && attachments.length === 0) || disabled) return;

    onSend(inputText, attachments);
    setInputText('');
    setAttachments([]);
  };

  // 监听输入变化，检测 /t 触发
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    setInputText(value);

    // 检测 /t 触发（结尾是 /t 或 /t 后面跟着空格）
    if (value.endsWith('/t') || value.match(/\/t\s*$/)) {
      setIsQuickPickerOpen(true);
    }
  };

  // 处理快速选择器选择
  const handleQuickPickerSelect = (prompt: string) => {
    // 替换 /t 为实际提示词
    const newText = inputText.replace(/\/t\s*/g, prompt);
    setInputText(newText);
    setIsQuickPickerOpen(false);

    // 聚焦回输入框
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 pb-safe transition-colors duration-200">
      <div className="mx-auto max-w-4xl">

        {/* Batch Mode Selector */}
        {!disabled && (
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <button
                onClick={() => setBatchMode(batchMode === 'off' ? 'normal' : 'off')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  batchMode === 'normal'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                批量生成
              </button>

              {/* Pipeline Button */}
              {onOpenPipeline && (
                <button
                  onClick={onOpenPipeline}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/40"
                >
                  <Workflow className="h-3 w-3 inline mr-1" />
                  批量编排(实验功能)
                </button>
              )}

              {batchMode === 'normal' && (
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">数量:</span>
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBatchCount(num)}
                      className={`w-7 h-7 rounded text-xs font-medium transition ${
                        batchCount === num
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}

              {batchMode === 'normal' && (
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-auto">
                  将生成 {batchCount} 次
                </span>
              )}
            </div>
          </div>
        )}

        {/* Preview Area */}
        {attachments.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pt-3 pb-3 px-3 mb-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative h-20 w-20 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 group">
                <img
                  src={att.preview}
                  alt="preview"
                  className="h-full w-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition"
                />
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={`relative flex flex-wrap md:flex-nowrap items-end gap-1 rounded-2xl bg-gray-50 dark:bg-gray-800 p-2 shadow-inner ring-1 transition-all duration-200 ${
            isDragging
              ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-900/20'
              : 'ring-gray-200 dark:ring-gray-700/50 focus-within:ring-2 focus-within:ring-amber-500/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >

          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-amber-500/10 backdrop-blur-sm border-2 border-dashed border-amber-500">
              <div className="flex flex-col items-center gap-2 text-amber-600 dark:text-amber-400">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">松开鼠标以上传图片</span>
              </div>
            </div>
          )}
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />

          {/* 拍照输入（移动端） */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={cameraInputRef}
            onChange={handleFileSelect}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || attachments.length >= 14}
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-amber-600 dark:hover:text-amber-400 transition disabled:opacity-50"
            title="上传图片"
          >
            <ImagePlus className="h-5 w-5" />
          </button>

          {/* 拍照按钮（仅移动端显示） */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled || attachments.length >= 14}
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-amber-600 dark:hover:text-amber-400 transition disabled:opacity-50 sm:hidden"
            title="拍照上传"
          >
            <Camera className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsQuickPickerOpen(true)}
            className={`mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                isQuickPickerOpen
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400'
            }`}
            title="快速选择提示词 (也可输入 /t)"
          >
            <Sparkles className="h-5 w-5" />
          </button>

          {onOpenArcade && (
            <button
              onClick={onOpenArcade}
              className={`mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  isArcadeOpen
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
              title={isArcadeOpen ? "关闭 Arcade" : "打开 Arcade"}
            >
              <Gamepad2 className="h-5 w-5" />
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="描述一张图片来生成 或上传参考图来修改 或使用/t中模板"
            className="mb-1 max-h-[200px] min-h-10 w-full md:w-full order-first md:order-0 resize-none bg-transparent py-2.5 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none disabled:opacity-50 field-sizing-content"
            rows={1}
          />

          {disabled ? (
            <button
              onClick={onStop}
              className="mb-1 ml-auto md:ml-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition"
              title="停止生成"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() && attachments.length === 0}
              className="mb-1 ml-auto md:ml-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-500 disabled:opacity-50 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:shadow-none transition"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
           <span className="hidden sm:inline">
             回车发送,Shift + 回车换行。支持粘贴、拖拽或点击上传最多 14 张参考图片。输入 <span className="font-mono text-purple-600 dark:text-purple-400">/t</span> 快速选择提示词。
           </span>
           <span className="sm:hidden">
             点击发送按钮生成图片。支持上传、拍照最多 14 张参考图片。
           </span>
        </div>
      </div>

      {/* 快速提示词选择器 */}
      <PromptQuickPicker
        isOpen={isQuickPickerOpen}
        onClose={() => setIsQuickPickerOpen(false)}
        onSelect={handleQuickPickerSelect}
      />
    </div>
  );
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const base64ToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};
