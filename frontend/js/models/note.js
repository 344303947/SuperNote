/**
 * 笔记数据模型
 */
import { formatDate, formatTags } from '../utils/index.js';

/**
 * 笔记模型类
 */
export class Note {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.content = data.content || '';
    this.category = data.category || '';
    this.tags = formatTags(data.tags);
    this.filename = data.filename || '';
    this.createdAt = data.created_at || data.createdAt || null;
  }

  /**
   * 获取格式化后的创建时间
   * @returns {string} 格式化后的时间
   */
  getFormattedCreatedAt() {
    return this.createdAt ? formatDate(this.createdAt) : '';
  }

  /**
   * 获取标签字符串
   * @returns {string} 标签字符串
   */
  getTagsString() {
    return this.tags.join(', ');
  }

  /**
   * 设置标签
   * @param {string|Array} tags - 标签
   */
  setTags(tags) {
    this.tags = formatTags(tags);
  }

  /**
   * 验证笔记数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];

    if (!this.title.trim()) {
      errors.push('标题不能为空');
    } else if (this.title.length > 200) {
      errors.push('标题长度不能超过200字符');
    }

    if (!this.content.trim()) {
      errors.push('内容不能为空');
    }

    if (this.category && this.category.length > 100) {
      errors.push('分类长度不能超过100字符');
    }

    if (this.tags.length > 0) {
      const tagsString = this.getTagsString();
      if (tagsString.length > 500) {
        errors.push('标签总长度不能超过500字符');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 转换为API请求格式
   * @returns {Object} API请求数据
   */
  toApiFormat() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      category: this.category,
      tags: this.getTagsString()
    };
  }

  /**
   * 从API响应创建笔记实例
   * @param {Object} data - API响应数据
   * @returns {Note} 笔记实例
   */
  static fromApiResponse(data) {
    return new Note(data);
  }

  /**
   * 创建笔记列表项数据
   * @returns {Object} 列表项数据
   */
  toListItem() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      tags: this.getTagsString(),
      filename: this.filename,
      created_at: this.createdAt
    };
  }
}

/**
 * 笔记搜索模型
 */
export class NoteSearch {
  constructor(query = '') {
    this.query = query;
    this.results = [];
    this.total = 0;
  }

  /**
   * 验证搜索查询
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];

    if (!this.query.trim()) {
      errors.push('搜索关键词不能为空');
    } else if (this.query.length > 100) {
      errors.push('搜索关键词长度不能超过100字符');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * 笔记过滤器模型
 */
export class NoteFilter {
  constructor() {
    this.category = null;
    this.tag = null;
    this.isActive = false;
  }

  /**
   * 设置分类过滤
   * @param {string} category - 分类名称
   */
  setCategory(category) {
    this.category = category;
    this.tag = null;
    this.isActive = true;
  }

  /**
   * 设置标签过滤
   * @param {string} tag - 标签名称
   */
  setTag(tag) {
    this.tag = tag;
    this.category = null;
    this.isActive = true;
  }

  /**
   * 清除过滤
   */
  clear() {
    this.category = null;
    this.tag = null;
    this.isActive = false;
  }

  /**
   * 获取过滤类型
   * @returns {string} 过滤类型
   */
  getFilterType() {
    if (this.category) return 'category';
    if (this.tag) return 'tag';
    return null;
  }

  /**
   * 获取过滤值
   * @returns {string} 过滤值
   */
  getFilterValue() {
    return this.category || this.tag || '';
  }
}
