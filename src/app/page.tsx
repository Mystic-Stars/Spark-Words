"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionSet } from "@/types/question";
import {
  getAllPapers,
  savePaper,
  deletePaper,
  getCurrentPaperId,
  saveCurrentPaperId,
  getAIConfig,
} from "@/lib/storage";
import { sampleQuestionSet } from "@/data/sampleData";
import QuizContainer from "@/components/QuizContainer";
import Sidebar from "@/components/Sidebar";
import NewPaperModal from "@/components/NewPaperModal";
import EditPaperModal from "@/components/EditPaperModal";
import SettingsModal from "@/components/SettingsModal";
import CreatePaperTypeModal from "@/components/CreatePaperTypeModal";
import {
  PanelLeft,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [papers, setPapers] = useState<QuestionSet[]>([]);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [showNewPaperModal, setShowNewPaperModal] = useState(false);
  const [newPaperMode, setNewPaperMode] = useState<'manual' | 'ai'>('manual');
  const [editingPaper, setEditingPaper] = useState<QuestionSet | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 加载数据
  useEffect(() => {
    const loadedPapers = getAllPapers();

    // 如果没有数据，加载示例数据
    if (loadedPapers.length === 0) {
      savePaper(sampleQuestionSet);
      setPapers([sampleQuestionSet]);
      setCurrentPaperId(sampleQuestionSet.id);
      saveCurrentPaperId(sampleQuestionSet.id);
    } else {
      setPapers(loadedPapers);

      // 尝试恢复上次选择的试卷
      const savedPaperId = getCurrentPaperId();
      const paperExists = savedPaperId && loadedPapers.some(p => p.id === savedPaperId);

      if (paperExists) {
        setCurrentPaperId(savedPaperId);
      } else {
        setCurrentPaperId(loadedPapers[0].id);
        saveCurrentPaperId(loadedPapers[0].id);
      }
    }
  }, []);

  const currentPaper = papers.find((p) => p.id === currentPaperId);

  const handleSelectPaper = (id: string) => {
    setCurrentPaperId(id);
    saveCurrentPaperId(id);
    setSidebarOpen(false);
  };

  const handleNewPaper = () => {
    setShowCreateTypeModal(true);
    setSidebarOpen(false);
  };

  const handleCreateTypeSelect = (mode: 'manual' | 'ai') => {
    setNewPaperMode(mode);
    setShowNewPaperModal(true);
  };

  const handlePaperCreated = (updatedPapers: QuestionSet[], newPaperId: string) => {
    setPapers(updatedPapers);
    setCurrentPaperId(newPaperId);
    saveCurrentPaperId(newPaperId);
    setShowNewPaperModal(false);
  };

  const handleDeletePaper = (id: string) => {
    if (confirm("确定要删除这个试卷吗？")) {
      deletePaper(id);
      const updatedPapers = getAllPapers();
      setPapers(updatedPapers);

      if (currentPaperId === id) {
        const newPaperId = updatedPapers.length > 0 ? updatedPapers[0].id : null;
        setCurrentPaperId(newPaperId);
        if (newPaperId) {
          saveCurrentPaperId(newPaperId);
        }
      }
    }
  };

  // 批量删除试卷（确认已在调用方处理）
  const handleDeletePapers = (ids: string[]) => {
    ids.forEach(id => deletePaper(id));
    const updatedPapers = getAllPapers();
    setPapers(updatedPapers);

    // 如果当前试卷被删除，切换到第一个
    if (currentPaperId && ids.includes(currentPaperId)) {
      const newPaperId = updatedPapers.length > 0 ? updatedPapers[0].id : null;
      setCurrentPaperId(newPaperId);
      if (newPaperId) {
        saveCurrentPaperId(newPaperId);
      }
    }
  };

  const handleEditPaper = (paperId: string) => {
    const paper = papers.find((p) => p.id === paperId);
    if (paper) {
      setEditingPaper(paper);
    }
  };

  const handleSaveEditedPaper = (updatedPaper: QuestionSet) => {
    savePaper(updatedPaper);
    const updatedPapers = getAllPapers();
    setPapers(updatedPapers);
    setEditingPaper(null);
  };

  const handleRefreshPapers = () => {
    const updatedPapers = getAllPapers();
    setPapers(updatedPapers);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        papers={papers}
        currentPaperId={currentPaperId || ""}
        onSelectPaper={handleSelectPaper}
        onNewPaper={handleNewPaper}
        onEditPaper={handleEditPaper}
        onDeletePaper={handleDeletePaper}
        onDeletePapers={handleDeletePapers}
        onRefreshPapers={handleRefreshPapers}
      />

      {/* Main Content */}
      <div className="min-h-screen">
        {/* Quiz or Empty State */}
        {currentPaper ? (
          <div className="relative">
            {/* Floating Controls */}
            <div className="fixed top-4 md:top-8 left-0 right-0 z-10 px-4 md:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <motion.button
                    whileHover={{ opacity: 0.6 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </motion.button>
                  <h1 className="text-base md:text-lg font-medium text-foreground truncate max-w-[60vw] md:max-w-none">
                    {currentPaper.title}
                  </h1>
                </div>
                <motion.button
                  whileHover={{ opacity: 0.6 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettingsModal(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <QuizContainer
              questions={currentPaper.questions}
              title={currentPaper.title}
              description={currentPaper.description}
              paperId={currentPaper.id}
            />
          </div>
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            {/* Empty State Controls */}
            <div className="fixed top-4 md:top-8 left-0 right-0 px-4 md:px-8">
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ opacity: 0.6 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <PanelLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ opacity: 0.6 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettingsModal(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md px-4"
            >
              <div className="text-5xl md:text-6xl mb-4 md:mb-6">📚</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-foreground">No Papers Yet</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
                Start by importing words to generate your first practice paper.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateTypeModal(true)}
                className="px-6 py-3 md:py-2.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-all text-sm font-medium touch-manipulation"
              >
                Create New Paper
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Create Type Selection Modal */}
      <AnimatePresence mode="wait">
        {showCreateTypeModal && (
          <CreatePaperTypeModal
            onClose={() => setShowCreateTypeModal(false)}
            onSelectManual={() => handleCreateTypeSelect('manual')}
            onSelectAI={() => handleCreateTypeSelect('ai')}
            hasAIConfig={!!getAIConfig()}
          />
        )}
      </AnimatePresence>

      {/* New Paper Modal */}
      <AnimatePresence mode="wait">
        {showNewPaperModal && (
          <NewPaperModal
            mode={newPaperMode}
            onClose={() => setShowNewPaperModal(false)}
            onPaperCreated={handlePaperCreated}
          />
        )}
      </AnimatePresence>

      {/* Edit Paper Modal */}
      <AnimatePresence mode="wait">
        {editingPaper && (
          <EditPaperModal
            paper={editingPaper}
            onSave={handleSaveEditedPaper}
            onClose={() => setEditingPaper(null)}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence mode="wait">
        {showSettingsModal && (
          <SettingsModal onClose={() => setShowSettingsModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
