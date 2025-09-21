/**
 * 本地存储服务
 */

/**
 * 本地存储服务类
 */
export class StorageService {
  constructor() {
    this.storage = window.localStorage;
  }

  /**
   * 设置存储项
   * @param {string} key - 键
   * @param {*} value - 值
   */
  setItem(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(key, serializedValue);
    } catch (error) {
      console.error('存储数据失败:', error);
    }
  }

  /**
   * 获取存储项
   * @param {string} key - 键
   * @param {*} defaultValue - 默认值
   * @returns {*} 存储的值或默认值
   */
  getItem(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('读取数据失败:', error);
      return defaultValue;
    }
  }

  /**
   * 删除存储项
   * @param {string} key - 键
   */
  removeItem(key) {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error('删除数据失败:', error);
    }
  }

  /**
   * 清空存储
   */
  clear() {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('清空存储失败:', error);
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 键
   * @returns {boolean} 是否存在
   */
  hasItem(key) {
    return this.storage.getItem(key) !== null;
  }

  /**
   * 获取所有键
   * @returns {Array} 键列表
   */
  getKeys() {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      keys.push(this.storage.key(i));
    }
    return keys;
  }
}

/**
 * 用户配置存储
 */
export class UserConfigStorage {
  constructor() {
    this.storage = new StorageService();
    this.configKey = 'user_config';
  }

  /**
   * 保存用户配置
   * @param {Object} config - 配置对象
   */
  saveConfig(config) {
    this.storage.setItem(this.configKey, config);
  }

  /**
   * 获取用户配置
   * @returns {Object} 配置对象
   */
  getConfig() {
    return this.storage.getItem(this.configKey, {
      apiUrl: '',
      apiKey: '',
      loggedIn: false,
      defaultModel: 'Qwen3-Next-80B-A3B-Instruct'
    });
  }

  /**
   * 清除用户配置
   */
  clearConfig() {
    this.storage.removeItem(this.configKey);
  }

  /**
   * 更新配置项
   * @param {Object} updates - 要更新的配置项
   */
  updateConfig(updates) {
    const config = this.getConfig();
    const newConfig = { ...config, ...updates };
    this.saveConfig(newConfig);
  }
}

/**
 * 笔记缓存存储
 */
export class NoteCacheStorage {
  constructor() {
    this.storage = new StorageService();
    this.cacheKey = 'note_cache';
    this.maxCacheSize = 100; // 最大缓存数量
  }

  /**
   * 保存笔记到缓存
   * @param {Array} notes - 笔记列表
   */
  saveNotes(notes) {
    const cacheData = {
      notes: notes.slice(0, this.maxCacheSize),
      timestamp: Date.now()
    };
    this.storage.setItem(this.cacheKey, cacheData);
  }

  /**
   * 获取缓存的笔记
   * @returns {Array} 笔记列表
   */
  getNotes() {
    const cacheData = this.storage.getItem(this.cacheKey);
    if (!cacheData || !cacheData.notes) {
      return [];
    }

    // 检查缓存是否过期（1小时）
    const isExpired = Date.now() - cacheData.timestamp > 60 * 60 * 1000;
    if (isExpired) {
      this.clearCache();
      return [];
    }

    return cacheData.notes;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.storage.removeItem(this.cacheKey);
  }

  /**
   * 检查缓存是否存在
   * @returns {boolean} 是否存在
   */
  hasCache() {
    return this.storage.hasItem(this.cacheKey);
  }
}

// 全局存储服务实例
export const storageService = new StorageService();
export const userConfigStorage = new UserConfigStorage();
export const noteCacheStorage = new NoteCacheStorage();
