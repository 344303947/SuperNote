/**
 * 工具函数模块
 * 提供通用的工具函数和常量
 */

// 常量定义
export const API_BASE = "/api";
export const PAGE_SIZE = 5;

// 全局状态
export let ALL_NOTES = [];
export let CURRENT_PAGE = 1;

/**
 * 渲染Markdown内容
 * @param {string} md - Markdown文本
 * @returns {string} 渲染后的HTML
 */
export function renderMarkdown(md) {
  try {
    return DOMPurify.sanitize(marked.parse(md || ''));
  } catch (_) {
    return DOMPurify.sanitize((md || '').replace(/[&<>]/g, s => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    }[s])));
  }
}

/**
 * 读取Cookie值
 * @param {string} name - Cookie名称
 * @returns {string} Cookie值
 */
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return "";
}

/**
 * 设置Cookie值
 * @param {string} name - Cookie名称
 * @param {string} value - Cookie值
 * @param {number} days - 过期天数
 */
export function setCookie(name, value, days = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * 显示加载状态
 * @param {HTMLElement} element - 目标元素
 * @param {boolean} loading - 是否显示加载状态
 */
export function setLoadingState(element, loading = true) {
  if (!element) return;
  
  if (loading) {
    element.disabled = true;
    element.classList.add('loading', 'opacity-60', 'cursor-not-allowed');
  } else {
    element.disabled = false;
    element.classList.remove('loading', 'opacity-60', 'cursor-not-allowed');
  }
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, info)
 */
export function showMessage(message, type = 'info') {
  // 创建消息元素
  const messageEl = document.createElement('div');
  messageEl.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  messageEl.textContent = message;
  
  document.body.appendChild(messageEl);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, 3000);
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN');
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 安全的JSON解析
 * @param {string} json - JSON字符串
 * @param {*} defaultValue - 默认值
 * @returns {*} 解析结果或默认值
 */
export function safeJsonParse(json, defaultValue = null) {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * 深度克隆对象
 * @param {*} obj - 要克隆的对象
 * @returns {*} 克隆后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {boolean} 是否有效
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 防重复点击装饰器
 * @param {Function} func - 要装饰的函数
 * @param {number} delay - 防重复点击的延迟时间（毫秒）
 * @returns {Function} 装饰后的函数
 */
export function preventDoubleClick(func, delay = 1000) {
  let isExecuting = false;
  
  return function(...args) {
    if (isExecuting) {
      console.log('防重复点击：操作正在进行中，请稍候...');
      return;
    }
    
    isExecuting = true;
    
    try {
      const result = func.apply(this, args);
      
      // 如果返回的是Promise，等待其完成
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          setTimeout(() => {
            isExecuting = false;
          }, delay);
        });
      } else {
        // 非Promise函数，直接延迟后解除锁定
        setTimeout(() => {
          isExecuting = false;
        }, delay);
        return result;
      }
    } catch (error) {
      // 发生错误时也要解除锁定
      setTimeout(() => {
        isExecuting = false;
      }, delay);
      throw error;
    }
  };
}

/**
 * 为按钮元素添加防重复点击功能
 * @param {HTMLElement} button - 按钮元素
 * @param {Function} clickHandler - 点击处理函数
 * @param {number} delay - 防重复点击的延迟时间（毫秒）
 * @param {string} loadingText - 加载时显示的文本
 */
export function addPreventDoubleClick(button, clickHandler, delay = 1000, loadingText = '处理中...') {
  if (!button || !clickHandler) return;
  
  // 如果按钮已经有防重复点击功能，先移除旧的监听器
  if (button._preventDoubleClickHandler) {
    button.removeEventListener('click', button._preventDoubleClickHandler);
  }
  
  let isExecuting = false;
  const originalDisabled = button.disabled;
  
  // 检查按钮是否包含SVG图标
  const hasSvgIcon = button.querySelector('svg') !== null;
  const originalContent = hasSvgIcon ? button.innerHTML : button.textContent;
  
  // 创建防重复点击的处理函数
  const preventDoubleClickHandler = async (e) => {
    if (isExecuting) {
      e.preventDefault();
      e.stopPropagation();
      console.log('防重复点击：操作正在进行中，请稍候...');
      return;
    }
    
    isExecuting = true;
    
    // 设置加载状态
    button.disabled = true;
    button.classList.add('opacity-60', 'cursor-not-allowed');
    
    // 根据按钮类型设置加载状态
    if (hasSvgIcon) {
      // 对于包含SVG的按钮，在图标旁边添加加载文本
      const svgElement = button.querySelector('svg');
      if (svgElement) {
        // 保存原始SVG
        const originalSvg = svgElement.outerHTML;
        // 创建加载状态：SVG + 文本
        button.innerHTML = `${originalSvg} <span class="ml-1">${loadingText}</span>`;
      }
    } else {
      // 对于纯文本按钮，直接替换文本
      button.textContent = loadingText;
    }
    
    try {
      // 直接调用处理函数，不使用 preventDoubleClick 装饰器避免双重锁定
      const result = clickHandler(e);
      
      // 如果返回的是Promise，等待其完成
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (error) {
      console.error('按钮点击处理出错:', error);
      showMessage('操作失败，请重试', 'error');
    } finally {
      // 恢复按钮状态
      setTimeout(() => {
        button.disabled = originalDisabled;
        button.classList.remove('opacity-60', 'cursor-not-allowed');
        button.innerHTML = originalContent;
        isExecuting = false;
      }, delay);
    }
  };
  
  // 保存处理函数引用，以便后续移除
  button._preventDoubleClickHandler = preventDoubleClickHandler;
  
  // 添加事件监听器
  button.addEventListener('click', preventDoubleClickHandler);
}