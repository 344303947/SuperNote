/**
 * API接口模块
 * 处理所有与后端的通信
 */

import { API_BASE, showMessage } from './utils.js';

/**
 * API请求封装
 * @param {string} endpoint - 接口路径
 * @param {Object} options - 请求选项
 * @returns {Promise} 请求结果
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.detail || `HTTP ${response.status}`;
      
      // 特殊处理AI配置相关的错误
      if (errorMessage.includes('请先配置AI API') || errorMessage.includes('未配置 AI API')) {
        throw new Error('请先配置AI API：在页面顶部填写API地址和密钥，然后点击登录');
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

/**
 * 用户认证相关API
 */
export const authAPI = {
  /**
   * 登录
   * @param {Object} credentials - 登录凭据
   * @returns {Promise} 登录结果
   */
  async login(credentials) {
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  /**
   * 退出登录
   * @returns {Promise} 退出结果
   */
  async logout() {
    return apiRequest('/logout', {
      method: 'POST'
    });
  },

  /**
   * 获取配置
   * @returns {Promise} 配置信息
   */
  async getConfig() {
    return apiRequest('/config');
  }
};

/**
 * 笔记相关API
 */
export const notesAPI = {
  /**
   * 获取所有笔记
   * @returns {Promise} 笔记列表
   */
  async getAll() {
    return apiRequest('/notes');
  },

  /**
   * 获取单个笔记
   * @param {string|number} id - 笔记ID
   * @returns {Promise} 笔记详情
   */
  async getById(id) {
    return apiRequest(`/note?id=${encodeURIComponent(id)}`);
  },

  /**
   * 创建笔记
   * @param {Object} noteData - 笔记数据
   * @returns {Promise} 创建结果
   */
  async create(noteData) {
    return apiRequest('/note', {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  },

  /**
   * 更新笔记
   * @param {Object} noteData - 笔记数据
   * @returns {Promise} 更新结果
   */
  async update(noteData) {
    return apiRequest('/note', {
      method: 'PUT',
      body: JSON.stringify(noteData)
    });
  },

  /**
   * 删除笔记
   * @param {string|number} id - 笔记ID
   * @returns {Promise} 删除结果
   */
  async delete(id) {
    return apiRequest(`/note?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  /**
   * 搜索笔记
   * @param {string} query - 搜索关键词
   * @returns {Promise} 搜索结果
   */
  async search(query) {
    return apiRequest(`/search?query=${encodeURIComponent(query)}`);
  },

  /**
   * 按分类获取笔记
   * @param {string} category - 分类名称
   * @returns {Promise} 笔记列表
   */
  async getByCategory(category) {
    return apiRequest(`/notes/by_category?category=${encodeURIComponent(category)}`);
  },

  /**
   * 按标签获取笔记
   * @param {string} tag - 标签名称
   * @returns {Promise} 笔记列表
   */
  async getByTag(tag) {
    return apiRequest(`/notes/by_tag?tag=${encodeURIComponent(tag)}`);
  }
};

/**
 * AI优化相关API
 */
export const aiAPI = {
  /**
   * 优化笔记内容
   * @param {Object} data - 优化数据
   * @returns {Promise} 优化结果
   */
  async optimize(data) {
    return apiRequest('/optimize', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

/**
 * 统计数据相关API
 */
export const statsAPI = {
  /**
   * 获取统计数据
   * @returns {Promise} 统计数据
   */
  async getStats() {
    return apiRequest('/stats');
  },

  /**
   * 获取分类列表
   * @returns {Promise} 分类列表
   */
  async getCategories() {
    return apiRequest('/categories');
  },

  /**
   * 获取标签列表
   * @returns {Promise} 标签列表
   */
  async getTags() {
    return apiRequest('/tags');
  }
};

/**
 * 错误处理装饰器
 * @param {Function} apiFunction - API函数
 * @param {string} errorMessage - 错误消息
 * @returns {Function} 包装后的函数
 */
export function withErrorHandling(apiFunction, errorMessage = '操作失败') {
  return async (...args) => {
    try {
      return await apiFunction(...args);
    } catch (error) {
      showMessage(`${errorMessage}: ${error.message}`, 'error');
      throw error;
    }
  };
}

// 导出带错误处理的API
export const safeAPI = {
  auth: {
    login: withErrorHandling(authAPI.login, '登录失败'),
    logout: withErrorHandling(authAPI.logout, '退出失败'),
    getConfig: withErrorHandling(authAPI.getConfig, '获取配置失败')
  },
  notes: {
    getAll: withErrorHandling(notesAPI.getAll, '获取笔记列表失败'),
    getById: withErrorHandling(notesAPI.getById, '获取笔记详情失败'),
    create: withErrorHandling(notesAPI.create, '创建笔记失败'),
    update: withErrorHandling(notesAPI.update, '更新笔记失败'),
    delete: withErrorHandling(notesAPI.delete, '删除笔记失败'),
    search: withErrorHandling(notesAPI.search, '搜索失败'),
    getByCategory: withErrorHandling(notesAPI.getByCategory, '按分类获取笔记失败'),
    getByTag: withErrorHandling(notesAPI.getByTag, '按标签获取笔记失败')
  },
  ai: {
    optimize: withErrorHandling(aiAPI.optimize, 'AI优化失败，请检查是否已登录')
  },
  stats: {
    getStats: withErrorHandling(statsAPI.getStats, '获取统计数据失败'),
    getCategories: withErrorHandling(statsAPI.getCategories, '获取分类列表失败'),
    getTags: withErrorHandling(statsAPI.getTags, '获取标签列表失败')
  }
};
