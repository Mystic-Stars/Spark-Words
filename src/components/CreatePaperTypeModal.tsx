"use client";

import { motion } from "framer-motion";
import { X, FileText, Sparkles, Settings } from "lucide-react";
import { useEffect } from "react";
import { useDialog } from "@/contexts/DialogContext";

interface CreatePaperTypeModalProps {
  onClose: () => void;
  onSelectManual: () => void;
  onSelectAI: () => void;
  hasAIConfig: boolean;
}

export default function CreatePaperTypeModal({
  onClose,
  onSelectManual,
  onSelectAI,
  hasAIConfig,
}: CreatePaperTypeModalProps) {
  const { alert } = useDialog();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, []);

  const handleClose = () => {
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
    onClose();
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
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden relative border border-zinc-200/50 dark:border-zinc-800/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
            选择创建方式
          </h1>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
            aria-label="关闭"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* 手动生成 */}
          <button
            onClick={() => {
              handleClose();
              onSelectManual();
            }}
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-600 transition-colors">
                <FileText className="w-6 h-6 text-zinc-600 dark:text-zinc-300" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  手动创建
                </h3>
                <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  通过导入单词列表、生成 AI Prompt，然后手动粘贴 JSON 数据创建试卷
                </p>
              </div>
            </div>
          </button>

          {/* AI 一键生成 */}
          <button
            onClick={async () => {
              if (!hasAIConfig) {
                await alert({
                  title: "提示",
                  message: "请先在设置中配置 AI 服务",
                  variant: "warning",
                });
                return;
              }
              handleClose();
              onSelectAI();
            }}
            disabled={!hasAIConfig}
            className={`w-full p-5 border-2 rounded-xl transition-all group text-left ${hasAIConfig
                ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
                : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors ${hasAIConfig
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:from-blue-600 group-hover:to-cyan-600'
                  : 'bg-zinc-200 dark:bg-zinc-700'
                }`}>
                <Sparkles className={`w-6 h-6 ${hasAIConfig ? 'text-white' : 'text-zinc-400'}`} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-[15px] font-semibold ${hasAIConfig ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500'}`}>
                    AI 一键生成
                  </h3>
                  {hasAIConfig && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-medium rounded">
                      推荐
                    </span>
                  )}
                </div>
                <p className={`text-[13px] leading-relaxed ${hasAIConfig ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-600'}`}>
                  {hasAIConfig
                    ? '输入主题和参数，AI 自动生成完整试卷，快速高效'
                    : '需要先配置 AI 服务才能使用此功能'}
                </p>
              </div>
            </div>
          </button>

          {/* 配置提示 */}
          {!hasAIConfig && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={2} />
              <p className="text-[12px] text-amber-800 dark:text-amber-300">
                在设置中配置 AI 服务后，即可使用 AI 一键生成功能
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
