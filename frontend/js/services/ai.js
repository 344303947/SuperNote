/**
 * AI服务模块
 */
import { aiAPI } from './api.js';

/**
 * AI服务类
 */
export class AIService {
  constructor() {
    this.isOptimizing = false;
    this.currentRequest = null; // 保存当前请求的Promise
  }

  /**
   * 优化文本内容
   * @param {string} content - 要优化的内容
   * @param {string} prompt - 自定义提示词
   * @returns {Promise<Object>} 优化结果
   */
  async optimizeText(content, prompt = null) {
    
    // 如果已经有请求在进行中，返回当前的请求结果
    if (this.currentRequest) {
      return await this.currentRequest;
    }

    this.isOptimizing = true;

    // 创建新的请求Promise
    this.currentRequest = this._performOptimization(content, prompt);

    try {
      const result = await this.currentRequest;
      return result;
    } catch (error) {
      // 如果是请求被取消的错误，静默处理，不抛出
      if (error.message && error.message.includes('请求已取消')) {
        throw new Error('AI优化重写正在进行中，请稍候...');
      }
      throw error;
    } finally {
      this.isOptimizing = false;
      this.currentRequest = null;
    }
  }

  /**
   * 执行实际的优化操作
   */
  async _performOptimization(content, prompt) {
    try {
      const result = await aiAPI.optimize({
        content,
        prompt
      });

      return {
        title: result.title || '',
        optimized: result.optimized || content,
        category: result.category || '其他',
        tags: result.tags || '未分类',
        keyPoints: result.key_points || [],
        graph: result.graph || { nodes: [], edges: [] },
        mode: result.mode || 'analyze'
      };
    } catch (error) {
      console.error('AI优化重写过程中发生错误:', error);
      
      // 特殊处理AbortError
      if (error.name === 'AbortError') {
        throw new Error('请求已取消，请勿重复点击');
      }
      
      throw error;
    }
  }

  /**
   * 检查是否正在优化
   * @returns {boolean} 是否正在优化
   */
  isCurrentlyOptimizing() {
    return this.isOptimizing;
  }

  /**
   * 取消优化（如果支持的话）
   */
  cancelOptimization() {
    // 这里可以实现取消逻辑
    this.isOptimizing = false;
  }

  /**
   * 强制重置优化状态（用于调试和错误恢复）
   */
  resetOptimizationState() {
    this.isOptimizing = false;
    this.currentRequest = null;
  }

  /**
   * 获取优化状态（用于调试）
   */
  getOptimizationState() {
    return {
      isOptimizing: this.isOptimizing,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * AI优化重写状态管理
 */
export class AIOptimizationState {
  constructor() {
    this.states = new Map(); // 存储不同组件的优化状态
  }

  /**
   * 设置优化状态
   * @param {string} componentId - 组件ID
   * @param {boolean} isOptimizing - 是否正在优化
   */
  setOptimizing(componentId, isOptimizing) {
    this.states.set(componentId, isOptimizing);
  }

  /**
   * 获取优化状态
   * @param {string} componentId - 组件ID
   * @returns {boolean} 是否正在优化
   */
  isOptimizing(componentId) {
    return this.states.get(componentId) || false;
  }

  /**
   * 清除优化状态
   * @param {string} componentId - 组件ID
   */
  clearOptimizing(componentId) {
    this.states.delete(componentId);
  }

  /**
   * 清除所有优化状态
   */
  clearAll() {
    this.states.clear();
  }
}

// 全局AI服务实例
export const aiService = new AIService();
export const aiOptimizationState = new AIOptimizationState();
