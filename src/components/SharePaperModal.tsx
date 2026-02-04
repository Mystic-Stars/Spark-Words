"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Share2, Download, Github, Copy, CheckCircle, FileText } from "lucide-react";
import { QuestionSet } from "@/types/question";
import { exportPaperToCommunity, downloadJsonFile } from "@/lib/storage";
import { generatePRTemplate, getRepoUrl, getContributionGuideUrl } from "@/lib/communityApi";
import { useDialog } from "@/contexts/DialogContext";

interface SharePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionSet;
}

export default function SharePaperModal({
  isOpen,
  onClose,
  paper,
}: SharePaperModalProps) {
  const [author, setAuthor] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced" | "">("");
  const [step, setStep] = useState<"form" | "export">("form");
  const [prTemplate, setPrTemplate] = useState("");
  const [copied, setCopied] = useState(false);

  const { alert } = useDialog();

  const handleExport = async () => {
    if (!author.trim()) {
      await alert({
        title: "提示",
        message: "请填写作者名称",
        variant: "warning",
      });
      return;
    }

    const communityPaper = exportPaperToCommunity(
      paper,
      author,
      difficulty || undefined
    );

    const filename = `${communityPaper.id}.json`;
    downloadJsonFile(communityPaper, filename);

    const template = generatePRTemplate(communityPaper);
    setPrTemplate(template);

    setStep("export");
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(prTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep("form");
    setAuthor("");
    setDifficulty("");
    setPrTemplate("");
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col border border-zinc-200/50 dark:border-zinc-800/50 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
            分享到社区
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
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {step === "form" ? (
            // Step 1: 填写信息
            <div className="space-y-5">
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                  <FileText className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
                  <h3 className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100">
                    试卷信息
                  </h3>
                </div>
                <div className="space-y-2 text-[13px] text-zinc-600 dark:text-zinc-400">
                  <div className="flex">
                    <span className="font-medium text-zinc-500 dark:text-zinc-400 w-20 flex-shrink-0">标题:</span>
                    <span className="flex-1 text-zinc-800 dark:text-zinc-200">{paper.title}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-zinc-500 dark:text-zinc-400 w-20 flex-shrink-0">描述:</span>
                    <span className="flex-1 text-zinc-800 dark:text-zinc-200">{paper.description || "无"}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-zinc-500 dark:text-zinc-400 w-20 flex-shrink-0">题目数量:</span>
                    <span className="flex-1 text-zinc-800 dark:text-zinc-200">{paper.questions.length} 题</span>
                  </div>
                  {paper.tags && paper.tags.length > 0 && (
                    <div className="flex">
                      <span className="font-medium text-zinc-500 dark:text-zinc-400 w-20 flex-shrink-0">标签:</span>
                      <span className="flex-1 text-zinc-800 dark:text-zinc-200">{paper.tags.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium mb-2 text-zinc-800 dark:text-zinc-100">
                  作者名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="请输入你的名字或昵称"
                  className="w-full px-3 py-2.5 text-[14px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium mb-2 text-zinc-800 dark:text-zinc-100">
                  难度等级
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setDifficulty("beginner")}
                    className={`py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${difficulty === "beginner"
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                  >
                    初级
                  </button>
                  <button
                    onClick={() => setDifficulty("intermediate")}
                    className={`py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${difficulty === "intermediate"
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                  >
                    中级
                  </button>
                  <button
                    onClick={() => setDifficulty("advanced")}
                    className={`py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${difficulty === "advanced"
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                  >
                    高级
                  </button>
                </div>
              </div>

              <div className="rounded-lg p-4 bg-zinc-50/50 dark:bg-zinc-800/20 text-[13px] text-zinc-600 dark:text-zinc-400">
                <p className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">💡 提示</p>
                <ul className="space-y-1.5 text-[13px] pl-4">
                  <li className="relative before:content-['•'] before:absolute before:-left-3 before:text-zinc-400 dark:before:text-zinc-500">填写信息后将导出试卷 JSON 文件</li>
                  <li className="relative before:content-['•'] before:absolute before:-left-3 before:text-zinc-400 dark:before:text-zinc-500">你需要手动将文件提交到 GitHub 仓库</li>
                  <li className="relative before:content-['•'] before:absolute before:-left-3 before:text-zinc-400 dark:before:text-zinc-500">我们会提供详细的贡献指南</li>
                </ul>
              </div>
            </div>
          ) : (
            // Step 2: 贡献指南
            <div className="space-y-5">
              <div className="rounded-lg p-4 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-start gap-3">
                <CheckCircle className="text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" size={18} strokeWidth={2} />
                <div>
                  <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">
                    文件已导出成功！
                  </h3>
                  <p className="text-[13px] text-zinc-600 dark:text-zinc-400">
                    请按照以下步骤将试卷提交到社区仓库
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100">
                  📋 贡献步骤
                </h4>
                <ol className="list-decimal list-inside space-y-2.5 text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <li className="pl-2">
                    访问社区仓库：
                    <a
                      href={getRepoUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Github size={12} strokeWidth={2} />
                      spark-words-community
                    </a>
                  </li>
                  <li className="pl-2">Fork 该仓库到你的账号</li>
                  <li className="pl-2">
                    将刚才下载的 JSON 文件上传到{" "}
                    <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[11px] font-mono">
                      papers/{difficulty || "other"}/
                    </code>{" "}
                    目录
                  </li>
                  <li className="pl-2">创建 Pull Request，并复制以下模板到 PR 描述中</li>
                  <li className="pl-2">等待审核通过，你的试卷将出现在社区库中！</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100">
                    📝 PR 描述模板
                  </h4>
                  <button
                    onClick={handleCopyTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-all duration-150"
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={14} className="text-green-500" strokeWidth={2} />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy size={14} strokeWidth={2} />
                        复制
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-zinc-50/50 dark:bg-zinc-900/50 p-3.5 rounded-lg text-[12px] overflow-x-auto border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-200 font-mono leading-relaxed">
                  {prTemplate}
                </pre>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3.5 text-[13px]">
                <p className="text-blue-900 dark:text-blue-300">
                  <span className="font-medium">需要帮助？</span>{" "}
                  查看详细的{" "}
                  <a
                    href={getContributionGuideUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    贡献指南
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
          {step === "form" ? (
            <>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 text-[14px] font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150 text-zinc-700 dark:text-zinc-300"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                disabled={!author.trim()}
                className="flex-1 py-2.5 text-[14px] font-medium bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white dark:text-zinc-900 disabled:text-zinc-500 rounded-lg transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Download size={15} strokeWidth={2} />
                导出并继续
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 text-[14px] font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150 text-zinc-700 dark:text-zinc-300"
              >
                重新导出
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 text-[14px] font-medium bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg transition-all duration-150"
              >
                完成
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
