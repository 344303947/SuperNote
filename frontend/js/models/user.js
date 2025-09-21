/**
 * 用户数据模型
 */
import { isValidUrl } from '../utils/index.js';

/**
 * 用户配置模型
 */
export class UserConfig {
  constructor(data = {}) {
    this.apiUrl = data.api_url || '';
    this.apiKey = data.api_key || '';
    this.loggedIn = data.logged_in || false;
    this.defaultModel = data.default_model || 'Qwen3-Next-80B-A3B-Instruct';
  }

  /**
   * 验证配置数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];

    if (!this.apiUrl.trim()) {
      errors.push('API地址不能为空');
    } else if (!isValidUrl(this.apiUrl)) {
      errors.push('API地址格式不正确');
    }

    if (!this.apiKey.trim()) {
      errors.push('API密钥不能为空');
    }

    if (!this.defaultModel.trim()) {
      errors.push('默认模型不能为空');
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
      api_url: this.apiUrl,
      api_key: this.apiKey,
      model: this.defaultModel
    };
  }

  /**
   * 从API响应创建配置实例
   * @param {Object} data - API响应数据
   * @returns {UserConfig} 配置实例
   */
  static fromApiResponse(data) {
    return new UserConfig(data);
  }
}

/**
 * 登录请求模型
 */
export class LoginRequest {
  constructor(data = {}) {
    this.apiUrl = data.apiUrl || data.api_url || '';
    this.apiKey = data.apiKey || data.api_key || '';
    this.model = data.model || 'Qwen3-Next-80B-A3B-Instruct';
  }

  /**
   * 验证登录数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];

    if (!this.apiUrl.trim()) {
      errors.push('API地址不能为空');
    } else if (!isValidUrl(this.apiUrl)) {
      errors.push('API地址格式不正确');
    }

    if (!this.apiKey.trim()) {
      errors.push('API密钥不能为空');
    }

    if (!this.model.trim()) {
      errors.push('模型名称不能为空');
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
      api_url: this.apiUrl,
      api_key: this.apiKey,
      model: this.model
    };
  }
}
