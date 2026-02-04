"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, FileText, PanelLeftClose, Globe, X, Trash2, Check, Square, CheckSquare } from "lucide-react";
import { QuestionSet } from "@/types/question";
import ContextMenu from "./ContextMenu";
import CommunityLibraryModal from "./CommunityLibraryModal";
import SharePaperModal from "./SharePaperModal";
import { useDialog } from "@/contexts/DialogContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  papers: QuestionSet[];
  currentPaperId: string;
  onSelectPaper: (id: string) => void;
  onNewPaper: () => void;
  onEditPaper: (paperId: string) => void;
  onDeletePaper: (paperId: string) => void;
  onDeletePapers?: (paperIds: string[]) => void;
  onRefreshPapers?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  papers,
  currentPaperId,
  onSelectPaper,
  onNewPaper,
  onEditPaper,
  onDeletePaper,
  onDeletePapers,
  onRefreshPapers,
}: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    paperId: string;
  } | null>(null);
  const [showCommunityLibrary, setShowCommunityLibrary] = useState(false);
  const [shareModalPaper, setShareModalPaper] = useState<QuestionSet | null>(null);

  // 多选模式状态
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const { confirm } = useDialog();

  const handleContextMenu = (
    e: React.MouseEvent,
    paperId: string
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      paperId,
    });
  };

  // 开始多选模式
  const handleStartSelect = useCallback((paperId: string) => {
    setIsMultiSelectMode(true);
    setSelectedPaperIds(new Set([paperId]));
    const index = papers.findIndex(p => p.id === paperId);
    setLastSelectedIndex(index);
  }, [papers]);

  // 退出多选模式
  const handleExitSelectMode = useCallback(() => {
    setIsMultiSelectMode(false);
    setSelectedPaperIds(new Set());
    setLastSelectedIndex(null);
  }, []);

  // 处理试卷点击（支持 Ctrl/Shift 多选）
  const handlePaperClick = useCallback((e: React.MouseEvent, paperId: string, index: number) => {
    if (isMultiSelectMode) {
      // 多选模式下的点击
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        // Shift/Ctrl+点击：添加到选中
        const newSelected = new Set(selectedPaperIds);
        if (newSelected.has(paperId)) {
          newSelected.delete(paperId);
        } else {
          newSelected.add(paperId);
        }
        setSelectedPaperIds(newSelected);
        setLastSelectedIndex(index);
      } else {
        // 普通点击：切换选中
        const newSelected = new Set(selectedPaperIds);
        if (newSelected.has(paperId)) {
          newSelected.delete(paperId);
        } else {
          newSelected.add(paperId);
        }
        setSelectedPaperIds(newSelected);
        setLastSelectedIndex(index);
      }
    } else {
      // 非多选模式
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        // Ctrl/Shift+点击进入多选模式
        setIsMultiSelectMode(true);
        setSelectedPaperIds(new Set([paperId]));
        setLastSelectedIndex(index);
      } else {
        // 普通点击：选择试卷
        onSelectPaper(paperId);
      }
    }
  }, [isMultiSelectMode, selectedPaperIds, lastSelectedIndex, papers, currentPaperId, onSelectPaper]);

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (selectedPaperIds.size === 0) return;

    const count = selectedPaperIds.size;
    const confirmed = await confirm({
      title: "批量删除",
      message: `确定要删除选中的 ${count} 份试卷吗？此操作不可恢复！`,
      confirmText: "删除",
      cancelText: "取消",
      variant: "danger",
    });

    if (confirmed) {
      if (onDeletePapers) {
        onDeletePapers(Array.from(selectedPaperIds));
      } else {
        // 如果没有批量删除方法，逐个删除
        selectedPaperIds.forEach(id => onDeletePaper(id));
      }
      handleExitSelectMode();
    }
  }, [selectedPaperIds, onDeletePapers, onDeletePaper, handleExitSelectMode, confirm]);

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedPaperIds.size === papers.length) {
      setSelectedPaperIds(new Set());
    } else {
      setSelectedPaperIds(new Set(papers.map(p => p.id)));
    }
  }, [selectedPaperIds, papers]);

  return (
    <>
      {/* 移动端遮罩层 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* 侧边栏 - 移动端覆盖式，PC端固定式 */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              {isMultiSelectMode ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExitSelectMode}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-foreground">
                    已选 {selectedPaperIds.size} 项
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <img
                    src="/ico-light.png"
                    alt="Logo"
                    className="w-6 h-6 object-contain block dark:hidden"
                  />
                  <img
                    src="/ico-dark.png"
                    alt="Logo"
                    className="w-6 h-6 object-contain hidden dark:block"
                  />
                  <h2 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
                    Spark Words
                  </h2>
                </div>
              )}
              <div className="flex items-center gap-1">
                {isMultiSelectMode && (
                  <button
                    onClick={handleSelectAll}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                    title={selectedPaperIds.size === papers.length ? "取消全选" : "全选"}
                  >
                    {selectedPaperIds.size === papers.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                )}
                <motion.button
                  whileHover={{ opacity: 0.6 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                  title="Close sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Papers List */}
            <div className="flex-1 overflow-y-auto px-2 py-3 custom-scrollbar">
              {papers.map((paper, index) => {
                const isSelected = selectedPaperIds.has(paper.id);
                return (
                  <motion.button
                    key={paper.id}
                    onClick={(e) => handlePaperClick(e, paper.id, index)}
                    onContextMenu={(e) => handleContextMenu(e, paper.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md mb-1 transition-all group",
                      isMultiSelectMode && isSelected
                        ? "bg-blue-100 dark:bg-blue-900/30 text-foreground ring-1 ring-blue-500/50"
                        : currentPaperId === paper.id && !isMultiSelectMode
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {isMultiSelectMode ? (
                        <div className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-muted-foreground/30"
                        )}>
                          {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                      ) : (
                        <FileText
                          className={cn(
                            "w-4 h-4 mt-0.5 flex-shrink-0 transition-colors",
                            currentPaperId === paper.id
                              ? "text-accent"
                              : "text-muted-foreground/50 group-hover:text-muted-foreground"
                          )}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-normal truncate leading-tight">
                          {paper.title}
                        </h3>
                        {paper.description && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                            {paper.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground/60">
                            {paper.questions.length} {paper.questions.length === 1 ? 'question' : 'questions'}
                          </p>
                          {paper.tags && paper.tags.length > 0 && (
                            <div className="flex gap-1">
                              {paper.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                              {paper.tags.length > 2 && (
                                <span className="text-xs text-muted-foreground/60">
                                  +{paper.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Action Buttons / Multi-select Actions */}
            {isMultiSelectMode ? (
              <div className="px-2 py-3 border-t border-border space-y-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleBatchDelete}
                  disabled={selectedPaperIds.size === 0}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-3 py-3 md:py-2.5 rounded-lg text-[14px] font-medium touch-manipulation transition-all",
                    selectedPaperIds.size > 0
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                  )}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                  删除 {selectedPaperIds.size} 项
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleExitSelectMode}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 md:py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-sm font-normal touch-manipulation"
                >
                  <X className="w-4 h-4" />
                  取消选择
                </motion.button>
              </div>
            ) : (
              <div className="px-2 py-3 border-t border-border space-y-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowCommunityLibrary(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 md:py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-[14px] font-medium touch-manipulation"
                >
                  <Globe className="w-4 h-4" strokeWidth={2} />
                  社区试卷
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onNewPaper}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 md:py-2 rounded-md bg-foreground text-background hover:opacity-90 transition-all text-sm font-normal touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  New Paper
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onEdit={() => onEditPaper(contextMenu.paperId)}
            onDelete={() => onDeletePaper(contextMenu.paperId)}
            onShare={() => {
              const paper = papers.find(p => p.id === contextMenu.paperId);
              if (paper) {
                setShareModalPaper(paper);
              }
              setContextMenu(null);
            }}
            onStartSelect={() => handleStartSelect(contextMenu.paperId)}
            isMultiSelectMode={isMultiSelectMode}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Community Library Modal */}
      <AnimatePresence mode="wait">
        {showCommunityLibrary && (
          <CommunityLibraryModal
            isOpen={showCommunityLibrary}
            onClose={() => setShowCommunityLibrary(false)}
            onImportSuccess={onRefreshPapers}
          />
        )}
      </AnimatePresence>

      {/* Share Paper Modal */}
      <AnimatePresence mode="wait">
        {shareModalPaper && (
          <SharePaperModal
            isOpen={!!shareModalPaper}
            onClose={() => setShareModalPaper(null)}
            paper={shareModalPaper}
          />
        )}
      </AnimatePresence>
    </>
  );
}
