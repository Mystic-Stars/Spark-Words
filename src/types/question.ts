// 题目接口定义
export interface Question {
  id: string;
  sentence: string; // 完整句子，用 首字母+下划线 表示待填单词，如 d_____
  answer: string; // 正确答案（完整单词）
  hint: string; // 提示（首字母）
  translation?: string; // 可选的中文翻译
}

export interface QuestionSet {
  id: string; // 试卷唯一ID
  title: string;
  description?: string;
  tags?: string[]; // 标签/分类
  questions: Question[];
  createdAt?: string; // 创建时间
  source?: 'local' | 'community'; // 试卷来源
  communityId?: string; // 社区试卷的原始ID
}

// 社区试卷扩展字段
export interface CommunityPaper extends QuestionSet {
  author: string; // 贡献者名称
  version: string; // 版本号
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // 难度等级
  downloads?: number; // 下载次数
  stars?: number; // GitHub stars
  updatedAt?: string; // 最后更新时间
  filepath?: string; // GitHub 仓库中的文件路径
}

// 社区库元数据
export interface CommunityMetadata {
  papers: CommunityPaperMeta[];
  lastUpdated: string;
}

// 社区试卷元信息（用于列表展示）
export interface CommunityPaperMeta {
  id: string;
  title: string;
  description?: string;
  author: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  filepath: string; // 相对路径
  createdAt: string;
  updatedAt?: string;
  version: string;
}

// 用户答题状态
export interface AnswerState {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean | null; // null 表示未答题
}

// 试卷做题进度
export interface PaperProgress {
  paperId: string;
  currentIndex: number; // 当前题目索引
  answers: AnswerState[]; // 所有题目的答题状态
  lastUpdated: string; // 最后更新时间
}
