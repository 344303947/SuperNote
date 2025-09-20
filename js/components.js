/**
 * 组件模块
 * 提供可复用的UI组件
 */

import { renderMarkdown, formatDate, generateId, addPreventDoubleClick } from './utils.js';

/**
 * 模态框组件
 */
export class Modal {
  constructor(id, options = {}) {
    this.id = id;
    this.options = {
      draggable: false,
      closable: true,
      ...options
    };
    this.element = document.getElementById(id);
    this.isOpen = false;
    this.init();
  }

  init() {
    if (!this.element) return;
    
    // 创建遮罩层
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop hidden';
    this.backdrop.id = `${this.id}-backdrop`;
    
    // 插入遮罩层
    this.element.parentNode.insertBefore(this.backdrop, this.element);
    
    // 绑定事件
    this.bindEvents();
    
    // 如果支持拖拽，初始化拖拽功能
    if (this.options.draggable) {
      this.initDragging();
    }
  }

  bindEvents() {
    // 点击遮罩关闭
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop && this.options.closable) {
        this.close();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen && this.options.closable) {
        this.close();
      }
    });
  }

  initDragging() {
    const handle = this.element.querySelector('.drag-handle');
    if (!handle) return;

    let dragging = false;
    let startX = 0, startY = 0, origX = 0, origY = 0;

    const onMouseDown = (e) => {
      dragging = true;
      const rect = this.element.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origX = rect.left;
      origY = rect.top;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.element.style.transform = 'translate(0, 0)';
      this.element.style.left = `${origX + dx}px`;
      this.element.style.top = `${origY + dy}px`;
    };

    const onMouseUp = () => {
      dragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', onMouseDown);
  }

  open() {
    this.element.classList.remove('hidden');
    this.backdrop.classList.remove('hidden');
    this.isOpen = true;
    this.center();
  }

  close() {
    this.element.classList.add('hidden');
    this.backdrop.classList.add('hidden');
    this.isOpen = false;
  }

  center() {
    this.element.style.top = '50%';
    this.element.style.left = '50%';
    this.element.style.transform = 'translate(-50%, -50%)';
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

/**
 * 模糊搜索建议组件
 */
export class FuzzySuggest {
  constructor(inputElement, sourceGetter, options = {}) {
    this.input = inputElement;
    this.sourceGetter = sourceGetter;
    this.options = {
      isTags: false,
      maxItems: 20,
      ...options
    };
    this.wrapper = null;
    this.suggestList = null;
    this.activeIndex = -1;
    this.init();
  }

  init() {
    if (!this.input || typeof this.sourceGetter !== 'function') return;

    // 创建包装器
    this.wrapper = document.createElement('div');
    this.wrapper.style.position = 'relative';
    
    // 包装输入框
    const parent = this.input.parentElement;
    if (parent) {
      parent.style.position = parent.style.position || 'relative';
      parent.appendChild(this.wrapper);
    }

    // 创建建议列表
    this.suggestList = document.createElement('div');
    this.suggestList.className = 'suggest-list hidden';
    parent.appendChild(this.suggestList);

    this.bindEvents();
  }

  bindEvents() {
    this.input.addEventListener('input', () => {
      const [query] = this.getQueryParts();
      this.render(query);
    });

    this.input.addEventListener('focus', () => {
      const [query] = this.getQueryParts();
      this.render(query);
    });

    this.input.addEventListener('keydown', (e) => {
      if (this.suggestList.classList.contains('hidden')) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.moveActive(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.moveActive(-1);
          break;
        case 'Enter':
          e.preventDefault();
          this.pickActive();
          break;
        case 'Escape':
          this.suggestList.classList.add('hidden');
          break;
      }
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.suggestList.contains(e.target) && e.target !== this.input) {
        this.suggestList.classList.add('hidden');
      }
    });

    // 点击建议项
    this.suggestList.addEventListener('click', (e) => {
      const item = e.target.closest('.suggest-item');
      if (!item) return;
      const val = item.getAttribute('data-val') || '';
      this.setWithSelection(val);
      this.suggestList.classList.add('hidden');
      this.input.dispatchEvent(new Event('change'));
    });
  }

  getQueryParts() {
    const val = (this.input.value || '').trim();
    if (!this.options.isTags) return [val, null];
    const parts = val.split(',');
    const last = parts.pop();
    return [String(last || '').trim(), parts];
  }

  setWithSelection(choice) {
    if (!this.options.isTags) {
      this.input.value = choice;
      return;
    }
    const [_, head] = this.getQueryParts();
    const newVal = [...(head || []), choice].filter(s => s !== '').join(', ');
    this.input.value = newVal;
  }

  render(query) {
    const src = this.sourceGetter() || [];
    const q = (query || '').toLowerCase();
    const items = q ? src.filter(v => String(v).toLowerCase().includes(q)) : src.slice(0, this.options.maxItems);
    
    if (!items.length) {
      this.suggestList.innerHTML = '';
      this.suggestList.classList.add('hidden');
      this.activeIndex = -1;
      return;
    }

    this.suggestList.innerHTML = items.slice(0, this.options.maxItems).map((v, i) => 
      `<div class="suggest-item${i === 0 ? ' active' : ''}" data-index="${i}" data-val="${String(v).replace(/"/g, '&quot;')}">${v}</div>`
    ).join('');
    
    this.activeIndex = 0;
    this.suggestList.classList.remove('hidden');
  }

  moveActive(delta) {
    const items = this.suggestList.querySelectorAll('.suggest-item');
    if (!items.length) return;
    this.activeIndex = (this.activeIndex + delta + items.length) % items.length;
    items.forEach((el, i) => {
      el.classList.toggle('active', i === this.activeIndex);
    });
  }

  pickActive() {
    const item = this.suggestList.querySelector(`.suggest-item[data-index="${this.activeIndex}"]`);
    if (!item) return;
    const val = item.getAttribute('data-val') || '';
    this.setWithSelection(val);
    this.suggestList.classList.add('hidden');
    this.input.dispatchEvent(new Event('change'));
  }
}

/**
 * 分页组件
 */
export class Pagination {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      pageSize: 10,
      maxPages: 100,
      ...options
    };
    this.currentPage = 1;
    this.totalItems = 0;
    this.onPageChange = null;
  }

  setTotalItems(total) {
    this.totalItems = total;
    this.render();
  }

  setCurrentPage(page) {
    this.currentPage = page;
    this.render();
  }

  setPageChangeCallback(callback) {
    this.onPageChange = callback;
  }

  render() {
    if (!this.container) return;
    
    const totalPages = Math.max(1, Math.ceil(this.totalItems / this.options.pageSize));
    
    if (this.totalItems === 0) {
      this.container.innerHTML = '';
      return;
    }

    const prevDisabled = this.currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100';
    const nextDisabled = this.currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100';
    
    const pageBtns = Array.from({ length: Math.min(totalPages, this.options.maxPages) }, (_, i) => i + 1).map(p => {
      const active = p === this.currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100';
      return `<button data-page="${p}" class="px-3 py-1 border rounded ${active}">${p}</button>`;
    }).join('');

    this.container.innerHTML = `
      <button id="pgPrev" class="px-3 py-1 border rounded ${prevDisabled}">上一页</button>
      ${pageBtns}
      <button id="pgNext" class="px-3 py-1 border rounded ${nextDisabled}">下一页</button>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const prev = document.getElementById('pgPrev');
    const next = document.getElementById('pgNext');
    
    if (prev) {
      addPreventDoubleClick(prev, () => {
        if (this.currentPage > 1) {
          this.currentPage -= 1;
          this.render();
          if (this.onPageChange) this.onPageChange(this.currentPage);
        }
      }, 300, '切换中...');
    }
    
    if (next) {
      addPreventDoubleClick(next, () => {
        const totalPages = Math.ceil(this.totalItems / this.options.pageSize);
        if (this.currentPage < totalPages) {
          this.currentPage += 1;
          this.render();
          if (this.onPageChange) this.onPageChange(this.currentPage);
        }
      }, 300, '切换中...');
    }

    this.container.querySelectorAll('button[data-page]')?.forEach(btn => {
      addPreventDoubleClick(btn, () => {
        const p = Number(btn.getAttribute('data-page') || '1');
        if (!Number.isNaN(p)) {
          this.currentPage = p;
          this.render();
          if (this.onPageChange) this.onPageChange(this.currentPage);
        }
      }, 300, '切换中...');
    });
  }
}

/**
 * 词云组件
 */
export class WordCloud {
  constructor(containerId, type) {
    this.container = document.getElementById(containerId);
    this.type = type; // 'category' or 'tag'
  }

  render(items) {
    if (!this.container) return;
    
    if (!Array.isArray(items) || items.length === 0) {
      this.container.innerHTML = '<div class="text-gray-400 text-sm">暂无数据</div>';
      return;
    }

    const max = Math.max(...items.map(i => i.count));
    const min = Math.min(...items.map(i => i.count));
    const range = Math.max(1, max - min);

    this.container.innerHTML = items.map(i => {
      const weight = (i.count - min) / range; // 0..1
      const font = 12 + Math.round(weight * 14); // 12..26px
      const color = weight > 0.66 ? 'text-blue-700' : (weight > 0.33 ? 'text-blue-600' : 'text-blue-500');
      return `<button data-type="${this.type}" data-name="${i.name}" class="px-2 py-1 rounded bg-blue-50 ${color}" style="font-size:${font}px">${i.name} (${i.count})</button>`;
    }).join('');
  }

  setClickHandler(handler) {
    if (!this.container) return;
    
    this.container.onclick = (e) => {
      const btn = e.target.closest('button[data-type]');
      if (!btn) return;
      
      // 为词云按钮添加防重复点击
      addPreventDoubleClick(btn, () => {
        const name = btn.getAttribute('data-name');
        const type = btn.getAttribute('data-type');
        handler(name, type);
      }, 500, '过滤中...');
    };
  }
}

/**
 * 笔记卡片组件
 */
export class NoteCard {
  static render(note) {
    const tags = Array.isArray(note.tags)
      ? note.tags
      : (note.tags ? String(note.tags).split(',') : []);
    
    const tagElements = tags
      .map(t => String(t).trim())
      .filter(t => t)
      .map(t => `<span class="tag">${t}</span>`)
      .join('');

    return `
      <div class="note-card border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" 
           data-note-id="${note.id ?? ''}" 
           data-note-title="${(note.title || '').replace(/"/g, '&quot;')}" 
           data-note-content="${encodeURIComponent(note.content || '')}">
        <h3 class="text-lg font-semibold text-gray-800">${note.title}</h3>
        <p class="text-sm text-gray-600 mb-2">分类： <span class="category">${note.category}</span></p>
        <div class="flex flex-wrap gap-1 mb-2">
          ${tagElements}
        </div>
        <p class="text-xs text-gray-500">创建于 ${formatDate(note.created_at)}</p>
      </div>
    `;
  }
}
