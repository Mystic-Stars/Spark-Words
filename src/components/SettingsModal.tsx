"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Palette, Info, Sun, Moon, Monitor, ExternalLink, Sparkles, User, Github, Code, Database, Bot, Check, Loader2 } from "lucide-react";
import { SiOpenai, SiAnthropic, SiGooglegemini } from "react-icons/si";
import { useTheme } from "@/contexts/ThemeContext";
import { AIConfig, AI_PROVIDER_PRESETS, AIProvider } from "@/types/aiConfig";
import { saveAIConfig, getAIConfig, getAIConfigByProvider, deleteAIConfig, getAllAIConfigList, toggleAIConfigEnabled } from "@/lib/storage";
import { testAIConnection } from "@/lib/aiService";
import { useDialog } from "@/contexts/DialogContext";

interface SettingsModalProps {
  onClose: () => void;
}

type SettingCategory = "appearance" | "ai" | "data" | "about";

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<SettingCategory>("appearance");
  const { theme, setTheme } = useTheme();
  const [importStrategy, setImportStrategy] = useState<'overwrite' | 'merge'>('merge');
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // AI 配置状态
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [allAIConfigs, setAllAIConfigs] = useState<AIConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [customModelInput, setCustomModelInput] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { confirm, alert } = useDialog();

  // 加载所有 AI 配置
  const loadAllConfigs = () => {
    const configs = getAllAIConfigList();
    setAllAIConfigs(configs);
  };

  // 加载 AI 配置
  useEffect(() => {
    loadAllConfigs();
    const config = getAIConfig();
    if (config) {
      setSelectedProvider(config.provider);
      loadProviderConfig(config.provider);
    } else {
      // 默认配置
      const defaultPreset = AI_PROVIDER_PRESETS[0];
      setSelectedProvider(defaultPreset.id);
      loadProviderConfig(defaultPreset.id);
    }
  }, []);

  // 加载特定服务商的配置
  const loadProviderConfig = (provider: AIProvider) => {
    const config = getAIConfigByProvider(provider);
    if (config) {
      setAiConfig(config);
      setApiKey(config.apiKey || '');
      setApiUrl(config.apiUrl || '');

      // 检查是否为预设模型
      const preset = AI_PROVIDER_PRESETS.find(p => p.id === provider);
      const isPresetModel = preset?.models.some(m => m.value === config.model);

      if (isPresetModel) {
        setSelectedModel(config.model || '');
        setCustomModelInput('');
      } else {
        setSelectedModel('custom');
        setCustomModelInput(config.model || '');
      }
    } else {
      // 无配置，使用默认值
      const preset = AI_PROVIDER_PRESETS.find(p => p.id === provider);
      if (preset) {
        setAiConfig(null);
        setApiKey('');
        setApiUrl(preset.defaultApiUrl || '');
        setSelectedModel(preset.defaultModel || '');
        setCustomModelInput('');
      }
    }
    setTestResult(null);
  };

  // 清理函数：确保关闭时移除所有可能的样式残留
  useEffect(() => {
    // 防止背景滚动
    document.body.style.overflow = 'hidden';

    return () => {
      // 恢复滚动
      document.body.style.overflow = '';
      // 确保没有残留的 pointer-events 样式
      document.body.style.pointerEvents = '';
    };
  }, []);

  const handleClose = () => {
    // 确保清理所有样式
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
    onClose();
  };

  const categories = [
    { id: "appearance" as SettingCategory, label: "外观", icon: Palette },
    { id: "ai" as SettingCategory, label: "AI服务", icon: Bot },
    { id: "data" as SettingCategory, label: "数据", icon: Database },
    { id: "about" as SettingCategory, label: "关于", icon: Info },
  ];

  const themeOptions = [
    {
      value: "light" as const,
      label: "浅色",
      icon: Sun,
    },
    {
      value: "dark" as const,
      label: "深色",
      icon: Moon,
    },
    {
      value: "system" as const,
      label: "系统",
      icon: Monitor,
    },
  ];

  const renderContent = () => {
    switch (selectedCategory) {
      case "appearance":
        return (
          <div className="space-y-8">
            {/* 主题设置 */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 gap-4">
                {/* 文字部分 - 垂直排布 */}
                <div>
                  <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100">
                    明暗主题
                  </h3>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    选择界面外观
                  </p>
                </div>
                {/* 按钮组 - 移动端全宽，桌面端固定宽度 */}
                <div className="grid grid-cols-3 items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg relative w-full md:w-[270px]">
                  <div
                    className="absolute bg-white dark:bg-zinc-700 rounded-md transition-all duration-200 ease-out"
                    style={{
                      width: 'calc((100% - 0.5rem) / 3)',
                      left: '0.25rem',
                      top: '0.25rem',
                      bottom: '0.25rem',
                      transform: `translateX(${theme === 'light' ? '0%' : theme === 'dark' ? '100%' : '200%'})`
                    }}
                  />
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = theme === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(option.value);
                        }}
                        className={`
                          relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-200 w-full touch-manipulation
                          ${isSelected
                            ? "text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 relative z-10" strokeWidth={2} />
                        <span className="relative z-10 whitespace-nowrap">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      case "ai":
        const currentPreset = AI_PROVIDER_PRESETS.find(p => p.id === selectedProvider);
        const currentConfig = allAIConfigs.find(c => c.provider === selectedProvider);

        return (
          <div className="space-y-6">
            {/* 已保存的配置列表 */}
            {allAIConfigs.length > 0 && (
              <div>
                <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                  已保存的配置
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                  点击切换启用的服务商
                </p>
                <div className="space-y-2">
                  {allAIConfigs.map((config) => {
                    const preset = AI_PROVIDER_PRESETS.find(p => p.id === config.provider);
                    return (
                      <div
                        key={config.provider}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
                          ${config.enabled
                            ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                          }
                        `}
                        onClick={() => {
                          if (!config.enabled) {
                            toggleAIConfigEnabled(config.provider);
                            loadAllConfigs();
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                          <div>
                            <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                              {preset?.name || config.provider}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {config.model}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {config.enabled && (
                            <span className="text-[11px] px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                              启用中
                            </span>
                          )}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirmed = await confirm({
                                title: "删除配置",
                                message: `确定要删除 ${preset?.name || config.provider} 的配置吗？`,
                                confirmText: "删除",
                                cancelText: "取消",
                                variant: "danger",
                              });
                              if (confirmed) {
                                deleteAIConfig(config.provider);
                                loadAllConfigs();
                                if (config.provider === selectedProvider) {
                                  setAiConfig(null);
                                  setApiKey('');
                                  setTestResult({ success: true, message: '配置已删除' });
                                }
                              }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {allAIConfigs.length > 0 && <div className="border-t border-zinc-200 dark:border-zinc-800" />}

            {/* AI 服务商选择 */}
            <div>
              <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                {currentConfig ? '编辑配置' : '添加新配置'}
              </h3>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                选择用于生成试卷的 AI 服务
              </p>
              <div className="grid grid-cols-4 gap-2">
                {AI_PROVIDER_PRESETS.map((preset) => {
                  const isSelected = selectedProvider === preset.id;
                  let Icon = null;

                  if (preset.id === 'openai') {
                    Icon = SiOpenai;
                  } else if (preset.id === 'claude') {
                    Icon = SiAnthropic;
                  } else if (preset.id === 'gemini') {
                    Icon = SiGooglegemini;
                  }

                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedProvider(preset.id);
                        loadProviderConfig(preset.id);
                      }}
                      className={`
                        px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2
                        ${isSelected
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }
                      `}
                    >
                      {Icon && (
                        <Icon
                          className={`w-4 h-4 ${preset.id === 'openai' && !isSelected
                            ? 'text-black dark:text-white'
                            : ''
                            }`}
                        />
                      )}
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 分割线 */}
            <div className="border-t border-zinc-200 dark:border-zinc-800" />

            {/* API Key */}
            <div>
              <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                API Key
              </h3>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                输入您的 API 密钥（加密存储）
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* API 地址 */}
            <div>
              <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                API 地址
              </h3>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                自定义 API 端点（可选）
              </p>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => {
                  setApiUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* 模型选择 */}
            {currentPreset && currentPreset.models.length > 0 && (
              <div>
                <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                  模型
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                  选择预设模型或自定义输入
                </p>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    if (e.target.value !== 'custom') {
                      setCustomModelInput('');
                    }
                    setTestResult(null);
                  }}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-zinc-100"
                >
                  {currentPreset.models.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                  <option value="custom">自定义...</option>
                </select>
                {selectedModel === 'custom' && (
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => {
                      setCustomModelInput(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="输入模型名称，如：gpt-5.2-instant"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-zinc-100 mt-2"
                  />
                )}
              </div>
            )}

            {/* 自定义模型名称 */}
            {selectedProvider === 'custom' && (
              <div>
                <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                  模型名称
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                  输入自定义模型名称
                </p>
                <input
                  type="text"
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="例如：gpt-5.2-instant"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}

            {/* 分割线 */}
            <div className="border-t border-zinc-200 dark:border-zinc-800" />

            {/* 测试结果 */}
            {testResult && (
              <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <p className={`text-[12px] ${testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!apiKey.trim()) {
                    setTestResult({ success: false, message: '请输入 API Key' });
                    return;
                  }

                  setTestingConnection(true);
                  setTestResult(null);

                  const finalModel = selectedModel === 'custom' ? customModelInput.trim() : selectedModel.trim();

                  const config: AIConfig = {
                    provider: selectedProvider,
                    apiKey: apiKey.trim(),
                    apiUrl: apiUrl.trim() || undefined,
                    model: finalModel,
                    enabled: true,
                  };

                  const result = await testAIConnection(config);
                  setTestingConnection(false);

                  if (result.success) {
                    setTestResult({ success: true, message: '连接成功！' });
                  } else {
                    setTestResult({ success: false, message: result.error || '连接失败' });
                  }
                }}
                disabled={testingConnection}
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  '测试连接'
                )}
              </button>
              <button
                onClick={() => {
                  if (!apiKey.trim()) {
                    setTestResult({ success: false, message: '请输入 API Key' });
                    return;
                  }

                  const finalModel = selectedModel === 'custom' ? customModelInput.trim() : selectedModel.trim();

                  const config: AIConfig = {
                    provider: selectedProvider,
                    apiKey: apiKey.trim(),
                    apiUrl: apiUrl.trim() || undefined,
                    model: finalModel,
                    enabled: true,
                  };

                  saveAIConfig(config);
                  setAiConfig(config);
                  loadAllConfigs(); // 重新加载配置列表
                  setTestResult({ success: true, message: '配置已保存！' });
                }}
                className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-[13px] font-medium"
              >
                保存配置
              </button>
            </div>

            {/* 删除配置 */}
            {aiConfig && (
              <div>
                <button
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: "删除配置",
                      message: "确定要删除此配置吗？",
                      confirmText: "删除",
                      cancelText: "取消",
                      variant: "danger",
                    });
                    if (confirmed) {
                      deleteAIConfig(selectedProvider);
                      loadAllConfigs();
                      setAiConfig(null);
                      setApiKey('');
                      setTestResult({ success: true, message: '配置已删除' });
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-[13px] font-medium"
                >
                  删除配置
                </button>
              </div>
            )}

            {/* 警告信息 */}
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
                ⚠️ API Key 将加密存储在本地浏览器中。请妥善保管您的密钥，不要与他人分享。
              </p>
            </div>
          </div>
        );
      case "data":
        return (
          <div className="space-y-6">
            {/* 导出数据 */}
            <div>
              <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                导出数据
              </h3>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                将所有试卷和进度导出为备份文件
              </p>
              <button
                onClick={async () => {
                  try {
                    const { exportAllData } = require('@/lib/storage');
                    exportAllData();
                  } catch (error) {
                    await alert({
                      title: "错误",
                      message: "导出失败,请稍后再试",
                      variant: "danger",
                    });
                  }
                }}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-[13px] font-medium"
              >
                导出备份
              </button>
            </div>

            {/* 分割线 */}
            <div className="border-t border-zinc-200 dark:border-zinc-800" />

            {/* 导入数据 */}
            <div>
              <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                导入数据
              </h3>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                从备份文件恢复数据
              </p>
              <input
                type="file"
                accept=".json"
                id="import-data-input"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPendingFile(file);
                    setShowStrategyDialog(true);
                  }
                  e.target.value = ''; // 重置输入
                }}
              />
              <button
                onClick={() => document.getElementById('import-data-input')?.click()}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-[13px] font-medium"
              >
                选择文件
              </button>
            </div>

            {/* 分割线 */}
            <div className="border-t border-zinc-200 dark:border-zinc-800" />

            {/* 清空数据 */}
            <div>
              <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                清空数据
              </h3>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                删除所有试卷、进度和设置
              </p>
              <button
                onClick={async () => {
                  const confirmed = await confirm({
                    title: "清空数据",
                    message: "确定要清空所有数据吗?此操作不可恢复!",
                    confirmText: "清空",
                    cancelText: "取消",
                    variant: "danger",
                  });
                  if (confirmed) {
                    try {
                      const { clearAllData } = require('@/lib/storage');
                      clearAllData();
                      await alert({
                        title: "成功",
                        message: "数据已清空,刷新页面生效",
                        variant: "success",
                      });
                      window.location.reload();
                    } catch (error) {
                      await alert({
                        title: "错误",
                        message: "清空失败,请稍后再试",
                        variant: "danger",
                      });
                    }
                  }
                }}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-[13px] font-medium"
              >
                清空所有数据
              </button>
            </div>

            {/* 警告信息 */}
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
                ⚠️ 导入数据时请谨慎选择策略,建议在导入前先导出当前数据进行备份。
              </p>
            </div>

            {/* 导入策略对话框 */}
            {showStrategyDialog && pendingFile && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => {
                setShowStrategyDialog(false);
                setPendingFile(null);
              }}>
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    选择导入策略
                  </h3>

                  <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="strategy"
                        value="merge"
                        checked={importStrategy === 'merge'}
                        onChange={(e) => setImportStrategy(e.target.value as 'merge')}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">合并数据</div>
                        <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">保留现有数据,添加新的试卷(相同ID跳过)</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="strategy"
                        value="overwrite"
                        checked={importStrategy === 'overwrite'}
                        onChange={(e) => setImportStrategy(e.target.value as 'overwrite')}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">覆盖数据</div>
                        <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">删除现有数据,使用备份文件替换</div>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowStrategyDialog(false);
                        setPendingFile(null);
                      }}
                      className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-[13px] font-medium"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        const { importAllData } = require('@/lib/storage');
                        importAllData(
                          pendingFile,
                          importStrategy,
                          async () => {
                            await alert({
                              title: "成功",
                              message: "导入成功!刷新页面生效",
                              variant: "success",
                            });
                            window.location.reload();
                          },
                          async (error: string) => {
                            await alert({
                              title: "错误",
                              message: error,
                              variant: "danger",
                            });
                          }
                        );
                        setShowStrategyDialog(false);
                        setPendingFile(null);
                      }}
                      className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-[13px] font-medium"
                    >
                      确认导入
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        );
      case "about":
        return (
          <div className="space-y-8">
            {/* 标题和简介 */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <img
                  src="/ico-light.png"
                  alt="Spark Words Logo"
                  className="w-10 h-10 rounded-xl shadow-sm block dark:hidden"
                />
                <img
                  src="/ico-dark.png"
                  alt="Spark Words Logo"
                  className="w-10 h-10 rounded-xl shadow-sm hidden dark:block"
                />
                <h3 className="text-[18px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Spark Words
                </h3>
              </div>
              <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed ml-10">
                优雅的完形填空，纯净背单词
              </p>
            </div>

            {/* 开发者 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
                <div className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  开发者
                </div>
              </div>
              <a
                href="https://github.com/Mystic-Stars"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[14px] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group ml-5"
              >
                <Github className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" strokeWidth={1.5} />
                <span>Mystic Stars</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" strokeWidth={2} />
              </a>
            </div>

            {/* 项目地址 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
                <div className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  项目地址
                </div>
              </div>
              <a
                href="https://github.com/Mystic-Stars/Spark-Words"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[14px] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group ml-5"
              >
                <Github className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" strokeWidth={1.5} />
                <span className="truncate">github.com/Mystic-Stars/Spark-Words</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors flex-shrink-0" strokeWidth={2} />
              </a>
            </div>

            {/* 技术栈 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
                <div className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  技术栈
                </div>
              </div>
              <div className="ml-5 text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600"></div>
                  <span>Next.js 15</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600"></div>
                  <span>React 18</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600"></div>
                  <span>TypeScript</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600"></div>
                  <span>Tailwind CSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600"></div>
                  <span>Framer Motion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600"></div>
                  <span>Lucide Icons</span>
                </div>
              </div>
            </div>

            {/* 版本信息 */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-[13px] text-zinc-400 dark:text-zinc-500">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                <span>Version 1.0.0 · 2026年1月</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden relative border border-zinc-200/50 dark:border-zinc-800/50 mx-4 max-h-[90vh] md:max-h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
            设置
          </h1>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
            aria-label="关闭设置"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Content with Sidebar */}
        <div className="flex flex-col md:flex-row" style={{ height: "540px" }}>
          {/* Left Sidebar - 桌面端显示 */}
          <div className="hidden md:block md:w-56 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 py-4 px-3">
            <nav className="space-y-0.5">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-150
                      ${isSelected
                        ? "bg-zinc-200/70 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="flex md:hidden border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors ${isSelected
                    ? "border-b-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-600 dark:text-zinc-400"
                    }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content */}
          <div className="flex-1 py-6 md:py-8 px-4 md:px-10 overflow-y-auto custom-scrollbar">
            {renderContent()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
