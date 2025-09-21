/**
 * API服务模块
 */
import { API_BASE, API_ENDPOINTS, HTTP_STATUS, REQUEST_TIMEOUT } from '../constants/index.js';

// 全局请求缓存，用于避免重复请求
const requestCache = new Map();

/**
 * 清理所有请求缓存
 */
export function clearRequestCache() {
  console.log('清理请求缓存');
  requestCache.clear();
}

/**
 * 获取当前缓存状态
 */
export function getCacheStatus() {
  return {
    size: requestCache.size,
    keys: Array.from(requestCache.keys())
  };
}

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
  
  // 创建请求缓存键
  const cacheKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;
  
  // 检查是否有相同的请求正在进行
  if (requestCache.has(cacheKey)) {
    console.log('检测到重复请求，返回缓存结果');
    return await requestCache.get(cacheKey);
  }
  
  const config = { ...defaultOptions, ...options };
  
  // 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  config.signal = controller.signal;
  
  // 创建请求Promise并缓存
  const requestPromise = performRequest(url, config, timeoutId);
  requestCache.set(cacheKey, requestPromise);
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    // 请求完成后清理缓存
    requestCache.delete(cacheKey);
  }
}

/**
 * 执行实际的HTTP请求
 */
async function performRequest(url, config, timeoutId) {
  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.error || errorData.detail || `HTTP ${response.status}`;
      
      // 处理嵌套的错误信息
      if (errorData.detail && typeof errorData.detail === 'object') {
        errorMessage = errorData.detail.message || errorMessage;
      }
      
      // 确保errorMessage是字符串类型
      const errorStr = String(errorMessage);
      
      // 特殊处理AI配置相关的错误
      if (errorStr.includes('请先配置AI API') || errorStr.includes('未配置 AI API')) {
        throw new Error('请先配置AI API：在页面顶部填写API地址和密钥，然后点击登录');
      }
      
      // 特殊处理AI连接错误
      if (errorStr.includes('AI服务连接失败') || errorStr.includes('API地址和模型名称')) {
        throw new Error('AI服务连接失败，请检查API地址和模型名称是否正确');
      }
      
      if (errorStr.includes('API密钥无效')) {
        throw new Error('AI API密钥无效，请检查API密钥是否正确');
      }
      
      throw new Error(errorStr);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
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
    return apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  /**
   * 退出登录
   * @returns {Promise} 退出结果
   */
  async logout() {
    return apiRequest(API_ENDPOINTS.LOGOUT, {
      method: 'POST'
    });
  },

  /**
   * 获取配置
   * @returns {Promise} 配置信息
   */
  async getConfig() {
    return apiRequest(API_ENDPOINTS.CONFIG);
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
    return apiRequest(API_ENDPOINTS.NOTES);
  },

  /**
   * 获取单个笔记
   * @param {string|number} id - 笔记ID
   * @returns {Promise} 笔记详情
   */
  async getById(id) {
    return apiRequest(`${API_ENDPOINTS.NOTE}?id=${encodeURIComponent(id)}`);
  },

  /**
   * 创建笔记
   * @param {Object} noteData - 笔记数据
   * @returns {Promise} 创建结果
   */
  async create(noteData) {
    return apiRequest(API_ENDPOINTS.NOTE, {
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
    return apiRequest(API_ENDPOINTS.NOTE, {
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
    return apiRequest(`${API_ENDPOINTS.NOTE}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  /**
   * 搜索笔记
   * @param {string} query - 搜索关键词
   * @returns {Promise} 搜索结果
   */
  async search(query) {
    return apiRequest(`${API_ENDPOINTS.SEARCH}?query=${encodeURIComponent(query)}`);
  },

  /**
   * 按分类获取笔记
   * @param {string} category - 分类名称
   * @returns {Promise} 笔记列表
   */
  async getByCategory(category) {
    return apiRequest(`${API_ENDPOINTS.NOTES_BY_CATEGORY}?category=${encodeURIComponent(category)}`);
  },

  /**
   * 按标签获取笔记
   * @param {string} tag - 标签名称
   * @returns {Promise} 笔记列表
   */
  async getByTag(tag) {
    return apiRequest(`${API_ENDPOINTS.NOTES_BY_TAG}?tag=${encodeURIComponent(tag)}`);
  }
};

/**
 * AI优化重写相关API
 */
export const aiAPI = {
  /**
   * 优化笔记内容
   * @param {Object} data - 优化数据
   * @returns {Promise} 优化结果
   */
  async optimize(data) {
    return apiRequest(API_ENDPOINTS.OPTIMIZE, {
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
    return apiRequest(API_ENDPOINTS.STATS);
  },

  /**
   * 获取分类列表
   * @returns {Promise} 分类列表
   */
  async getCategories() {
    return apiRequest(API_ENDPOINTS.CATEGORIES);
  },

  /**
   * 获取标签列表
   * @returns {Promise} 标签列表
   */
  async getTags() {
    return apiRequest(API_ENDPOINTS.TAGS);
  }
};
