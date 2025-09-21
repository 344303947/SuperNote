/**
 * UI相关常量
 */
export const UI_CONSTANTS = {
  // 分页
  DEFAULT_PAGE_SIZE: 5,
  MAX_PAGES: 100,
  
  // 防重复点击延迟
  CLICK_DELAYS: {
    FAST: 300,      // 快速操作（切换、关闭）
    NORMAL: 2000,   // 一般操作（保存、删除）
    AI: 3000        // AI操作（优化）
  },
  
  // 消息显示时间
  MESSAGE_DURATION: 3000,
  
  // 搜索防抖延迟
  SEARCH_DEBOUNCE: 300,
  
  // 模态框配置
  MODAL_CONFIG: {
    DRAGGABLE: false,
    CLOSABLE: true
  },
  
  // 词云配置
  WORD_CLOUD: {
    MAX_CATEGORIES: 100,
    MAX_TAGS: 200,
    MIN_FONT_SIZE: 12,
    MAX_FONT_SIZE: 26
  }
};

export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const LOADING_TEXTS = {
  SAVING: '保存中...',
  DELETING: '删除中...',
  ANALYZING: '分析标题分类中...',
  OPTIMIZING: 'AI优化重写中...',
  LOADING: '加载中...',
  SWITCHING: '切换中...',
  CLOSING: '关闭中...',
  OPENING: '打开中...',
  FILTERING: '过滤中...',
  CLEARING: '清除中...',
  EXITING: '退出中...',
  FULLSCREEN: '全屏中...'
};
