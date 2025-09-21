/**
 * DOM操作工具函数
 */

/**
 * 安全获取元素
 * @param {string} id - 元素ID
 * @returns {HTMLElement|null} 元素或null
 */
export function getElementById(id) {
  return document.getElementById(id);
}

/**
 * 安全获取多个元素
 * @param {string} selector - CSS选择器
 * @returns {NodeList} 元素列表
 */
export function querySelectorAll(selector) {
  return document.querySelectorAll(selector);
}

/**
 * 创建元素
 * @param {string} tagName - 标签名
 * @param {Object} options - 选项
 * @returns {HTMLElement} 创建的元素
 */
export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  
  if (options.className) {
    element.className = options.className;
  }
  
  if (options.textContent) {
    element.textContent = options.textContent;
  }
  
  if (options.innerHTML) {
    element.innerHTML = options.innerHTML;
  }
  
  if (options.style) {
    // 处理style属性，支持对象和字符串两种格式
    if (typeof options.style === 'string') {
      // 如果是字符串，直接设置style属性
      element.setAttribute('style', options.style);
    } else if (typeof options.style === 'object') {
      // 如果是对象，使用Object.assign设置样式
      Object.assign(element.style, options.style);
    }
  }
  
  // 设置其他属性
  Object.keys(options).forEach(key => {
    if (key !== 'className' && key !== 'textContent' && key !== 'innerHTML' && key !== 'style') {
      element.setAttribute(key, options[key]);
    }
  });
  
  return element;
}

/**
 * 添加CSS类
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 */
export function addClass(element, className) {
  if (element) {
    element.classList.add(className);
  }
}

/**
 * 移除CSS类
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 */
export function removeClass(element, className) {
  if (element) {
    element.classList.remove(className);
  }
}

/**
 * 切换CSS类
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 */
export function toggleClass(element, className) {
  if (element) {
    element.classList.toggle(className);
  }
}

/**
 * 检查是否有CSS类
 * @param {HTMLElement} element - 元素
 * @param {string} className - 类名
 * @returns {boolean} 是否有该类
 */
export function hasClass(element, className) {
  return element ? element.classList.contains(className) : false;
}

/**
 * 设置元素属性
 * @param {HTMLElement} element - 元素
 * @param {string} name - 属性名
 * @param {string} value - 属性值
 */
export function setAttribute(element, name, value) {
  if (element) {
    element.setAttribute(name, value);
  }
}

/**
 * 获取元素属性
 * @param {HTMLElement} element - 元素
 * @param {string} name - 属性名
 * @returns {string|null} 属性值
 */
export function getAttribute(element, name) {
  return element ? element.getAttribute(name) : null;
}

/**
 * 设置元素文本内容
 * @param {HTMLElement} element - 元素
 * @param {string} text - 文本内容
 */
export function setTextContent(element, text) {
  if (element) {
    element.textContent = text;
  }
}

/**
 * 设置元素HTML内容
 * @param {HTMLElement} element - 元素
 * @param {string} html - HTML内容
 */
export function setInnerHTML(element, html) {
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * 显示元素
 * @param {HTMLElement} element - 元素
 */
export function showElement(element) {
  if (element) {
    removeClass(element, 'hidden');
    // 同时移除内联的display样式，确保元素能显示
    element.style.display = '';
  }
}

/**
 * 隐藏元素
 * @param {HTMLElement} element - 元素
 */
export function hideElement(element) {
  if (element) {
    addClass(element, 'hidden');
    // 同时设置内联的display样式，确保元素被隐藏
    element.style.display = 'none';
  }
}

/**
 * 切换元素显示状态
 * @param {HTMLElement} element - 元素
 */
export function toggleElement(element) {
  if (element) {
    toggleClass(element, 'hidden');
  }
}
