import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Part } from '../types';
import { User, Sparkles, ChevronDown, ChevronRight, BrainCircuit, Trash2, RotateCcw, Download, Edit, PackageOpen } from 'lucide-react';
import { useUiStore } from '../store/useUiStore';
import { downloadImage, openImageInNewTab, downloadDatasetZip } from '../utils/imageUtils';

interface Props {
  message: ChatMessage;
  isLast: boolean;
  isGenerating: boolean;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
}

const ThinkingContentItem: React.FC<{ part: Part }> = ({ part }) => {
  const [isImageHovered, setIsImageHovered] = useState(false);
  const { setPendingReferenceImage } = useUiStore();

  if (part.text) {
    return (
      <div className="mb-2 last:mb-0">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          }}
        >
          {part.text}
        </ReactMarkdown>
      </div>
    );
  }

  if (part.inlineData) {
    const handleReEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPendingReferenceImage({
        base64Data: part.inlineData!.data,
        mimeType: part.inlineData!.mimeType,
        timestamp: Date.now()
      });
    };

    return (
      <div
        className="relative my-2 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700/50 bg-gray-100 dark:bg-black/20 max-w-sm mx-auto group"
        onMouseEnter={() => setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
      >
        <img
          src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
          alt="Thinking process sketch"
          className="h-auto max-w-full object-contain opacity-80 hover:opacity-100 transition cursor-pointer"
          loading="lazy"
          onClick={() => openImageInNewTab(part.inlineData!.mimeType, part.inlineData!.data)}
          title="点击查看大图"
        />

        {/* Action Buttons */}
        <div className={`absolute top-2 right-2 flex gap-2 transition-all ${isImageHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={handleReEdit}
            className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-lg backdrop-blur-sm transition-all"
            title="再次编辑"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadImage(part.inlineData!.mimeType, part.inlineData!.data);
            }}
            className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-lg backdrop-blur-sm transition-all"
            title="下载图片"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

const ImageWithDownload: React.FC<{ part: Part; index: number }> = ({ part, index }) => {
  const [isImageHovered, setIsImageHovered] = useState(false);
  const { setPendingReferenceImage } = useUiStore();

  if (!part.inlineData) return null;

  const handleReEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingReferenceImage({
      base64Data: part.inlineData!.data,
      mimeType: part.inlineData!.mimeType,
      timestamp: Date.now()
    });
  };

  return (
    <div
      key={index}
      className="relative mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-950/50 max-w-lg mx-auto group"
      onMouseEnter={() => setIsImageHovered(true)}
      onMouseLeave={() => setIsImageHovered(false)}
    >
      <img
        src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
        alt="Generated or uploaded content"
        className="h-auto max-w-full object-contain cursor-pointer"
        loading="lazy"
        onClick={() => openImageInNewTab(part.inlineData!.mimeType, part.inlineData!.data)}
        title="点击查看大图"
      />

      {/* Action Buttons */}
      <div className={`absolute top-3 right-3 flex gap-2 transition-all ${isImageHovered ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={handleReEdit}
          className="p-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-lg backdrop-blur-sm transition-all"
          title="再次编辑"
        >
          <Edit className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadImage(part.inlineData!.mimeType, part.inlineData!.data);
          }}
          className="p-2.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-lg backdrop-blur-sm transition-all"
          title="下载图片"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const ThinkingBlock: React.FC<{ parts: Part[], duration?: number, isFinished: boolean }> = ({ parts, duration, isFinished }) => {
  const [isExpanded, setIsExpanded] = useState(!isFinished);

  useEffect(() => {
    if (isFinished) {
      setIsExpanded(false);
    }
  }, [isFinished]);

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300 transition"
      >
        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <BrainCircuit className="h-3 w-3" />
        <span>思考过程</span>
        {duration !== undefined && duration > 0 && (
           <span className="ml-auto opacity-70">({duration.toFixed(1)}s)</span>
        )}
      </button>
      
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700/30 px-3 py-3 text-sm text-gray-600 dark:text-gray-400 italic">
          {parts.map((part, i) => <ThinkingContentItem key={i} part={part} />)}
        </div>
      )}
    </div>
  );
};

export const MessageBubble: React.FC<Props> = ({ message, isLast, isGenerating, onDelete, onRegenerate }) => {
  const isUser = message.role === 'user';
  const [showActions, setShowActions] = useState(false);
  const actionsDisabled = isGenerating;
  const { showDialog, addToast } = useUiStore();

  const handleDelete = () => {
    showDialog({
        type: 'confirm',
        title: '删除消息',
        message: "您确定要删除这条消息吗？",
        confirmLabel: "删除",
        onConfirm: () => onDelete(message.id)
    });
  };

  // 检查是否是数据集生成消息（包含多张带 prompt 的图片）
  const imageParts = message.parts.filter(p => p.inlineData && !p.thought);
  const isDatasetMessage = !isUser && imageParts.length >= 5 && imageParts.some(p => p.prompt);

  const handleDownloadDataset = async () => {
    try {
      const datasetParts = imageParts.map(p => ({
        mimeType: p.inlineData!.mimeType,
        data: p.inlineData!.data,
        prompt: p.prompt
      }));

      await downloadDatasetZip(datasetParts);
      addToast('数据集下载成功！', 'success');
    } catch (error) {
      console.error('下载数据集失败:', error);
      addToast('数据集下载失败，请重试', 'error');
    }
  };

  // Group parts: consecutive thinking parts should be grouped together
  const groupedParts: (Part | Part[])[] = [];
  
  message.parts.forEach((part) => {
    const lastGroup = groupedParts[groupedParts.length - 1];
    
    if (part.thought) {
      if (Array.isArray(lastGroup)) {
        // Append to existing thinking group
        lastGroup.push(part);
      } else {
        // Start new thinking group
        groupedParts.push([part]);
      }
    } else {
      // Regular part (Text or Image)
      groupedParts.push(part);
    }
  });

  const renderContent = (item: Part | Part[], index: number) => {
    // 1. Handle Thinking Block Group
    if (Array.isArray(item)) {
      return <ThinkingBlock key={`think-${index}`} parts={item} duration={message.thinkingDuration} isFinished={!isLast || !isGenerating} />;
    }
    
    const part = item;

    // 2. Handle Text (Markdown)
    if (part.text) {
      return (
        <div key={index} className="markdown-content leading-relaxed wrap-break-word overflow-hidden">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom components to ensure styles match the theme
              p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
              a: ({href, children}) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                  {children}
                </a>
              ),
              ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
              li: ({children}) => <li className="pl-1">{children}</li>,
              code: ({children}) => (
                <code className="rounded bg-gray-200 dark:bg-gray-800/50 px-1 py-0.5 font-mono text-sm text-amber-600 dark:text-amber-200">
                  {children}
                </code>
              ),
              pre: ({children}) => (
                <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-sm border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200">
                  {children}
                </pre>
              ),
              blockquote: ({children}) => (
                <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-3 text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/30 rounded-r">
                  {children}
                </blockquote>
              ),
              table: ({children}) => (
                <div className="overflow-x-auto mb-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">{children}</table>
                </div>
              ),
              thead: ({children}) => <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">{children}</thead>,
              tbody: ({children}) => <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900/50">{children}</tbody>,
              tr: ({children}) => <tr>{children}</tr>,
              th: ({children}) => (
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{children}</th>
              ),
              td: ({children}) => <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{children}</td>,
            }}
          >
            {part.text}
          </ReactMarkdown>
        </div>
      );
    }
    
    // 3. Handle Images
    if (part.inlineData) {
      return <ImageWithDownload key={index} part={part} index={index} />;
    }
    return null;
  };

  return (
    <div 
      className={`flex w-full gap-4 ${isUser ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-500 shadow-lg shadow-amber-500/20 mt-1">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={`flex max-w-[85%] md:max-w-[75%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-5 py-3.5 shadow-sm w-full transition-colors duration-200 ${
            isUser
              ? 'bg-amber-600 text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-gray-700'
          }`}
        >
          {groupedParts.map((item, i) => renderContent(item, i))}

          {message.isError && (
             <div className="mt-2 text-xs text-red-300 font-medium">
                生成响应失败。请检查您的 API Key 或网络连接。
             </div>
          )}

          {/* 数据集下载按钮 */}
          {isDatasetMessage && !actionsDisabled && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleDownloadDataset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all"
              >
                <PackageOpen className="h-4 w-4" />
                下载 AI-Toolkit 数据集 (ZIP)
                <span className="text-xs opacity-90">({imageParts.length} 张)</span>
              </button>
              <p className="mt-2 text-[10px] text-center text-gray-500 dark:text-gray-400">
                包含图片及对应的文本标注，可直接用于 AI-toolkit 训练
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 px-1">
           <span className="text-[10px] text-gray-500 font-medium">
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </span>
           
           {/* Actions */}
           {!actionsDisabled && (
             <div className={`flex items-center gap-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  title="从此重新生成"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="删除消息"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
             </div>
           )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 mt-1">
          <User className="h-4 w-4 text-gray-500 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
};
