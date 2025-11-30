import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Key, ExternalLink, ChevronDown, ChevronRight, Settings2, X } from 'lucide-react';

interface ApiKeyModalProps {
  onClose?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose }) => {
  const { setApiKey, updateSettings, settings, fetchBalance } = useAppStore();
  const [inputKey, setInputKey] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [endpoint, setEndpoint] = useState(settings.customEndpoint || '');
  const [model, setModel] = useState(settings.modelName || 'gemini-3-pro-image-preview');

  // Sync local state with store settings (e.g. when updated via URL params)
  useEffect(() => {
    if (settings.customEndpoint) setEndpoint(settings.customEndpoint);
    if (settings.modelName) setModel(settings.modelName);
  }, [settings.customEndpoint, settings.modelName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    updateSettings({
      customEndpoint: endpoint,
      modelName: model
    });
    setApiKey(inputKey);
    // 立即尝试刷新余额
    setTimeout(() => fetchBalance(), 0);

    // 调用 onClose 如果提供
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6 sm:p-8 transition-colors duration-200 relative">
        {/* Close button (only show if onClose provided) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-50 dark:bg-amber-500/10 p-4 ring-1 ring-amber-200 dark:ring-amber-500/50">
            <Key className="h-8 w-8 text-amber-600 dark:text-amber-500" />
          </div>
        </div>
        
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">输入 API Key</h2>
        <p className="mb-8 text-sm text-center text-gray-500 dark:text-gray-400">
          此应用 100% 在您的浏览器中运行。您的 Key 仅存储在本地设备上。
        </p>
        <p className="mb-8 text-center text-gray-500 dark:text-gray-400">
          获取API Key：
          <a 
            href="https://api.kuai.host/register?aff=z2C8" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-m text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition"
          >
            注册登录酷爱API后创建分组为【限时特价】的api密钥即可。
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="sr-only">API Key</label>
            <input
              type="password"
              id="apiKey"
              value={inputKey}
              onChange={(e) => setInputKey(e.currentTarget.value)}
              className="w-full rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
              placeholder="sk-xxx..."
              autoFocus
            />
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="group flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 transition-all"
            >
              <div className="flex items-center gap-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:underline">
                <Settings2 className="h-3 w-3" />
                <span>高级配置</span>
                {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
            </button>

            <div 
              className={`grid transition-all duration-300 ease-in-out ${
                showAdvanced ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">自定义接口地址 (可选)</label>
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.currentTarget.value)}
                      className="w-full rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                      placeholder="https://api.kuai.host"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">模型名称</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.currentTarget.value)}
                      className="w-full rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                      placeholder="gemini-3-pro-image-preview"
                    />
                  </div>

                  {/* Beta Features Warning */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Beta 功能</span>
                      <span className="text-xs text-gray-400">谨慎开启</span>
                    </div>

                    {/* Google Search Grounding */}
                    <div className="mb-3">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300">Google 搜索定位</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={settings.useGrounding}
                            onChange={(e) => updateSettings({ useGrounding: e.currentTarget.checked })}
                            className="sr-only peer"
                          />
                          <div className="h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-amber-500/50 peer-checked:bg-amber-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                        </div>
                      </label>
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                        允许 Gemini 通过 Google 搜索获取实时信息
                      </p>
                    </div>

                    {/* Thinking Process */}
                    <div>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300">显示思考过程</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={settings.enableThinking}
                            onChange={(e) => updateSettings({ enableThinking: e.currentTarget.checked })}
                            className="sr-only peer"
                          />
                          <div className="h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-amber-500/50 peer-checked:bg-amber-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                        </div>
                      </label>
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                        显示模型的内部思考过程。部分模型不支持此功能
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputKey.trim()}
            className="w-full rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开始创作
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <a 
            href="https://cnb.cool/fuliai/comfyui/-/issues/11" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition"
          >
            <span>加入交流群</span>
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
