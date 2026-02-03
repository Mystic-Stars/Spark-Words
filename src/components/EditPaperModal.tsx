"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  X,
  Tag as TagIcon,
  FileText,
  ListOrdered,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Save
} from "lucide-react";
import { QuestionSet, Question } from "@/types/question";

interface EditPaperModalProps {
  paper: QuestionSet;
  onSave: (updatedPaper: QuestionSet) => void;
  onClose: () => void;
}

type EditCategory = "info" | "questions";

export default function EditPaperModal({
  paper,
  onSave,
  onClose,
}: EditPaperModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<EditCategory>("info");
  const [title, setTitle] = useState(paper.title);
  const [description, setDescription] = useState(paper.description || "");
  const [tags, setTags] = useState<string[]>(paper.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [questions, setQuestions] = useState<Question[]>([...paper.questions]);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

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

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("试卷名称不能为空");
      return;
    }

    if (questions.length === 0) {
      alert("试卷至少需要一道题目");
      return;
    }

    const updatedPaper: QuestionSet = {
      ...paper,
      title: title.trim(),
      description: description.trim(),
      tags,
      questions,
    };

    onSave(updatedPaper);
    handleClose();
  };

  // 题目管理函数
  const handleToggleQuestion = (questionId: string) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
      setEditingQuestion(null);
    } else {
      setExpandedQuestionId(questionId);
      const question = questions.find(q => q.id === questionId);
      if (question) {
        setEditingQuestion({ ...question });
      }
    }
  };

  const handleQuestionChange = (field: keyof Question, value: string) => {
    if (editingQuestion) {
      setEditingQuestion({ ...editingQuestion, [field]: value });
    }
  };

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      if (!editingQuestion.sentence.trim() || !editingQuestion.answer.trim()) {
        alert("句子和答案不能为空");
        return;
      }
      setQuestions(questions.map(q =>
        q.id === editingQuestion.id ? editingQuestion : q
      ));
      setExpandedQuestionId(null);
      setEditingQuestion(null);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (questions.length <= 1) {
      alert("试卷至少需要保留一道题目");
      return;
    }
    if (confirm("确定要删除这道题目吗？")) {
      setQuestions(questions.filter(q => q.id !== questionId));
      if (expandedQuestionId === questionId) {
        setExpandedQuestionId(null);
        setEditingQuestion(null);
      }
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentence: "The scientist made a remarkable d_____ in the field of quantum physics.",
      answer: "discovery",
      hint: "d",
      translation: "",
    };
    setQuestions([...questions, newQuestion]);
    setExpandedQuestionId(newQuestion.id);
    setEditingQuestion({ ...newQuestion });
  };

  const categories = [
    { id: "info" as EditCategory, label: "试卷信息", icon: FileText },
    { id: "questions" as EditCategory, label: "题目管理", icon: ListOrdered },
  ];

  const renderInfoContent = () => (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-[14px] font-medium mb-2 text-zinc-800 dark:text-zinc-100">
          试卷名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：高考英语词汇练习"
          className="w-full px-3 py-2.5 text-[14px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[14px] font-medium mb-2 text-zinc-800 dark:text-zinc-100">
          试卷描述
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例如：包含常用高频词汇的填空练习"
          rows={3}
          className="w-full px-3 py-2.5 text-[14px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[14px] font-medium mb-2 text-zinc-800 dark:text-zinc-100">
          标签
        </label>
        <div className="flex gap-2.5 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="输入标签后按 Enter"
            className="flex-1 px-3 py-2.5 text-[14px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[14px] font-medium transition-all duration-150"
          >
            添加
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-[13px] font-medium"
              >
                <TagIcon className="w-3.5 h-3.5" strokeWidth={2} />
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-[16px] leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4 text-[13px] text-zinc-500 dark:text-zinc-400">
          <span>共 {questions.length} 道题目</span>
          {paper.createdAt && (
            <span>创建于 {new Date(paper.createdAt).toLocaleDateString('zh-CN')}</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuestionsContent = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100">
            题目列表
          </h3>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            拖拽排序，点击展开编辑
          </p>
        </div>
        <button
          onClick={handleAddQuestion}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[13px] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          添加题目
        </button>
      </div>

      {/* Question List */}
      <Reorder.Group
        axis="y"
        values={questions}
        onReorder={setQuestions}
        className="space-y-2"
      >
        {questions.map((question, index) => (
          <Reorder.Item
            key={question.id}
            value={question}
            layout
            initial={false}
            className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900"
            style={{ position: "relative" }}
            whileDrag={{
              scale: 1.02,
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              zIndex: 50
            }}
            transition={{
              layout: { duration: 0.2 },
              scale: { duration: 0.15 }
            }}
          >
            {/* Question Header */}
            <div className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
              <div
                className="cursor-grab active:cursor-grabbing p-1 -m-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                <GripVertical className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              </div>
              <span className="w-6 h-6 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 rounded text-[12px] font-medium text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                {index + 1}
              </span>
              <button
                onClick={() => handleToggleQuestion(question.id)}
                className="flex-1 min-w-0 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 -my-2 -mr-2 py-2 pr-2 rounded transition-colors text-left"
              >
                <p className="text-[13px] text-zinc-700 dark:text-zinc-200 truncate flex-1">
                  {question.sentence}
                </p>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[11px] font-medium flex-shrink-0">
                  {question.answer}
                </span>
                {expandedQuestionId === question.id ? (
                  <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                )}
              </button>
            </div>

            {/* Question Edit Form */}
            <AnimatePresence>
              {expandedQuestionId === question.id && editingQuestion && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    {/* Sentence */}
                    <div>
                      <label className="block text-[12px] font-medium mb-1.5 text-zinc-600 dark:text-zinc-400">
                        句子 <span className="text-red-500">*</span>
                        <span className="font-normal text-zinc-400 dark:text-zinc-500 ml-1">
                          用 首字母+下划线 标记答案位置，如 d_____
                        </span>
                      </label>
                      <textarea
                        value={editingQuestion.sentence}
                        onChange={(e) => handleQuestionChange("sentence", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-[13px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        placeholder="The scientist made a remarkable d_____ in the field."
                      />
                    </div>

                    {/* Answer & Hint */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-medium mb-1.5 text-zinc-600 dark:text-zinc-400">
                          答案 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editingQuestion.answer}
                          onChange={(e) => handleQuestionChange("answer", e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="word"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium mb-1.5 text-zinc-600 dark:text-zinc-400">
                          提示（首字母）
                        </label>
                        <input
                          type="text"
                          value={editingQuestion.hint}
                          onChange={(e) => handleQuestionChange("hint", e.target.value)}
                          maxLength={3}
                          className="w-full px-3 py-2 text-[13px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="w"
                        />
                      </div>
                    </div>

                    {/* Translation */}
                    <div>
                      <label className="block text-[12px] font-medium mb-1.5 text-zinc-600 dark:text-zinc-400">
                        中文翻译（可选）
                      </label>
                      <input
                        type="text"
                        value={editingQuestion.translation || ""}
                        onChange={(e) => handleQuestionChange("translation", e.target.value)}
                        className="w-full px-3 py-2 text-[13px] border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="这个单词非常重要。"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[13px] font-medium transition-all"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                        删除题目
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setExpandedQuestionId(null);
                            setEditingQuestion(null);
                          }}
                          className="px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-[13px] font-medium transition-all"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveQuestion}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[13px] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
                        >
                          <Save className="w-4 h-4" strokeWidth={2} />
                          保存
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {questions.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-[14px] text-zinc-500 dark:text-zinc-400">
            暂无题目，点击上方按钮添加第一道题目
          </p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (selectedCategory) {
      case "info":
        return renderInfoContent();
      case "questions":
        return renderQuestionsContent();
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
            编辑试卷
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
                    {category.id === "questions" && (
                      <span className="ml-auto text-[11px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-400">
                        {questions.length}
                      </span>
                    )}
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
                  {category.id === "questions" && (
                    <span className="text-[11px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">
                      {questions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Content */}
          <div className="flex-1 py-6 md:py-8 px-4 md:px-10 overflow-y-auto custom-scrollbar">
            {renderContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 text-[14px] font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150 text-zinc-700 dark:text-zinc-300"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 text-[14px] font-medium bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg transition-all duration-150"
          >
            保存更改
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
