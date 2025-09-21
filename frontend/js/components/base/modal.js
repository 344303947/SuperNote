/**
 * 模态框组件
 */
import { 
  getElementById, 
  addClass, 
  removeClass, 
  setTextContent,
  showElement,
  hideElement 
} from '../../utils/dom.js';

export class Modal {
  constructor(options = {}) {
    this.id = options.id || 'modal';
    this.title = options.title || '标题';
    this.content = options.content || '';
    this.draggable = options.draggable !== false;
    this.width = options.width || '600px';
    this.height = options.height || 'auto';
    
    this.isOpen = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.init();
  }

  /**
   * 初始化模态框
   */
  init() {
    this.createModal();
    this.bindEvents();
  }

  /**
   * 创建模态框HTML
   */
  createModal() {
    // 检查是否已存在
    if (getElementById(this.id)) {
      return;
    }

    const modalHtml = `
      <div id="${this.id}" class="modal-overlay hidden fixed inset-0 bg-black bg-opacity-50 z-50">
        <div class="modal-container fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden"
             style="width: ${this.width}; height: ${this.height};">
          <div class="modal-header flex justify-between items-center p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">${this.title}</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl leading-none">
              ×
            </button>
          </div>
          <div class="modal-body p-4 overflow-y-auto">
            ${this.content}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const modal = getElementById(this.id);
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    const modalContainer = modal.querySelector('.modal-container');

    // 关闭按钮
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // 点击遮罩关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hide();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.hide();
      }
    });

    // 拖拽功能
    if (this.draggable && modalContainer) {
      const header = modalContainer.querySelector('.modal-header');
      if (header) {
        this.bindDragEvents(header, modalContainer);
      }
    }
  }

  /**
   * 绑定拖拽事件
   */
  bindDragEvents(header, container) {
    header.style.cursor = this.draggable ? 'move' : 'default';

    header.addEventListener('mousedown', (e) => {
      if (!this.draggable) return;
      
      this.isDragging = true;
      this.dragOffset.x = e.clientX - container.offsetLeft;
      this.dragOffset.y = e.clientY - container.offsetTop;
      
      addClass(document.body, 'select-none');
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.draggable) return;
      
      e.preventDefault();
      
      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;
      
      container.style.left = x + 'px';
      container.style.top = y + 'px';
      container.style.transform = 'none';
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        removeClass(document.body, 'select-none');
      }
    });
  }

  /**
   * 显示模态框
   */
  show() {
    const modal = getElementById(this.id);
    if (!modal) return;

    this.isOpen = true;
    removeClass(modal, 'hidden');
    addClass(document.body, 'overflow-hidden');
    
    // 触发显示事件
    this.onShow();
  }

  /**
   * 隐藏模态框
   */
  hide() {
    const modal = getElementById(this.id);
    if (!modal) return;

    this.isOpen = false;
    addClass(modal, 'hidden');
    removeClass(document.body, 'overflow-hidden');
    
    // 触发隐藏事件
    this.onHide();
  }

  /**
   * 设置标题
   */
  setTitle(title) {
    this.title = title;
    const titleElement = getElementById(this.id)?.querySelector('.modal-header h3');
    if (titleElement) {
      setTextContent(titleElement, title);
    }
  }

  /**
   * 设置内容
   */
  setContent(content) {
    this.content = content;
    const bodyElement = getElementById(this.id)?.querySelector('.modal-body');
    if (bodyElement) {
      bodyElement.innerHTML = content;
    }
  }

  /**
   * 显示事件回调
   */
  onShow() {
    // 子类可以重写此方法
  }

  /**
   * 隐藏事件回调
   */
  onHide() {
    // 子类可以重写此方法
  }

  /**
   * 销毁模态框
   */
  destroy() {
    const modal = getElementById(this.id);
    if (modal) {
      modal.remove();
    }
  }
}

/**
 * 笔记模态框
 */
export class NoteModal extends Modal {
  constructor(options = {}) {
    super({
      ...options,
      title: options.title || '笔记',
      width: '800px'
    });
  }

  /**
   * 显示笔记内容
   */
  showNote(note) {
    const content = this.generateNoteContent(note);
    this.setContent(content);
    this.show();
  }

  /**
   * 生成笔记内容HTML
   */
  generateNoteContent(note) {
    return `
      <div class="note-content">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input type="text" id="noteTitle" value="${note.title || ''}" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <input type="text" id="noteCategory" value="${note.category || ''}" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">标签</label>
          <input type="text" id="noteTags" value="${note.getTagsString() || ''}" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 placeholder="多个标签用逗号分隔">
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">内容</label>
          <textarea id="noteContent" rows="10" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${note.content || ''}</textarea>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">AI优化重写提示词（可选）</label>
          <textarea id="optimizePrompt" rows="3" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入自定义优化提示词，留空则使用默认分析模式"></textarea>
        </div>
        
        <div class="flex justify-between">
          <div>
            <button id="optimizeBtn" class="btn btn-secondary mr-2">AI优化重写</button>
            <button id="fullscreenBtn" class="btn btn-secondary">全屏编辑</button>
          </div>
          <div>
            ${note.id ? `<button id="deleteBtn" class="btn btn-danger mr-2">删除</button>` : ''}
            <button id="saveBtn" class="btn btn-primary">保存</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 获取表单数据
   */
  getFormData() {
    const modal = getElementById(this.id);
    if (!modal) return null;

    return {
      title: modal.querySelector('#noteTitle')?.value || '',
      category: modal.querySelector('#noteCategory')?.value || '',
      tags: modal.querySelector('#noteTags')?.value || '',
      content: modal.querySelector('#noteContent')?.value || '',
      optimizePrompt: modal.querySelector('#optimizePrompt')?.value || ''
    };
  }

  /**
   * 设置表单数据
   */
  setFormData(data) {
    const modal = getElementById(this.id);
    if (!modal) return;

    if (data.title !== undefined) {
      const titleInput = modal.querySelector('#noteTitle');
      if (titleInput) titleInput.value = data.title;
    }
    
    if (data.category !== undefined) {
      const categoryInput = modal.querySelector('#noteCategory');
      if (categoryInput) categoryInput.value = data.category;
    }
    
    if (data.tags !== undefined) {
      const tagsInput = modal.querySelector('#noteTags');
      if (tagsInput) tagsInput.value = data.tags;
    }
    
    if (data.content !== undefined) {
      const contentInput = modal.querySelector('#noteContent');
      if (contentInput) contentInput.value = data.content;
    }
    
    if (data.optimizePrompt !== undefined) {
      const promptInput = modal.querySelector('#optimizePrompt');
      if (promptInput) promptInput.value = data.optimizePrompt;
    }
  }

  /**
   * 清空表单
   */
  clearForm() {
    this.setFormData({
      title: '',
      category: '',
      tags: '',
      content: '',
      optimizePrompt: ''
    });
  }
}