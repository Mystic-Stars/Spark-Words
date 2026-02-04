"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, ClipboardPaste, Lightbulb, Copy, Check, Tag as TagIcon, Sparkles, Loader2 } from "lucide-react";
import { generatePromptFromWords, validateQuestionSet } from "@/lib/promptUtils";
import { savePaper, generateId, getAllPapers, getAIConfig } from "@/lib/storage";
import { QuestionSet, Question } from "@/types/question";
import { generatePaperWithAI, generatePaperWithAIStream } from "@/lib/aiService";
import { AIGenerationParams } from "@/types/aiConfig";
import { createSmoothText } from "@/lib/smoothText";

interface NewPaperModalProps {
  onClose: () => void;
  onPaperCreated: (papers: QuestionSet[], newPaperId: string) => void;
  mode?: 'manual' | 'ai'; // 新增：生成模式
}

type TabType = "words" | "prompt" | "json" | "ai";

export default function NewPaperModal({
  onClose,
  onPaperCreated,
  mode = 'manual',
}: NewPaperModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(mode === 'ai' ? 'ai' : 'words');

  // Words tab state
  const [wordsInput, setWordsInput] = useState("");
  const [wordsError, setWordsError] = useState("");

  // Prompt tab state
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  // JSON tab state
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [paperDescription, setPaperDescription] = useState("");
  const [paperTags, setPaperTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // AI tab state
  const [aiTheme, setAiTheme] = useState("");
  const [aiWords, setAiWords] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [aiQuestionCount, setAiQuestionCount] = useState(20);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  // AI 流式生成状态
  const [aiProgress, setAiProgress] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [streamingPaperTitle, setStreamingPaperTitle] = useState("");
  const questionsContainerRef = useRef<HTMLDivElement>(null);

  // 打字机效果状态（用于格式化文本的平滑显示）
  const [displayedText, setDisplayedText] = useState("");
  const smoothTextControllerRef = useRef<ReturnType<typeof createSmoothText> | null>(null);
  const lastFormattedTextRef = useRef(""); // 跟踪上次格式化的文本

  // AI 生成步骤状态 (1 = 输入参数, 2 = 生成中/完成)
  const [aiStep, setAiStep] = useState(1);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generatedPaperId, setGeneratedPaperId] = useState<string | null>(null);

  // 清理函数：确保关闭时移除所有可能的样式残留
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

  const handleGeneratePrompt = () => {
    try {
      // 解析输入的单词列表
      const words = wordsInput
        .split(/[,\s\n]+/)
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word.length > 0);

      if (words.length === 0) {
        throw new Error("请输入至少一个单词");
      }

      // 验证是否都是英文单词
      const invalidWords = words.filter((word) => !/^[a-z]+$/.test(word));
      if (invalidWords.length > 0) {
        throw new Error(
          `包含无效单词: ${invalidWords.slice(0, 3).join(", ")}${invalidWords.length > 3 ? "..." : ""
          }`
        );
      }

      const prompt = generatePromptFromWords(words);
      setGeneratedPrompt(prompt);
      setWordsError("");
      setActiveTab("prompt");
    } catch (err) {
      setWordsError(err instanceof Error ? err.message : "生成失败");
    }
  };

  // 监听单词输入，自动生成 Prompt
  const handleWordsInputChange = (value: string) => {
    setWordsInput(value);
    setWordsError("");

    // 防抖：延迟生成 Prompt
    const words = value
      .split(/[,\s\n]+/)
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0);

    if (words.length > 0) {
      // 验证是否都是英文单词
      const invalidWords = words.filter((word) => !/^[a-z]+$/.test(word));
      if (invalidWords.length === 0) {
        // 自动生成 Prompt
        const prompt = generatePromptFromWords(words);
        setGeneratedPrompt(prompt);
      }
    }
  };

  const handlePasteWords = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWordsInput(text);
    } catch (err) {
      setWordsError("无法访问剪贴板");
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleImportJson = () => {
    try {
      setJsonError("");
      const data = JSON.parse(jsonInput);

      // 验证数据格式
      const validation = validateQuestionSet(data);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 使用用户编辑的信息或 JSON 中的信息
      const finalTitle = paperTitle.trim() || data.title || "未命名试卷";
      const finalDescription = paperDescription.trim() || data.description || "";

      // 创建新试卷
      const newPaper: QuestionSet = {
        ...data,
        id: generateId(),
        title: finalTitle,
        description: finalDescription,
        tags: paperTags.length > 0 ? paperTags : (data.tags || []),
        createdAt: new Date().toISOString(),
      };

      // 保存并更新
      savePaper(newPaper);
      const updatedPapers = getAllPapers();

      onPaperCreated(updatedPapers, newPaper.id);
      onClose();
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "JSON 格式错误");
    }
  };

  const handleJsonInputChange = (value: string) => {
    setJsonInput(value);
    setJsonError("");

    // 尝试自动解析并填充元信息
    try {
      const data = JSON.parse(value);
      if (data.title && !paperTitle) {
        setPaperTitle(data.title);
      }
      if (data.description && !paperDescription) {
        setPaperDescription(data.description);
      }
      if (data.tags && Array.isArray(data.tags) && paperTags.length === 0) {
        setPaperTags(data.tags);
      }
    } catch {
      // JSON 未完成解析，忽略错误
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !paperTags.includes(tag)) {
      setPaperTags([...paperTags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setPaperTags(paperTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // AI 生成处理 - 使用流式生成 + 打字机效果
  const handleAIGenerate = async () => {
    try {
      // 验证输入
      if (!aiTheme.trim()) {
        setAiError("请输入试卷主题");
        return;
      }

      // 切换到第2步
      setAiStep(2);
      setActiveTab("ai" as TabType);
      setAiError("");
      setAiGenerating(true);
      setAiProgress("正在初始化...");
      setGeneratedQuestions([]);
      setStreamingPaperTitle("");
      setGenerationComplete(false);
      setDisplayedText("");
      lastFormattedTextRef.current = "";

      // 初始化打字机控制器（用于格式化文本的平滑显示）
      if (!smoothTextControllerRef.current) {
        smoothTextControllerRef.current = createSmoothText({
          onTextUpdate: (_delta, text) => {
            setDisplayedText(text);
            // 使用 RAF 同步滚动，避免卡顿
            requestAnimationFrame(() => {
              if (questionsContainerRef.current) {
                questionsContainerRef.current.scrollTop = questionsContainerRef.current.scrollHeight;
              }
            });
          },
          // 使用默认速度（120字符/秒），配合算法自动调节
        });
      }

      // 检查配置
      const config = getAIConfig();
      if (!config) {
        throw new Error("请先在设置中配置 AI 服务");
      }

      // 解析单词列表
      const wordsList = aiWords
        .split(/[,\s\n]+/)
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0);

      // 生成参数
      const params: AIGenerationParams = {
        theme: aiTheme.trim(),
        words: wordsList.length > 0 ? wordsList : undefined,
        difficulty: aiDifficulty,
        questionCount: aiQuestionCount,
      };

      // 调用流式 AI 生成（启用平滑动画）
      let accumulatedText = ''; // 累积的原始文本

      await generatePaperWithAIStream(config, params, (data) => {
        if (data.type === 'progress') {
          setAiProgress(data.progress || '');
        } else if (data.type === 'text') {
          // 逐字符流式输出 - 累积原始文本
          if (data.fullText) {
            accumulatedText = data.fullText;

            // 尝试解析 JSON 并格式化为可读的题目列表
            let formatted = '';
            let parsedData: any = null;

            try {
              // 尝试提取并解析 JSON
              const jsonMatch = accumulatedText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
              }
            } catch {
              // 完整JSON解析失败，尝试部分解析
              try {
                // 提取title
                const titleMatch = accumulatedText.match(/"title"\s*:\s*"([^"]*)"/);
                if (titleMatch) {
                  parsedData = { title: titleMatch[1] };
                }

                // 提取description
                const descMatch = accumulatedText.match(/"description"\s*:\s*"([^"]*)"/);
                if (descMatch) {
                  parsedData = parsedData || {};
                  parsedData.description = descMatch[1];
                }

                // 提取questions数组（即使不完整）
                const questionsMatch = accumulatedText.match(/"questions"\s*:\s*\[([\s\S]*)/);
                if (questionsMatch) {
                  parsedData = parsedData || {};
                  parsedData.questions = [];

                  // 提取已有的题目（使用正则逐个匹配）
                  const questionPattern = /\{\s*"id"\s*:\s*"([^"]*)"\s*,\s*"sentence"\s*:\s*"([^"]*)"\s*,\s*"answer"\s*:\s*"([^"]*)"\s*,\s*"hint"\s*:\s*"([^"]*)"\s*(?:,\s*"translation"\s*:\s*"([^"]*)"\s*)?\}/g;
                  let match;
                  while ((match = questionPattern.exec(accumulatedText)) !== null) {
                    parsedData.questions.push({
                      id: match[1],
                      sentence: match[2],
                      answer: match[3],
                      hint: match[4],
                      translation: match[5] || undefined
                    });
                  }
                }
              } catch {
                // 部分解析也失败
              }
            }

            // 格式化显示
            if (parsedData) {
              formatted = `📝 ${parsedData.title || '试卷生成中...'}\n`;
              if (parsedData.description) {
                formatted += `${parsedData.description}\n`;
              }
              formatted += `\n`;

              if (parsedData.questions && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
                parsedData.questions.forEach((q: any, idx: number) => {
                  formatted += `${idx + 1}. ${q.sentence}\n`;
                  if (q.translation) {
                    formatted += `   ${q.translation}\n`;
                  }
                  formatted += `\n`;
                });

                setAiProgress(`已生成 ${parsedData.questions.length} 题`);
              }

              // 使用新 API：推送完整目标文本（内部自动防重复）
              smoothTextControllerRef.current?.pushText(formatted);

              // 启动打字机动画（如果未激活）
              if (!smoothTextControllerRef.current?.isAnimationActive) {
                smoothTextControllerRef.current?.startAnimation();
              }
            } else {
              // 完全无法解析，显示原始流（直接设置，不使用动画）
              setDisplayedText(accumulatedText);
            }
          }
        } else if (data.type === 'complete') {
          if (data.paper) {
            // 立即允许用户点击，不等待动画完成
            finalizeGeneration(data.paper!);
          }
        } else if (data.type === 'error') {
          throw new Error(data.error || '生成失败');
        }
      }, { text: 'smooth', speed: 15 }); // AI流式速度稍慢一些，让格式化动画更明显

      // 辅助函数：完成生成
      function finalizeGeneration(paper: QuestionSet) {
        // 最终格式化显示
        let finalText = `📝 ${paper.title}\n`;
        if (paper.description) {
          finalText += `${paper.description}\n`;
        }
        finalText += `\n`;

        paper.questions.forEach((q, idx) => {
          finalText += `${idx + 1}. ${q.sentence}\n`;
          if (q.translation) {
            finalText += `   ${q.translation}\n`;
          }
          finalText += `\n`;
        });

        // 使用新 API 推送完整最终文本（自动防重复）
        smoothTextControllerRef.current?.pushText(finalText);

        // 启动/继续动画，完成后执行回调
        smoothTextControllerRef.current?.startAnimation().then(() => {
          completeGeneration(paper);
        });
      }

      // 辅助函数：完成并保存
      function completeGeneration(paper: QuestionSet) {
        savePaper(paper);
        setGeneratedPaperId(paper.id);
        setStreamingPaperTitle(paper.title);
        setGenerationComplete(true); // 立即设置完成，允许点击
        setAiProgress("生成完成！正在渲染..."); // 提示动画还在播放
        setAiGenerating(false);
        setGeneratedQuestions(paper.questions);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "生成失败");
      setAiGenerating(false);
      setAiProgress("");
      // 错误时返回第1步
      setAiStep(1);
      smoothTextControllerRef.current?.stopAnimation();
    }
  };

  // 完成生成后的操作
  const handleGenerationFinish = () => {
    if (generatedPaperId) {
      const updatedPapers = getAllPapers();
      onPaperCreated(updatedPapers, generatedPaperId);
      onClose();
    }
  };

  // 返回第1步重新配置
  const handleBackToStep1 = () => {
    setAiStep(1);
    setGeneratedQuestions([]);
    setDisplayedText("");
    setAiProgress("");
    setGenerationComplete(false);
    setGeneratedPaperId(null);
    lastFormattedTextRef.current = "";
    smoothTextControllerRef.current?.stopAnimation();
    smoothTextControllerRef.current = null;
  };

  const tabs: { id: TabType | 'ai-step1' | 'ai-step2'; label: string; disabled?: boolean }[] = mode === 'ai'
    ? [
      { id: "ai-step1", label: "配置参数" },
      { id: "ai-step2", label: "生成试卷", disabled: aiStep < 2 },
    ]
    : [
      { id: "words", label: "导入单词" },
      { id: "prompt", label: "生成 Prompt" },
      { id: "json", label: "导入 JSON" },
    ];

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
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden relative border border-zinc-200/50 dark:border-zinc-800/50 mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ height: "90vh", maxHeight: "900px" }}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
            新建试卷
          </h1>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
            aria-label="关闭"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Content with Sidebar */}
        <div className="flex flex-col md:flex-row" style={{ height: "calc(90vh - 3.5rem)", maxHeight: "calc(900px - 3.5rem)" }}>
          {/* 左侧标签栏 - 桌面端显示 */}
          <div className="hidden md:block md:w-56 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 py-4 px-3">
            <nav className="space-y-0.5">
              {tabs.map((tab, index) => {
                // 处理AI模式的特殊tab
                let tabId: TabType;
                let isSelected: boolean;
                let isDisabled = tab.disabled || false;

                if (tab.id === 'ai-step1') {
                  tabId = 'ai';
                  isSelected = activeTab === 'ai' && aiStep === 1;
                } else if (tab.id === 'ai-step2') {
                  tabId = 'ai';
                  isSelected = activeTab === 'ai' && aiStep === 2;
                } else {
                  tabId = tab.id as TabType;
                  isSelected = activeTab === tab.id;
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (isDisabled) return;
                      if (tab.id === 'ai-step1') {
                        setActiveTab('ai');
                        setAiStep(1);
                      } else if (tab.id === 'ai-step2') {
                        setActiveTab('ai');
                        // 如果还没生成，不允许直接跳转
                        if (aiStep >= 2) {
                          setAiStep(2);
                        }
                      } else {
                        setActiveTab(tabId);
                      }
                    }}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-150
                      ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                      ${isSelected
                        ? "bg-zinc-200/70 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }
                    `}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center text-xs font-semibold shrink-0",
                        isSelected
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      )}
                    >
                      {index + 1}
                    </div>
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="flex md:hidden border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            {tabs.map((tab, index) => {
              // 处理AI模式的特殊tab
              let tabId: TabType;
              let isSelected: boolean;
              let isDisabled = tab.disabled || false;

              if (tab.id === 'ai-step1') {
                tabId = 'ai';
                isSelected = activeTab === 'ai' && aiStep === 1;
              } else if (tab.id === 'ai-step2') {
                tabId = 'ai';
                isSelected = activeTab === 'ai' && aiStep === 2;
              } else {
                tabId = tab.id as TabType;
                isSelected = activeTab === tab.id;
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isDisabled) return;
                    if (tab.id === 'ai-step1') {
                      setActiveTab('ai');
                      setAiStep(1);
                    } else if (tab.id === 'ai-step2') {
                      setActiveTab('ai');
                      if (aiStep >= 2) {
                        setAiStep(2);
                      }
                    } else {
                      setActiveTab(tabId);
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors ${isDisabled ? 'opacity-40' : ''
                    } ${isSelected
                      ? "border-b-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-medium"
                      : "text-zinc-600 dark:text-zinc-400"
                    }`}
                >
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center text-xs font-semibold",
                    isSelected
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  )}>
                    {index + 1}
                  </div>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto py-6 md:py-8 px-4 md:px-10 custom-scrollbar">
              {/* Words Tab */}
              {activeTab === "words" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl"
                >
                  {/* 标题区 */}
                  <div className="mb-8">
                    <h3 className="text-[28px] font-bold mb-2 text-zinc-900 dark:text-zinc-100">导入单词列表</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-[14px]">
                      输入单词列表，支持逗号、空格或换行分隔
                    </p>
                  </div>

                  {/* 输入区 */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                        单词列表
                      </label>
                      <button
                        onClick={handlePasteWords}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md font-medium transition-colors"
                      >
                        <ClipboardPaste className="w-4 h-4" strokeWidth={2} />
                        从剪贴板粘贴
                      </button>
                    </div>
                    <textarea
                      value={wordsInput}
                      onChange={(e) => handleWordsInputChange(e.target.value)}
                      placeholder="例如：discovery, ability, measure, diet, encourage"
                      className="w-full h-72 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 resize-none focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-[13px] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  {/* 错误提示 */}
                  {wordsError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg"
                    >
                      <p className="text-red-700 dark:text-red-400 text-[13px] flex items-center gap-2">
                        <span>⚠️</span> {wordsError}
                      </p>
                    </motion.div>
                  )}

                  {/* 提示卡片 */}
                  <div className="mb-8 p-5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg">
                    <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-500 dark:text-blue-400" strokeWidth={2} />
                      使用提示
                    </h4>
                    <ul className="text-[13px] text-zinc-600 dark:text-zinc-400 space-y-2.5">
                      <li className="flex items-start gap-2.5">
                        <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                        <span>每个单词应为英文字母，支持多种分隔符</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                        <span>导入后会生成包含这些单词的 AI Prompt</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                        <span>复制 Prompt 给 AI，AI 会生成练习题</span>
                      </li>
                    </ul>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        // 验证单词列表
                        const words = wordsInput
                          .split(/[,\s\n]+/)
                          .map((word) => word.trim().toLowerCase())
                          .filter((word) => word.length > 0);

                        if (words.length === 0) {
                          setWordsError("请输入至少一个单词");
                          return;
                        }

                        const invalidWords = words.filter((word) => !/^[a-z]+$/.test(word));
                        if (invalidWords.length > 0) {
                          setWordsError(
                            `包含无效单词: ${invalidWords.slice(0, 3).join(", ")}${invalidWords.length > 3 ? "..." : ""
                            }`
                          );
                          return;
                        }

                        // 跳转到 Prompt 标签页
                        setActiveTab("prompt");
                      }}
                      disabled={!generatedPrompt}
                      className="px-5 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-150 text-[13px] font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      下一步：查看 Prompt
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Prompt Tab */}
              {activeTab === "prompt" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl"
                >
                  <div className="mb-8">
                    <h3 className="text-3xl font-bold mb-2 text-foreground">AI Prompt</h3>
                    <p className="text-muted-foreground text-base">
                      复制此 Prompt 给 AI，然后导入 AI 返回的 JSON
                    </p>
                  </div>

                  {generatedPrompt ? (
                    <>
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-medium text-foreground">
                            Prompt 内容
                          </label>
                          <button
                            onClick={handleCopyPrompt}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium",
                              copied
                                ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
                                : "bg-accent text-white hover:bg-accent/90 shadow-sm"
                            )}
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                复制 Prompt
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="w-full max-h-[500px] p-4 border border-border rounded-lg bg-muted/50 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-auto custom-scrollbar">
                          {generatedPrompt}
                        </pre>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setActiveTab("words")}
                          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        >
                          返回
                        </button>
                        <button
                          onClick={() => setActiveTab("json")}
                          className="px-5 py-2 rounded-md bg-foreground text-background hover:opacity-90 transition-all text-sm font-medium shadow-sm"
                        >
                          下一步：导入 JSON
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                        <span className="text-xl">📝</span>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        请先在「导入单词」步骤中生成 Prompt
                      </p>
                      <button
                        onClick={() => setActiveTab("words")}
                        className="text-accent hover:underline text-sm font-medium"
                      >
                        返回导入单词
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* JSON Tab */}
              {activeTab === "json" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl"
                >
                  <div className="mb-8">
                    <h3 className="text-[28px] font-bold mb-2 text-zinc-900 dark:text-zinc-100">导入 JSON</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-[14px]">
                      粘贴 AI 返回的 JSON 数据并编辑试卷信息
                    </p>
                  </div>

                  {/* 试卷元信息编辑 */}
                  <div className="mb-6 space-y-4 p-5 bg-zinc-50 dark:bg-zinc-950/30 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-3">试卷信息</h4>

                    {/* 试卷名称 */}
                    <div>
                      <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-2 block">
                        试卷名称 <span className="text-red-600 dark:text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={paperTitle}
                        onChange={(e) => setPaperTitle(e.target.value)}
                        placeholder="例如：高考英语词汇练习"
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[13px] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    {/* 试卷描述 */}
                    <div>
                      <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-2 block">
                        试卷描述
                      </label>
                      <input
                        type="text"
                        value={paperDescription}
                        onChange={(e) => setPaperDescription(e.target.value)}
                        placeholder="例如：包含常用高频词汇的填空练习"
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[13px] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    {/* 标签 */}
                    <div>
                      <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-2 block">
                        标签
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          placeholder="输入标签后按 Enter"
                          className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[13px] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                        />
                        <button
                          onClick={handleAddTag}
                          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md text-[13px] font-medium transition-all duration-150"
                        >
                          添加
                        </button>
                      </div>
                      {paperTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {paperTags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-md text-[13px]"
                            >
                              <TagIcon className="w-3 h-3" strokeWidth={2} />
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* JSON 输入 */}
                  <div className="mb-6">
                    <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-3 block">
                      JSON 数据
                    </label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => handleJsonInputChange(e.target.value)}
                      placeholder='{"title": "...", "questions": [...]}'
                      className="w-full h-80 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 resize-none focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-[13px] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  {jsonError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg"
                    >
                      <p className="text-red-700 dark:text-red-400 text-[13px] flex items-center gap-2">
                        <span>⚠️</span> {jsonError}
                      </p>
                    </motion.div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setActiveTab("prompt")}
                      className="px-4 py-2 text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
                    >
                      返回
                    </button>
                    <button
                      onClick={handleImportJson}
                      className="px-5 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-150 text-[13px] font-medium shadow-sm"
                    >
                      创建试卷
                    </button>
                  </div>
                </motion.div>
              )}
              {/* AI 生成 Tab */}
              {activeTab === "ai" && (
                <div>
                  {/* 第1步：参数配置 */}
                  {aiStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* 主题输入 */}
                      <div className="mb-6">
                        <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-2 block">
                          试卷主题 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={aiTheme}
                          onChange={(e) => {
                            setAiTheme(e.target.value);
                            setAiError("");
                          }}
                          placeholder="例如：日常生活英语、商务英语、旅游英语"
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[13px] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                        />
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1">
                          描述您想要的试卷主题，AI 将据此生成相关题目
                        </p>
                      </div>

                      {/* 单词列表（可选） */}
                      <div className="mb-6">
                        <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-2 block">
                          指定单词（可选）
                        </label>
                        <textarea
                          value={aiWords}
                          onChange={(e) => setAiWords(e.target.value)}
                          placeholder="输入希望包含的单词，用空格或逗号分隔，例如：apple, banana, orange"
                          className="w-full h-24 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 resize-none focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[13px] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      {/* 难度选择 */}
                      <div className="mb-6">
                        <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-3 block">
                          难度等级
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'beginner' as const, label: '初级', desc: '简单常用词汇' },
                            { value: 'intermediate' as const, label: '中级', desc: '日常词汇' },
                            { value: 'advanced' as const, label: '高级', desc: '较复杂词汇' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setAiDifficulty(option.value)}
                              className={`px-4 py-3 rounded-lg text-left transition-all ${aiDifficulty === option.value
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                            >
                              <div className="text-[13px] font-medium mb-0.5">{option.label}</div>
                              <div className={`text-[11px] ${aiDifficulty === option.value ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                {option.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 题目数量 */}
                      <div className="mb-6">
                        <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-3 block">
                          题目数量：{aiQuestionCount} 题
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="50"
                          step="5"
                          value={aiQuestionCount}
                          onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          <span>10</span>
                          <span>50</span>
                        </div>
                      </div>

                      {aiError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg"
                        >
                          <p className="text-red-700 dark:text-red-400 text-[13px] flex items-center gap-2">
                            <span>⚠️</span> {aiError}
                          </p>
                        </motion.div>
                      )}

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={handleClose}
                          className="px-4 py-2 text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleAIGenerate}
                          disabled={!aiTheme.trim()}
                          className="px-5 py-2 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all duration-150 text-[13px] font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          开始生成
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* 第2步：生成页面 */}
                  {aiStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="min-h-[500px] flex flex-col"
                    >
                      {/* 标题 */}
                      <div className="mb-6 text-center">
                        <h2 className="text-[18px] font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                          {generationComplete ? '生成完成！' : '正在生成试卷...'}
                        </h2>
                        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                          {streamingPaperTitle || aiTheme}
                        </p>
                      </div>

                      {/* 进度指示 */}
                      {aiGenerating && aiProgress && (
                        <div className="mb-6 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-600 dark:text-zinc-400" />
                          <span className="shiny-text text-[13px] font-medium">
                            {aiProgress}
                          </span>
                        </div>
                      )}

                      {/* 题目文本区域 */}
                      <div className="flex-1 overflow-hidden">
                        <div
                          ref={questionsContainerRef}
                          className="h-full max-h-[450px] overflow-y-auto px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg custom-scrollbar"
                        >
                          {displayedText ? (
                            <pre className="font-sans text-[14px] leading-relaxed text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words">
                              {smoothTextControllerRef.current?.isAnimationActive ? (
                                <>
                                  {/* 主体文本 - 已输出的稳定部分 */}
                                  {displayedText.slice(0, -12)}
                                  {/* 尾部流光效果 - 最后12个字符 */}
                                  <span className="typing-glow-tail">
                                    {displayedText.slice(-12)}
                                  </span>
                                  {/* 闪烁光标 */}
                                  <span className="typing-cursor" />
                                </>
                              ) : (
                                displayedText
                              )}
                            </pre>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 gap-3">
                              <Loader2 className="w-6 h-6 animate-spin" />
                              <span className="shiny-text text-sm">等待 AI 响应...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 底部按钮 */}
                      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
                        {generationComplete ? (
                          <>
                            <button
                              onClick={handleBackToStep1}
                              className="px-4 py-2 text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-150"
                            >
                              重新配置
                            </button>
                            <button
                              onClick={handleGenerationFinish}
                              className="px-5 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all duration-150 text-[13px] font-medium flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              开始练习
                            </button>
                          </>
                        ) : (
                          <button
                            disabled
                            className="px-4 py-2 text-[13px] text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                          >
                            生成中，请稍候...
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}          </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
