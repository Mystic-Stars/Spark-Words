"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Download, FileText, User, Sparkles, Github } from "lucide-react";
import {
  fetchCommunityMetadata,
  downloadCommunityPaper,
  searchCommunityPapers,
  filterPapersByDifficulty,
} from "@/lib/communityApi";
import { importCommunityPaper } from "@/lib/storage";
import { CommunityPaperMeta, CommunityPaper } from "@/types/question";
import { useDialog } from "@/contexts/DialogContext";

interface CommunityLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export default function CommunityLibraryModal({
  isOpen,
  onClose,
  onImportSuccess,
}: CommunityLibraryModalProps) {
  const [papers, setPapers] = useState<CommunityPaperMeta[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<CommunityPaperMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<CommunityPaper | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const { alert } = useDialog();

  useEffect(() => {
    if (isOpen) {
      loadCommunityPapers();
    }
  }, [isOpen]);

  useEffect(() => {
    let result = papers;

    if (searchQuery) {
      result = searchCommunityPapers(result, searchQuery);
    }

    if (selectedDifficulty) {
      result = filterPapersByDifficulty(result, selectedDifficulty);
    }

    setFilteredPapers(result);
  }, [papers, searchQuery, selectedDifficulty]);

  const loadCommunityPapers = async () => {
    setLoading(true);
    try {
      const metadata = await fetchCommunityMetadata();
      setPapers(metadata.papers);
      setFilteredPapers(metadata.papers);
    } catch (error) {
      console.error("Failed to load community papers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (paper: CommunityPaperMeta) => {
    setDownloading(paper.id);
    try {
      const fullPaper = await downloadCommunityPaper(paper.filepath);
      if (fullPaper) {
        setSelectedPaper(fullPaper);
      }
    } catch (error) {
      console.error("Failed to preview paper:", error);
      await alert({
        title: "错误",
        message: "预览失败，请稍后再试",
        variant: "danger",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleImport = async (paper: CommunityPaper) => {
    try {
      importCommunityPaper(paper);
      setSelectedPaper(null);
      onImportSuccess?.();
      // 无感导入，不弹出提示，不刷新页面
    } catch (error) {
      console.error("Failed to import paper:", error);
      await alert({
        title: "错误",
        message: "导入失败，请重试",
        variant: "danger",
      });
    }
  };

  const getDifficultyBadge = (difficulty?: string) => {
    const colors = {
      beginner: "bg-zinc-100 text-green-600 dark:bg-zinc-800 dark:text-green-500",
      intermediate: "bg-zinc-100 text-amber-600 dark:bg-zinc-800 dark:text-amber-500",
      advanced: "bg-zinc-100 text-red-600 dark:bg-zinc-800 dark:text-red-500",
    };

    const labels = {
      beginner: "初级",
      intermediate: "中级",
      advanced: "高级",
    };

    const color = difficulty ? colors[difficulty as keyof typeof colors] : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
    const label = difficulty ? labels[difficulty as keyof typeof labels] : "未分级";

    return <span className={`px-2.5 py-1 rounded-md text-[12px] font-medium ${color}`}>{label}</span>;
  };

  // 高亮搜索关键词
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 text-zinc-900 dark:text-zinc-100 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-6xl max-h-[90vh] md:max-h-[85vh] flex flex-col border border-zinc-200/50 dark:border-zinc-800/50 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
              社区试卷
            </h1>
            <a
              href="https://github.com/Mystic-Stars/spark-words-community"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
              aria-label="访问 GitHub 仓库"
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="w-4 h-4" strokeWidth={2} />
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
            aria-label="关闭"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} strokeWidth={2} />
            <input
              type="text"
              placeholder="搜索试卷标题、作者、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[14px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${selectedDifficulty === null
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
            >
              全部
            </button>
            <button
              onClick={() => setSelectedDifficulty("beginner")}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${selectedDifficulty === "beginner"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
            >
              初级
            </button>
            <button
              onClick={() => setSelectedDifficulty("intermediate")}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${selectedDifficulty === "intermediate"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
            >
              中级
            </button>
            <button
              onClick={() => setSelectedDifficulty("advanced")}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${selectedDifficulty === "advanced"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
            >
              高级
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Sparkles className="w-8 h-8 text-zinc-400 dark:text-zinc-500 animate-pulse mb-3" strokeWidth={2} />
              <p className="text-[14px] text-zinc-500 dark:text-zinc-400">加载中...</p>
            </div>
          ) : !filteredPapers || filteredPapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-zinc-500 dark:text-zinc-400">
                {!papers || papers.length === 0 ? "暂无社区试卷" : "未找到匹配的试卷"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPapers.map((paper) => (
                <motion.div
                  key={paper.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 bg-white dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-[14px] text-zinc-900 dark:text-zinc-100 flex-1 line-clamp-2 leading-snug">
                      {highlightText(paper.title, searchQuery)}
                    </h3>
                    {getDifficultyBadge(paper.difficulty)}
                  </div>

                  {paper.description && (
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
                      {highlightText(paper.description, searchQuery)}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mb-3 text-[12px] text-zinc-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <User size={13} strokeWidth={2} />
                      {highlightText(paper.author, searchQuery)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText size={13} strokeWidth={2} />
                      {paper.questionCount} 题
                    </span>
                  </div>

                  {paper.tags && paper.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3.5">
                      {paper.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md text-[12px] font-medium"
                        >
                          {highlightText(tag, searchQuery)}
                        </span>
                      ))}
                      {paper.tags.length > 3 && (
                        <span className="px-2 py-1 text-zinc-400 dark:text-zinc-500 text-[12px]">
                          +{paper.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handlePreview(paper)}
                    disabled={downloading === paper.id}
                    className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white dark:text-zinc-900 disabled:text-zinc-500 rounded-lg flex items-center justify-center gap-2 transition-all duration-150 text-[14px] font-medium"
                  >
                    <Download size={15} strokeWidth={2} />
                    {downloading === paper.id ? "加载中..." : "预览并导入"}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {selectedPaper && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={() => setSelectedPaper(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
                  <h1 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedPaper.title}
                  </h1>
                  <button
                    onClick={() => setSelectedPaper(null)}
                    className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
                    aria-label="关闭"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                  <div className="mb-6 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-lg p-4">
                    <p className="text-[14px] text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">作者: </span>
                      {selectedPaper.author}
                    </p>
                    <p className="text-[14px] text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">描述: </span>
                      {selectedPaper.description || "无"}
                    </p>
                    <p className="text-[14px] text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">题目数量: </span>
                      {selectedPaper.questions.length} 题
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100">题目预览</h4>
                    {selectedPaper.questions.slice(0, 5).map((q, idx) => (
                      <div key={q.id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 bg-white dark:bg-zinc-900">
                        <p className="text-[14px] mb-2 text-zinc-700 dark:text-zinc-300">
                          <span className="font-medium text-zinc-500 dark:text-zinc-400">#{idx + 1}</span> {q.sentence}
                        </p>
                        <p className="text-[13px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium">答案:</span> {q.answer}
                        </p>
                        {q.translation && (
                          <p className="text-[13px] text-zinc-500 dark:text-zinc-500 italic mt-1.5">
                            {q.translation}
                          </p>
                        )}
                      </div>
                    ))}
                    {selectedPaper.questions.length > 5 && (
                      <p className="text-[13px] text-zinc-400 dark:text-zinc-500 text-center py-2">
                        ...还有 {selectedPaper.questions.length - 5} 道题
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
                  <button
                    onClick={() => setSelectedPaper(null)}
                    className="flex-1 py-2.5 text-[14px] font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150 text-zinc-700 dark:text-zinc-300"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleImport(selectedPaper)}
                    className="flex-1 py-2.5 text-[14px] font-medium bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg transition-all duration-150 shadow-sm"
                  >
                    导入到本地
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
