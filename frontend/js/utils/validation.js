/**
 * 验证工具函数
 */

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {boolean} 是否有效
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
export function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {Object} 验证结果
 */
export function validatePassword(password) {
  const result = {
    isValid: false,
    score: 0,
    suggestions: []
  };
  
  if (!password) {
    result.suggestions.push('密码不能为空');
    return result;
  }
  
  if (password.length < 8) {
    result.suggestions.push('密码长度至少8位');
  } else {
    result.score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    result.suggestions.push('密码应包含小写字母');
  } else {
    result.score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    result.suggestions.push('密码应包含大写字母');
  } else {
    result.score += 1;
  }
  
  if (!/\d/.test(password)) {
    result.suggestions.push('密码应包含数字');
  } else {
    result.score += 1;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.suggestions.push('密码应包含特殊字符');
  } else {
    result.score += 1;
  }
  
  result.isValid = result.score >= 3;
  
  return result;
}

/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {Object} 验证结果
 */
export function validateUsername(username) {
  const result = {
    isValid: false,
    errors: []
  };
  
  if (!username) {
    result.errors.push('用户名不能为空');
    return result;
  }
  
  if (username.length < 3) {
    result.errors.push('用户名长度至少3位');
  }
  
  if (username.length > 20) {
    result.errors.push('用户名长度不能超过20位');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    result.errors.push('用户名只能包含字母、数字和下划线');
  }
  
  result.isValid = result.errors.length === 0;
  
  return result;
}

/**
 * 验证笔记标题
 * @param {string} title - 标题
 * @returns {Object} 验证结果
 */
export function validateNoteTitle(title) {
  const result = {
    isValid: false,
    errors: []
  };
  
  if (!title || !title.trim()) {
    result.errors.push('标题不能为空');
    return result;
  }
  
  if (title.length > 200) {
    result.errors.push('标题长度不能超过200字符');
  }
  
  result.isValid = result.errors.length === 0;
  
  return result;
}

/**
 * 验证笔记内容
 * @param {string} content - 内容
 * @returns {Object} 验证结果
 */
export function validateNoteContent(content) {
  const result = {
    isValid: false,
    errors: []
  };
  
  if (!content || !content.trim()) {
    result.errors.push('内容不能为空');
    return result;
  }
  
  if (content.length > 100000) {
    result.errors.push('内容长度不能超过100000字符');
  }
  
  result.isValid = result.errors.length === 0;
  
  return result;
}

/**
 * 验证搜索关键词
 * @param {string} query - 搜索关键词
 * @returns {Object} 验证结果
 */
export function validateSearchQuery(query) {
  const result = {
    isValid: false,
    errors: []
  };
  
  if (!query || !query.trim()) {
    result.errors.push('搜索关键词不能为空');
    return result;
  }
  
  if (query.length > 100) {
    result.errors.push('搜索关键词长度不能超过100字符');
  }
  
  result.isValid = result.errors.length === 0;
  
  return result;
}

/**
 * 验证标签格式
 * @param {string|Array} tags - 标签
 * @returns {Object} 验证结果
 */
export function validateTags(tags) {
  const result = {
    isValid: false,
    errors: []
  };
  
  if (!tags) {
    return result;
  }
  
  let tagArray = [];
  if (typeof tags === 'string') {
    tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  } else if (Array.isArray(tags)) {
    tagArray = tags.filter(tag => tag && tag.trim());
  }
  
  if (tagArray.length === 0) {
    return result;
  }
  
  if (tagArray.length > 10) {
    result.errors.push('标签数量不能超过10个');
  }
  
  for (const tag of tagArray) {
    if (tag.length > 20) {
      result.errors.push(`标签"${tag}"长度不能超过20字符`);
    }
    
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(tag)) {
      result.errors.push(`标签"${tag}"包含非法字符`);
    }
  }
  
  result.isValid = result.errors.length === 0;
  
  return result;
}

/**
 * 验证分类格式
 * @param {string} category - 分类
 * @returns {Object} 验证结果
 */
export function validateCategory(category) {
  const result = {
    isValid: false,
    errors: []
  };
  
  if (!category || !category.trim()) {
    return result;
  }
  
  if (category.length > 100) {
    result.errors.push('分类长度不能超过100字符');
  }
  
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(category)) {
    result.errors.push('分类包含非法字符');
  }
  
  result.isValid = result.errors.length === 0;
  
  return result;
}

/**
 * 验证API配置
 * @param {Object} config - API配置
 * @returns {Object} 验证结果
 */
export function validateApiConfig(config) {
  const result = {
    isValid: false,
    errors: []
  };
  
  if (!config) {
    result.errors.push('配置不能为空');
    return result;
  }
  
  if (!config.api_url || !config.api_url.trim()) {
    result.errors.push('API地址不能为空');
  } else if (!validateUrl(config.api_url)) {
    result.errors.push('API地址格式不正确');
  }
  
  if (!config.api_key || !config.api_key.trim()) {
    result.errors.push('API密钥不能为空');
  }
  
  if (!config.model || !config.model.trim()) {
    result.errors.push('模型名称不能为空');
  }
  
  result.isValid = result.errors.length === 0;
  
  return result;
}

/**
 * 通用验证器
 * @param {Object} rules - 验证规则
 * @param {Object} data - 要验证的数据
 * @returns {Object} 验证结果
 */
export function validate(rules, data) {
  const result = {
    isValid: true,
    errors: {}
  };
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const fieldResult = rule(value);
    
    if (!fieldResult.isValid) {
      result.isValid = false;
      result.errors[field] = fieldResult.errors || fieldResult.suggestions || [];
    }
  }
  
  return result;
}

/**
 * 清理和标准化输入
 * @param {string} input - 输入字符串
 * @returns {string} 清理后的字符串
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {Array} allowedTypes - 允许的文件类型
 * @returns {boolean} 是否允许
 */
export function validateFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) {
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSize - 最大文件大小（字节）
 * @returns {boolean} 是否符合大小限制
 */
export function validateFileSize(file, maxSize = 5 * 1024 * 1024) { // 默认5MB
  return file.size <= maxSize;
}