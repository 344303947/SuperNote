/**
 * 事件处理工具函数
 */

/**
 * 防重复点击
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 防重复延迟时间（毫秒）
 * @returns {Function} 包装后的函数
 */
export function preventDoubleClick(fn, delay = 1000) {
  let isExecuting = false;
  
  return async function(...args) {
    if (isExecuting) {
      console.log('操作正在进行中，请稍候...');
      return;
    }
    
    isExecuting = true;
    
    try {
      const result = await fn.apply(this, args);
      return result;
    } finally {
      setTimeout(() => {
        isExecuting = false;
      }, delay);
    }
  };
}

/**
 * AI功能按钮专用防重复点击（支持分析标题分类和AI优化重写）
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 防重复延迟时间（毫秒）
 * @returns {Function} 包装后的函数
 */
export function preventDoubleClickAI(fn, delay = 3000) {
  let isExecuting = false;
  
  return async function(...args) {
    if (isExecuting) {
      console.log('AI功能正在进行中，请稍候...');
      // 显示友好的提示信息
      const button = args[0]?.target || document.activeElement;
      if (button && button.tagName === 'BUTTON') {
        const originalText = button.textContent;
        // 根据按钮原始文本确定禁用时的文本
        const loadingText = originalText.includes('分析标题分类') ? '分析标题分类中，请稍候...' : 'AI优化重写中，请稍候...';
        button.textContent = loadingText;
        button.disabled = true;
        
        // 2秒后恢复按钮文本
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 2000);
      }
      return;
    }
    
    isExecuting = true;
    
    // 获取按钮元素并设置加载状态
    const button = args[0]?.target || document.activeElement;
    if (button && button.tagName === 'BUTTON') {
      const originalText = button.textContent;
      const originalDisabled = button.disabled;
      const originalBackground = button.style.background || '#7c3aed';
      const originalColor = button.style.color || 'white';
      
      // 根据按钮原始文本确定禁用时的文本
      const loadingText = originalText.includes('分析标题分类') ? '分析标题分类中...' : 'AI优化重写中...';
      
      // 设置按钮为加载状态
      button.disabled = true;
      button.textContent = loadingText;
      button.style.opacity = '0.6';
      button.style.cursor = 'not-allowed';
      button.style.transform = 'scale(0.95)';
      button.style.transition = 'all 0.2s ease';
      
      // 添加加载动画效果
      button.style.background = 'linear-gradient(45deg, #7c3aed, #a855f7, #7c3aed)';
      button.style.backgroundSize = '200% 200%';
      button.style.animation = 'gradientShift 1.5s ease infinite';
      button.style.color = 'white';
      
      try {
        const result = await fn.apply(this, args);
        
        // AI处理完成后立即恢复按钮状态
        button.disabled = originalDisabled;
        button.textContent = originalText;
        button.style.opacity = '';
        button.style.cursor = '';
        button.style.transform = '';
        button.style.background = originalBackground;
        button.style.backgroundSize = '';
        button.style.animation = '';
        button.style.color = originalColor;
        button.style.transition = '';
        
        // 确保按钮可见
        button.style.display = '';
        button.style.visibility = '';
        button.style.position = '';
        button.style.zIndex = '';
        
        isExecuting = false;
        
        return result;
      } catch (error) {
        // 出错时也要恢复按钮状态
        button.disabled = originalDisabled;
        button.textContent = originalText;
        button.style.opacity = '';
        button.style.cursor = '';
        button.style.transform = '';
        button.style.background = originalBackground;
        button.style.backgroundSize = '';
        button.style.animation = '';
        button.style.color = originalColor;
        button.style.transition = '';
        
        // 确保按钮可见
        button.style.display = '';
        button.style.visibility = '';
        button.style.position = '';
        button.style.zIndex = '';
        
        isExecuting = false;
        
        throw error;
      }
    } else {
      try {
        const result = await fn.apply(this, args);
        return result;
      } finally {
        setTimeout(() => {
          isExecuting = false;
        }, delay);
      }
    }
  };
}

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 间隔时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, delay = 300) {
  let lastExecTime = 0;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastExecTime >= delay) {
      fn.apply(this, args);
      lastExecTime = now;
    }
  };
}

/**
 * 添加防重复点击到按钮
 * @param {HTMLElement} button - 按钮元素
 * @param {Function} handler - 点击处理函数
 * @param {number} delay - 防重复延迟时间（毫秒）
 * @param {string} loadingText - 加载中显示的文本
 */
export function addPreventDoubleClick(button, handler, delay = 2000, loadingText = '处理中...') {
  if (!button) return;
  
  let isExecuting = false;
  let originalText = button.textContent;
  
  const wrappedHandler = async function(e) {
    if (isExecuting) return;
    
    isExecuting = true;
    button.disabled = true;
    button.textContent = loadingText;
    button.classList.add('opacity-50', 'cursor-not-allowed');
    
    try {
      await handler(e);
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setTimeout(() => {
        isExecuting = false;
        button.disabled = false;
        button.textContent = originalText;
        button.classList.remove('opacity-50', 'cursor-not-allowed');
      }, delay);
    }
  };
  
  button.addEventListener('click', wrappedHandler);
  return wrappedHandler;
}

/**
 * 保存按钮专用防重复点击
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 防重复延迟时间（毫秒）
 * @returns {Function} 包装后的函数
 */
export function preventDoubleClickSave(fn, delay = 2000) {
  let isExecuting = false;
  
  return async function(...args) {
    if (isExecuting) {
      console.log('保存正在进行中，请稍候...');
      return;
    }
    
    isExecuting = true;
    
    // 获取按钮元素并设置保存状态
    const button = args[0]?.target || document.activeElement;
    if (button && button.tagName === 'BUTTON') {
      const originalText = button.textContent;
      const originalDisabled = button.disabled;
      const originalClass = button.className;
      
      // 设置按钮为保存状态
      button.disabled = true;
      button.textContent = '保存中...';
      button.style.opacity = '0.7';
      button.style.cursor = 'not-allowed';
      button.style.transform = 'scale(0.98)';
      button.style.transition = 'all 0.2s ease';
      
      try {
        const result = await fn.apply(this, args);
        
        // 保存完成后立即恢复按钮状态
        button.disabled = originalDisabled;
        button.textContent = originalText;
        button.style.opacity = '';
        button.style.cursor = '';
        button.style.transform = '';
        button.style.transition = '';
        
        isExecuting = false;
        
        return result;
      } catch (error) {
        // 出错时也要恢复按钮状态
        button.disabled = originalDisabled;
        button.textContent = originalText;
        button.style.opacity = '';
        button.style.cursor = '';
        button.style.transform = '';
        button.style.transition = '';
        
        isExecuting = false;
        
        throw error;
      }
    } else {
      try {
        const result = await fn.apply(this, args);
        return result;
      } finally {
        setTimeout(() => {
          isExecuting = false;
        }, delay);
      }
    }
  };
}

/**
 * 事件委托
 * @param {HTMLElement} parent - 父元素
 * @param {string} selector - 选择器
 * @param {string} event - 事件类型
 * @param {Function} handler - 事件处理函数
 */
export function delegate(parent, selector, event, handler) {
  if (!parent) return;
  
  parent.addEventListener(event, function(e) {
    const target = e.target.closest(selector);
    if (target) {
      handler.call(target, e);
    }
  });
}

/**
 * 移除事件委托
 * @param {HTMLElement} parent - 父元素
 * @param {string} selector - 选择器
 * @param {string} event - 事件类型
 * @param {Function} handler - 事件处理函数
 */
export function undelegate(parent, selector, event, handler) {
  if (!parent) return;
  
  parent.removeEventListener(event, handler);
}

/**
 * 一次性事件监听器
 * @param {HTMLElement} element - 元素
 * @param {string} event - 事件类型
 * @param {Function} handler - 事件处理函数
 */
export function once(element, event, handler) {
  if (!element) return;
  
  const wrappedHandler = function(e) {
    handler(e);
    element.removeEventListener(event, wrappedHandler);
  };
  
  element.addEventListener(event, wrappedHandler);
}

/**
 * 等待元素出现
 * @param {string} selector - 选择器
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<HTMLElement>} 元素
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations) => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * 触发自定义事件
 * @param {HTMLElement} element - 元素
 * @param {string} eventName - 事件名称
 * @param {Object} detail - 事件详情
 */
export function triggerEvent(element, eventName, detail = {}) {
  if (!element) return;
  
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    cancelable: true
  });
  
  element.dispatchEvent(event);
}

/**
 * 监听自定义事件
 * @param {HTMLElement} element - 元素
 * @param {string} eventName - 事件名称
 * @param {Function} handler - 事件处理函数
 */
export function onCustomEvent(element, eventName, handler) {
  if (!element) return;
  
  element.addEventListener(eventName, handler);
}

/**
 * 移除自定义事件监听器
 * @param {HTMLElement} element - 元素
 * @param {string} eventName - 事件名称
 * @param {Function} handler - 事件处理函数
 */
export function offCustomEvent(element, eventName, handler) {
  if (!element) return;
  
  element.removeEventListener(eventName, handler);
}