/**
 * 格式化工具函数
 */

/**
 * 格式化日期
 * @param {Date|string} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN');
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + suffix;
}

/**
 * 首字母大写
 * @param {string} str - 字符串
 * @returns {string} 首字母大写的字符串
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * 转换为标题格式
 * @param {string} str - 字符串
 * @returns {string} 标题格式的字符串
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * 清理HTML标签
 * @param {string} html - HTML字符串
 * @returns {string} 清理后的文本
 */
export function stripHtml(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * 高亮搜索关键词
 * @param {string} text - 文本
 * @param {string} keyword - 关键词
 * @param {string} className - 高亮样式类
 * @returns {string} 高亮后的HTML
 */
export function highlightKeyword(text, keyword, className = 'highlight') {
  if (!text || !keyword) return text;
  
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, `<span class="${className}">$1</span>`);
}

/**
 * 格式化标签列表
 * @param {string|Array} tags - 标签
 * @returns {Array} 格式化后的标签数组
 */
export function formatTags(tags) {
  if (!tags) return [];
  
  if (Array.isArray(tags)) {
    return tags.map(tag => String(tag).trim()).filter(tag => tag);
  }
  
  if (typeof tags === 'string') {
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  }
  
  return [];
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
