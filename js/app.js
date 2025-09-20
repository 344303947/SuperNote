/**
 * 主应用模块
 * 协调各个模块，管理应用状态和事件
 */

import { 
  API_BASE, 
  renderMarkdown, 
  getCookie, 
  setLoadingState, 
  showMessage,
  debounce,
  preventDoubleClick,
  addPreventDoubleClick
} from './utils.js';

// 导入并重新导出以允许修改
import { ALL_NOTES as _ALL_NOTES, CURRENT_PAGE as _CURRENT_PAGE } from './utils.js';

import { safeAPI } from './api.js';
import { Modal, FuzzySuggest, Pagination, WordCloud, NoteCard } from './components.js';

/**
 * 主应用类
 */
class NoteApp {
  constructor() {
    this.modals = {};
    this.components = {};
    this.cachedCategories = [];
    this.cachedTags = [];
    this.currentViewRaw = '';
    this.isLoggedIn = false;
    
    // 本地状态变量
    this.allNotes = [];
    this.currentPage = 1;
    
    this.init();
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      await this.initializeElements();
      await this.initializeModals();
      await this.initializeComponents();
      await this.bindEvents();
      await this.loadInitialData();
    } catch (error) {
      console.error('应用初始化失败:', error);
      showMessage('应用初始化失败', 'error');
    }
  }

  /**
   * 初始化DOM元素引用
   */
  async initializeElements() {
    // 主要界面元素
    this.elements = {
      // 配置界面
      apiConfig: document.getElementById('apiConfig'),
      loginForm: document.getElementById('loginForm'),
      apiUrl: document.getElementById('apiUrl'),
      apiKey: document.getElementById('apiKey'),
      modelSelect: document.getElementById('modelSelect'),
      customModelInput: document.getElementById('customModelInput'),
      
      // 主界面
      mainApp: document.getElementById('mainApp'),
      noConfig: document.getElementById('noConfig'),
      searchInput: document.getElementById('searchInput'),
      newNoteBtn: document.getElementById('newNoteBtn'),
      logoutBtn: document.getElementById('logoutBtn'),
      
      // 笔记列表
      noteList: document.getElementById('noteList'),
      activeFilter: document.getElementById('activeFilter'),
      filterType: document.getElementById('filterType'),
      filterValue: document.getElementById('filterValue'),
      clearFilterBtn: document.getElementById('clearFilterBtn'),
      
      // 新建笔记模态框
      newNoteModal: document.getElementById('newNoteModal'),
      newNoteModalCard: document.getElementById('newNoteModalCard'),
      noteTitle: document.getElementById('noteTitle'),
      noteContent: document.getElementById('noteContent'),
      noteCategory: document.getElementById('noteCategory'),
      noteTags: document.getElementById('noteTags'),
      newOptPrompt: document.getElementById('newOptPrompt'),
      newOptimizeCombinedBtn: document.getElementById('newOptimizeCombinedBtn'),
      newOptStatus: document.getElementById('newOptStatus'),
      saveNoteBtn: document.getElementById('saveNoteBtn'),
      saveStatus: document.getElementById('saveStatus'),
      cancelBtn: document.getElementById('cancelBtn'),
      cancelBtn2: document.getElementById('cancelBtn2'),
      toggleNewPreviewBtn: document.getElementById('toggleNewPreviewBtn'),
      notePreview: document.getElementById('notePreview'),
      
      // 预览笔记模态框
      viewNoteModal: document.getElementById('viewNoteModal'),
      viewNoteModalCard: document.getElementById('viewNoteModalCard'),
      viewTitle: document.getElementById('viewTitle'),
      viewEditor: document.getElementById('viewEditor'),
      viewPreview: document.getElementById('viewPreview'),
      toggleEditBtn: document.getElementById('toggleEditBtn'),
      togglePreviewBtn: document.getElementById('togglePreviewBtn'),
      editTitle: document.getElementById('editTitle'),
      editCategory: document.getElementById('editCategory'),
      editTags: document.getElementById('editTags'),
      optPrompt: document.getElementById('optPrompt'),
      optimizeBtn: document.getElementById('optimizeBtn'),
      saveOptimizedBtn: document.getElementById('saveOptimizedBtn'),
      deleteNoteBtn: document.getElementById('deleteNoteBtn'),
      optStatus: document.getElementById('optStatus'),
      closeViewBtn: document.getElementById('closeViewBtn'),
      fullscreenBtn: document.getElementById('fullscreenBtn'),
      
      // 全屏模态框
      fullscreenModal: document.getElementById('fullscreenModal'),
      fullscreenTitle: document.getElementById('fullscreenTitle'),
      fullscreenEditor: document.getElementById('fullscreenEditor'),
      fullscreenPreview: document.getElementById('fullscreenPreview'),
      fullscreenToggleEditBtn: document.getElementById('fullscreenToggleEditBtn'),
      fullscreenTogglePreviewBtn: document.getElementById('fullscreenTogglePreviewBtn'),
      fullscreenEditTitle: document.getElementById('fullscreenEditTitle'),
      fullscreenEditCategory: document.getElementById('fullscreenEditCategory'),
      fullscreenEditTags: document.getElementById('fullscreenEditTags'),
      fullscreenOptimizeBtn: document.getElementById('fullscreenOptimizeBtn'),
      fullscreenSaveBtn: document.getElementById('fullscreenSaveBtn'),
      fullscreenDeleteBtn: document.getElementById('fullscreenDeleteBtn'),
      fullscreenOptPrompt: document.getElementById('fullscreenOptPrompt'),
      fullscreenOptStatus: document.getElementById('fullscreenOptStatus'),
      exitFullscreenBtn: document.getElementById('exitFullscreenBtn'),
      
      // 词云
      catCloud: document.getElementById('catCloud'),
      tagCloud: document.getElementById('tagCloud')
    };
  }

  /**
   * 初始化模态框
   */
  async initializeModals() {
    // 新建笔记模态框
    this.modals.newNote = new Modal('newNoteModal', {
      draggable: false,
      closable: true
    });

    // 预览笔记模态框
    this.modals.viewNote = new Modal('viewNoteModal', {
      draggable: false,
      closable: true
    });

    // 全屏模态框 - 不使用Modal类，直接控制显示/隐藏
    this.elements.fullscreenModal = document.getElementById('fullscreenModal');
  }

  /**
   * 初始化组件
   */
  async initializeComponents() {
    // 分页组件
    this.components.pagination = new Pagination('pagination', {
      pageSize: 5,
      maxPages: 100
    });

    this.components.pagination.setPageChangeCallback((page) => {
      this.currentPage = page;
      this.renderPage();
    });

    // 词云组件
    this.components.catCloud = new WordCloud('catCloud', 'category');
    this.components.tagCloud = new WordCloud('tagCloud', 'tag');

    // 模糊搜索建议
    this.initializeFuzzySuggest();
  }

  /**
   * 初始化模糊搜索建议
   */
  initializeFuzzySuggest() {
    const suggestInputs = [
      { element: this.elements.noteCategory, source: () => this.cachedCategories, isTags: false },
      { element: this.elements.editCategory, source: () => this.cachedCategories, isTags: false },
      { element: this.elements.editTags, source: () => this.cachedTags, isTags: true },
      { element: this.elements.noteTags, source: () => this.cachedTags, isTags: true },
      { element: this.elements.fullscreenEditCategory, source: () => this.cachedCategories, isTags: false },
      { element: this.elements.fullscreenEditTags, source: () => this.cachedTags, isTags: true }
    ];

    suggestInputs.forEach(({ element, source, isTags }) => {
      if (element) {
        new FuzzySuggest(element, source, { isTags });
      }
    });
  }

  /**
   * 绑定事件
   */
  async bindEvents() {
    // 登录表单
    if (this.elements.loginForm) {
      this.elements.loginForm.onsubmit = preventDoubleClick((e) => this.handleLogin(e));
    }

    // 模型选择变化
    if (this.elements.modelSelect) {
      this.elements.modelSelect.addEventListener('change', () => this.handleModelChange());
    }

    // 搜索
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', 
        debounce((e) => this.handleSearch(e), 300)
      );
    }

    // 新建笔记 - 应用防重复点击
    if (this.elements.newNoteBtn) {
      addPreventDoubleClick(this.elements.newNoteBtn, () => this.openNewNoteModal(), 500, '打开中...');
    }

    // 退出登录 - 应用防重复点击
    if (this.elements.logoutBtn) {
      addPreventDoubleClick(this.elements.logoutBtn, () => this.handleLogout(), 2000, '退出中...');
    }

    // 清除过滤 - 应用防重复点击
    if (this.elements.clearFilterBtn) {
      addPreventDoubleClick(this.elements.clearFilterBtn, () => this.clearFilter(), 500, '清除中...');
    }

    // 笔记列表点击
    if (this.elements.noteList) {
      this.elements.noteList.onclick = (e) => this.handleNoteClick(e);
    }

    // 词云点击
    this.components.catCloud.setClickHandler((name, type) => this.handleCloudClick(name, type));
    this.components.tagCloud.setClickHandler((name, type) => this.handleCloudClick(name, type));

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.modals.newNote.isOpen) this.modals.newNote.close();
        if (this.modals.viewNote.isOpen) this.modals.viewNote.close();
        // ESC键关闭全屏模态框
        if (this.elements.fullscreenModal && !this.elements.fullscreenModal.classList.contains('hidden')) {
          this.closeFullscreenModal();
        }
      }
    });

    // 绑定模态框相关事件
    this.bindModalEvents();
  }

  /**
   * 绑定模态框事件
   */
  bindModalEvents() {
    // 新建笔记模态框事件
    if (this.elements.cancelBtn) {
      addPreventDoubleClick(this.elements.cancelBtn, () => this.modals.newNote.close(), 300, '关闭中...');
    }
    if (this.elements.cancelBtn2) {
      addPreventDoubleClick(this.elements.cancelBtn2, () => this.modals.newNote.close(), 300, '关闭中...');
    }
    if (this.elements.saveNoteBtn) {
      addPreventDoubleClick(this.elements.saveNoteBtn, () => this.handleSaveNote(), 2000, '保存中...');
    }
    if (this.elements.newOptimizeCombinedBtn) {
      addPreventDoubleClick(this.elements.newOptimizeCombinedBtn, () => this.handleNewOptimize(), 3000, 'AI优化中...');
    }

    // 预览笔记模态框事件
    if (this.elements.closeViewBtn) {
      addPreventDoubleClick(this.elements.closeViewBtn, () => this.modals.viewNote.close(), 300, '关闭中...');
    }
    if (this.elements.fullscreenBtn) {
      addPreventDoubleClick(this.elements.fullscreenBtn, () => this.openFullscreenModal(), 500, '全屏中...');
    }
    if (this.elements.toggleEditBtn) {
      addPreventDoubleClick(this.elements.toggleEditBtn, () => this.enterEditMode(), 300, '切换中...');
    }
    if (this.elements.togglePreviewBtn) {
      addPreventDoubleClick(this.elements.togglePreviewBtn, () => this.enterPreviewMode(true), 300, '切换中...');
    }
    if (this.elements.optimizeBtn) {
      addPreventDoubleClick(this.elements.optimizeBtn, () => this.handleOptimize(), 3000, 'AI优化中...');
    }
    if (this.elements.saveOptimizedBtn) {
      addPreventDoubleClick(this.elements.saveOptimizedBtn, () => this.handleSaveOptimized(), 2000, '保存中...');
    }
    if (this.elements.deleteNoteBtn) {
      addPreventDoubleClick(this.elements.deleteNoteBtn, () => this.handleDeleteNote(), 2000, '删除中...');
    }

    // 全屏模态框事件
    if (this.elements.exitFullscreenBtn) {
      addPreventDoubleClick(this.elements.exitFullscreenBtn, () => this.closeFullscreenModal(), 300, '退出中...');
    }
    if (this.elements.fullscreenToggleEditBtn) {
      addPreventDoubleClick(this.elements.fullscreenToggleEditBtn, () => this.enterFullscreenEditMode(), 300, '切换中...');
    }
    if (this.elements.fullscreenTogglePreviewBtn) {
      addPreventDoubleClick(this.elements.fullscreenTogglePreviewBtn, () => this.enterFullscreenPreviewMode(true), 300, '切换中...');
    }
    if (this.elements.fullscreenOptimizeBtn) {
      addPreventDoubleClick(this.elements.fullscreenOptimizeBtn, () => this.handleFullscreenOptimize(), 3000, 'AI优化中...');
    }
    if (this.elements.fullscreenSaveBtn) {
      addPreventDoubleClick(this.elements.fullscreenSaveBtn, () => this.handleFullscreenSave(), 2000, '保存中...');
    }
    if (this.elements.fullscreenDeleteBtn) {
      addPreventDoubleClick(this.elements.fullscreenDeleteBtn, () => this.handleFullscreenDelete(), 2000, '删除中...');
    }

    // 预览切换
    this.bindPreviewEvents();
  }

  /**
   * 绑定预览相关事件
   */
  bindPreviewEvents() {
    // 新建笔记预览
    if (this.elements.toggleNewPreviewBtn && this.elements.noteContent && this.elements.notePreview) {
      const syncNewPreview = () => {
        this.elements.notePreview.innerHTML = renderMarkdown(this.elements.noteContent.value || '');
      };
      
      addPreventDoubleClick(this.elements.toggleNewPreviewBtn, () => {
        const hidden = this.elements.notePreview.classList.contains('hidden');
        if (hidden) {
          syncNewPreview();
          this.elements.notePreview.classList.remove('hidden');
          this.elements.toggleNewPreviewBtn.textContent = '隐藏预览';
        } else {
          this.elements.notePreview.classList.add('hidden');
          this.elements.toggleNewPreviewBtn.textContent = '预览 Markdown';
        }
      }, 300, '切换中...');
      
      this.elements.noteContent.addEventListener('input', () => {
        if (!this.elements.notePreview.classList.contains('hidden')) {
          syncNewPreview();
        }
      });
    }

    // 编辑/预览模式切换
    ['input', 'change', 'keyup'].forEach(evt => {
      if (this.elements.viewEditor) {
        this.elements.viewEditor.addEventListener(evt, () => {
          if (this.elements.saveOptimizedBtn) {
            this.elements.saveOptimizedBtn.disabled = false;
          }
        });
      }
      
      const editFields = [this.elements.editTitle, this.elements.editCategory, this.elements.editTags];
      editFields.forEach(field => {
        if (field) {
          field.addEventListener(evt, () => {
            if (this.elements.saveOptimizedBtn) {
              this.elements.saveOptimizedBtn.disabled = false;
            }
          });
        }
      });
    });
  }

  /**
   * 清空所有AI优化提示词输入框
   */
  clearAIOptimizationPrompts() {
    // 清空新建笔记模态框中的AI优化提示词
    if (this.elements.newOptPrompt) {
      this.elements.newOptPrompt.value = '';
    }
    
    // 清空预览笔记模态框中的AI优化提示词
    if (this.elements.optPrompt) {
      this.elements.optPrompt.value = '';
    }
    
    // 清空全屏模态框中的AI优化提示词
    if (this.elements.fullscreenOptPrompt) {
      this.elements.fullscreenOptPrompt.value = '';
    }
  }

  /**
   * 加载初始数据
   */
  async loadInitialData() {
    try {
      // 加载配置
      const config = await safeAPI.auth.getConfig();
      
      if (config.api_url) {
        this.elements.apiUrl.value = config.api_url;
        this.elements.apiKey.value = config.api_key;
        // 设置模型选择
        if (config.default_model) {
          // 检查是否是预设模型
          const option = this.elements.modelSelect.querySelector(`option[value="${config.default_model}"]`);
          if (option) {
            this.elements.modelSelect.value = config.default_model;
            this.elements.customModelInput.classList.add('hidden');
          } else {
            // 自定义模型
            this.elements.modelSelect.value = 'custom';
            this.elements.customModelInput.value = config.default_model;
            this.elements.customModelInput.classList.remove('hidden');
          }
        }
      }

      // 根据登录状态显示界面
      this.showMainApp(config.logged_in);
      await Promise.all([this.loadNotes(), this.loadStats()]);
      
      // 如果没有登录，显示提示信息
      if (!config.logged_in) {
        showMessage('未登录状态：可以查看笔记，但无法使用AI功能。请点击右上角"退出登录"按钮重新登录。', 'warning');
      } else {
        console.log('已登录状态，可以使用AI功能');
      }
    } catch (error) {
      console.error('加载初始数据失败:', error);
      // 即使出错也尝试显示主应用界面
      this.showMainApp(false); // 明确设置为未登录状态
      await this.loadNotes();
      showMessage('配置加载失败，但可以查看已有笔记。请重新登录以使用AI功能。', 'warning');
    }
  }

  /**
   * 显示主应用界面
   * @param {boolean} loggedIn - 是否已登录
   */
  showMainApp(loggedIn = true) {
    this.elements.apiConfig.classList.add('hidden');
    this.elements.mainApp.classList.remove('hidden');
    this.elements.noConfig.classList.add('hidden');
    this.isLoggedIn = loggedIn;
  }

  /**
   * 显示配置表单
   */
  showConfigForm() {
    this.elements.apiConfig.classList.remove('hidden');
    this.elements.mainApp.classList.add('hidden');
    this.elements.noConfig.classList.remove('hidden');
    this.isLoggedIn = false;
  }

  /**
   * 处理模型选择变化
   */
  handleModelChange() {
    const selectedModel = this.elements.modelSelect.value;
    if (selectedModel === 'custom') {
      this.elements.customModelInput.classList.remove('hidden');
      this.elements.customModelInput.focus();
    } else {
      this.elements.customModelInput.classList.add('hidden');
      this.elements.customModelInput.value = '';
    }
  }

  /**
   * 处理登录
   */
  async handleLogin(e) {
    e.preventDefault();
    
    const url = this.elements.apiUrl.value.trim();
    const key = this.elements.apiKey.value.trim();
    // 获取选择的模型
    let model = this.elements.modelSelect.value;
    if (model === 'custom') {
      model = this.elements.customModelInput.value.trim();
      if (!model) {
        showMessage('请输入自定义模型名称', 'error');
        return;
      }
    }
    
    if (!url || !key) {
      showMessage('请填写完整信息', 'error');
      return;
    }

    try {
      await safeAPI.auth.login({ api_url: url, api_key: key, model });
      showMessage('登录成功！', 'success');
      this.showMainApp(true); // 明确传递登录状态
      await Promise.all([this.loadNotes(), this.loadStats()]);
    } catch (error) {
      // 错误已在API层处理
    }
  }

  /**
   * 处理退出登录
   */
  async handleLogout() {
    try {
      await safeAPI.auth.logout();
      showMessage('已退出登录', 'success');
      this.showConfigForm();
      this.elements.apiUrl.value = '';
      this.elements.apiKey.value = '';
      this.elements.modelSelect.value = 'qwen3:30b-40k';
      this.elements.customModelInput.value = '';
      this.elements.customModelInput.classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      // 错误已在API层处理
    }
  }

  /**
   * 处理搜索
   */
  async handleSearch(e) {
    const query = e.target.value.trim();
    
    if (query.length < 1) {
      await this.loadNotes();
      return;
    }

    try {
      const results = await safeAPI.notes.search(query);
      this.setNotes(results || []);
    } catch (error) {
      // 错误已在API层处理
    }
  }

  /**
   * 加载笔记
   */
  async loadNotes() {
    try {
      const notes = await safeAPI.notes.getAll();
      this.setNotes(notes || []);
    } catch (error) {
      // 错误已在API层处理
    }
  }

  /**
   * 设置笔记数据
   */
  setNotes(list) {
    this.allNotes = Array.isArray(list) ? list : [];
    this.currentPage = 1;
    this.renderPage();
  }

  /**
   * 渲染分页
   */
  renderPage() {
    const total = this.allNotes.length;
    const pageSize = this.components.pagination.options.pageSize;
    const start = (this.currentPage - 1) * pageSize;
    const pageNotes = this.allNotes.slice(start, start + pageSize);
    this.renderNotes(pageNotes);
    this.components.pagination.setTotalItems(total);
    this.components.pagination.setCurrentPage(this.currentPage);
  }

  /**
   * 渲染笔记列表
   */
  renderNotes(notes) {
    if (!this.elements.noteList) return;
    
    if (notes.length === 0) {
      this.elements.noteList.innerHTML = '<div class="text-gray-500 text-center py-10">暂无笔记</div>';
      return;
    }

    this.elements.noteList.innerHTML = notes.map(note => NoteCard.render(note)).join('');
  }

  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const [stats, categories, tags] = await Promise.all([
        safeAPI.stats.getStats(),
        safeAPI.stats.getCategories(),
        safeAPI.stats.getTags()
      ]);

      this.components.catCloud.render(stats.categories || []);
      this.components.tagCloud.render(stats.tags || []);
      
      this.cachedCategories = categories || [];
      this.cachedTags = tags || [];
    } catch (error) {
      // 错误已在API层处理
    }
  }

  /**
   * 处理笔记点击
   */
  async handleNoteClick(e) {
    const card = e.target.closest('.note-card');
    if (!card) return;

    const noteId = card.getAttribute('data-note-id');
    const noteTitle = card.getAttribute('data-note-title') || '笔记预览';
    const encodedContent = card.getAttribute('data-note-content') || '';
    
    let contentText = '';
    if (encodedContent) {
      try {
        contentText = decodeURIComponent(encodedContent);
      } catch (_) {
        contentText = '';
      }
    }

    // 如果没有内容，尝试从API获取
    if (!contentText && noteId) {
      try {
        const detail = await safeAPI.notes.getById(noteId);
        contentText = detail.content || detail.text || '';
      } catch (_) {
        // 忽略错误
      }
    }

    this.openViewModal(noteId, noteTitle, contentText);
  }

  /**
   * 打开预览模态框
   */
  async openViewModal(noteId, noteTitle, contentText) {
    this.elements.viewTitle.textContent = noteTitle;
    this.setViewRaw(contentText || '未能加载到该笔记的正文内容。');
    this.enterEditMode();
    
    this.elements.viewNoteModal.setAttribute('data-note-id', noteId || '');
    this.elements.viewNoteModal.setAttribute('data-note-title', noteTitle || '');

    // 加载笔记详情
    if (noteId) {
      try {
        const detail = await safeAPI.notes.getById(noteId);
        if (this.elements.editTitle) this.elements.editTitle.value = detail?.title || noteTitle || '';
        if (this.elements.editCategory) this.elements.editCategory.value = detail?.category || '';
        if (this.elements.editTags) this.elements.editTags.value = detail?.tags || '';
      } catch (_) {
        // 忽略错误
      }
    }

    this.modals.viewNote.open();
  }

  /**
   * 设置视图原始内容
   */
  setViewRaw(text) {
    this.currentViewRaw = String(text || '');
    if (this.elements.viewEditor) this.elements.viewEditor.value = this.currentViewRaw;
    if (this.elements.viewPreview) this.elements.viewPreview.innerHTML = renderMarkdown(this.currentViewRaw);
    if (this.elements.fullscreenEditor) this.elements.fullscreenEditor.value = this.currentViewRaw;
    if (this.elements.fullscreenPreview) this.elements.fullscreenPreview.innerHTML = renderMarkdown(this.currentViewRaw);
  }

  /**
   * 进入编辑模式
   */
  enterEditMode() {
    if (!this.elements.viewEditor || !this.elements.viewPreview) return;
    this.elements.viewEditor.classList.remove('hidden');
    this.elements.viewPreview.classList.add('hidden');
    if (this.elements.toggleEditBtn) this.elements.toggleEditBtn.classList.add('hidden');
    if (this.elements.togglePreviewBtn) this.elements.togglePreviewBtn.classList.remove('hidden');
  }

  /**
   * 进入预览模式
   */
  enterPreviewMode(syncFromEditor = false) {
    if (!this.elements.viewEditor || !this.elements.viewPreview) return;
    if (syncFromEditor) this.currentViewRaw = this.elements.viewEditor.value || '';
    this.elements.viewPreview.innerHTML = renderMarkdown(this.currentViewRaw);
    this.elements.viewEditor.classList.add('hidden');
    this.elements.viewPreview.classList.remove('hidden');
    if (this.elements.toggleEditBtn) this.elements.toggleEditBtn.classList.remove('hidden');
    if (this.elements.togglePreviewBtn) this.elements.togglePreviewBtn.classList.add('hidden');
  }

  /**
   * 进入全屏编辑模式
   */
  enterFullscreenEditMode() {
    if (!this.elements.fullscreenEditor || !this.elements.fullscreenPreview) return;
    this.elements.fullscreenEditor.classList.remove('hidden');
    this.elements.fullscreenPreview.classList.add('hidden');
    if (this.elements.fullscreenToggleEditBtn) this.elements.fullscreenToggleEditBtn.classList.add('hidden');
    if (this.elements.fullscreenTogglePreviewBtn) this.elements.fullscreenTogglePreviewBtn.classList.remove('hidden');
  }

  /**
   * 进入全屏预览模式
   */
  enterFullscreenPreviewMode(syncFromEditor = false) {
    if (!this.elements.fullscreenEditor || !this.elements.fullscreenPreview) return;
    if (syncFromEditor) this.currentViewRaw = this.elements.fullscreenEditor.value || '';
    this.elements.fullscreenPreview.innerHTML = renderMarkdown(this.currentViewRaw);
    this.elements.fullscreenEditor.classList.add('hidden');
    this.elements.fullscreenPreview.classList.remove('hidden');
    if (this.elements.fullscreenToggleEditBtn) this.elements.fullscreenToggleEditBtn.classList.remove('hidden');
    if (this.elements.fullscreenTogglePreviewBtn) this.elements.fullscreenTogglePreviewBtn.classList.add('hidden');
  }

  /**
   * 打开新建笔记模态框
   */
  openNewNoteModal() {
    this.modals.newNote.open();
  }

  /**
   * 打开全屏模态框
   */
  openFullscreenModal() {
    const noteId = this.elements.viewNoteModal.getAttribute('data-note-id');
    const noteTitle = this.elements.viewNoteModal.getAttribute('data-note-title');
    
    this.elements.fullscreenTitle.textContent = noteTitle || '笔记全屏预览';
    this.elements.fullscreenModal.setAttribute('data-note-id', noteId || '');
    this.elements.fullscreenModal.setAttribute('data-note-title', noteTitle || '');
    
    // 同步编辑字段
    this.elements.fullscreenEditTitle.value = this.elements.editTitle?.value || '';
    this.elements.fullscreenEditCategory.value = this.elements.editCategory?.value || '';
    this.elements.fullscreenEditTags.value = this.elements.editTags?.value || '';
    this.elements.fullscreenOptPrompt.value = this.elements.optPrompt?.value || '';
    
    // 同步内容
    this.setViewRaw(this.currentViewRaw);
    
    // 直接控制全屏模态框的显示
    this.elements.fullscreenModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    this.enterFullscreenEditMode();
  }

  /**
   * 关闭全屏模态框
   */
  closeFullscreenModal() {
    // 直接控制全屏模态框的隐藏
    this.elements.fullscreenModal.classList.add('hidden');
    document.body.style.overflow = '';
    
    // 确保普通模态框保持打开状态
    if (this.modals.viewNote) {
      this.modals.viewNote.isOpen = true;
    }
    
    // 同步数据回普通模态框
    if (this.elements.fullscreenEditor && !this.elements.fullscreenEditor.classList.contains('hidden')) {
      this.currentViewRaw = this.elements.fullscreenEditor.value || '';
      if (this.elements.viewEditor) this.elements.viewEditor.value = this.currentViewRaw;
      if (this.elements.viewPreview) this.elements.viewPreview.innerHTML = renderMarkdown(this.currentViewRaw);
    }
     
    // 同步编辑字段
    if (this.elements.editTitle) this.elements.editTitle.value = this.elements.fullscreenEditTitle.value;
    if (this.elements.editCategory) this.elements.editCategory.value = this.elements.fullscreenEditCategory.value;
    if (this.elements.editTags) this.elements.editTags.value = this.elements.fullscreenEditTags.value;
    if (this.elements.optPrompt) this.elements.optPrompt.value = this.elements.fullscreenOptPrompt.value;
  }

  /**
   * 处理词云点击
   */
  async handleCloudClick(name, type) {
    this.elements.filterType.textContent = type === 'category' ? '分类' : '标签';
    this.elements.filterValue.textContent = name;
    this.elements.activeFilter.classList.remove('hidden');
    
    // 清空搜索框，进入过滤模式
    this.elements.searchInput.value = '';
    
    try {
      let results;
      if (type === 'category') {
        results = await safeAPI.notes.getByCategory(name);
      } else {
        results = await safeAPI.notes.getByTag(name);
      }
      this.setNotes(results || []);
    } catch (error) {
      // 错误已在API层处理
    }
  }

  /**
   * 清除过滤
   */
  async clearFilter() {
    this.elements.activeFilter.classList.add('hidden');
    this.elements.filterType.textContent = '';
    this.elements.filterValue.textContent = '';
    await this.loadNotes();
  }

  /**
   * 处理保存笔记
   */
  async handleSaveNote() {
    const title = this.elements.noteTitle.value.trim();
    const content = this.elements.noteContent.value.trim();
    const category = (this.elements.noteCategory?.value || '').trim();
    const tags = (this.elements.noteTags?.value || '').trim();
    
    if (!title || !content) {
      showMessage('标题和内容不能为空', 'error');
      return;
    }

    // 显示加载状态
    setLoadingState(this.elements.saveNoteBtn, true);
    setLoadingState(this.elements.cancelBtn, true);
    this.elements.noteTitle.disabled = true;
    this.elements.noteContent.disabled = true;
    this.elements.saveStatus.classList.remove('hidden');

    try {
      await safeAPI.notes.create({ title, content, category, tags });
      showMessage('笔记已保存！', 'success');
      this.modals.newNote.close();
      
      // 清空表单
      this.elements.noteTitle.value = '';
      this.elements.noteContent.value = '';
      if (this.elements.noteCategory) this.elements.noteCategory.value = '';
      if (this.elements.noteTags) this.elements.noteTags.value = '';
      
      await Promise.all([this.loadNotes(), this.loadStats()]);
    } catch (error) {
      // 错误已在API层处理
    } finally {
      // 还原UI状态
      this.elements.saveStatus.classList.add('hidden');
      setLoadingState(this.elements.saveNoteBtn, false);
      setLoadingState(this.elements.cancelBtn, false);
      this.elements.noteTitle.disabled = false;
      this.elements.noteContent.disabled = false;
    }
  }

  /**
   * 处理新建笔记AI优化
   */
  async handleNewOptimize() {
    // 检查登录状态
    if (!this.isLoggedIn) {
      showMessage('请先登录以使用AI功能', 'warning');
      return;
    }

    const content = this.elements.noteContent.value || '';
    if (!content.trim()) {
      showMessage('请先输入正文', 'error');
      return;
    }

    // 优先使用用户输入的提示词，如果为空则使用默认提示词
    const userPrompt = this.elements.newOptPrompt?.value.trim();
    const prompt = userPrompt || '帮助用户完善笔记文档，并整理归类总结';
    
    // 调试信息
    console.log('新建笔记 - 用户输入的提示词:', userPrompt);
    console.log('新建笔记 - 最终使用的提示词:', prompt);
    
    try {
      this.elements.newOptStatus.classList.remove('hidden');
      
      const data = await safeAPI.ai.optimize({ content, prompt });
      
      if (data.optimized) this.elements.noteContent.value = data.optimized;
      if (data.title) this.elements.noteTitle.value = data.title;
      if (data.category && this.elements.noteCategory) this.elements.noteCategory.value = data.category;
      if (data.tags && this.elements.noteTags) {
        this.elements.noteTags.value = Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags);
      }
      
      // 显示提示
      if (this.elements.newOptStatus) {
        const tagStr = Array.isArray(data.tags) ? data.tags.join(', ') : (typeof data.tags === 'string' ? data.tags : '');
        this.elements.newOptStatus.textContent = `已提取分类：${data.category || '（无）'}；标签：${tagStr || '（无）'}`;
        this.elements.newOptStatus.classList.remove('hidden');
        setTimeout(() => {
          this.elements.newOptStatus.classList.add('hidden');
        }, 2500);
      }
    } catch (error) {
      // 错误已在API层处理
    } finally {
      this.elements.newOptStatus.classList.add('hidden');
    }
  }

  /**
   * 处理AI优化
   */
  async handleOptimize() {
    // 检查登录状态
    if (!this.isLoggedIn) {
      showMessage('请先登录以使用AI功能', 'warning');
      return;
    }

    const content = this.currentViewRaw || '';
    if (!content.trim()) {
      showMessage('没有可优化的内容', 'error');
      return;
    }

    // 优先使用用户输入的提示词，如果为空则使用默认提示词
    const userPrompt = this.elements.optPrompt?.value.trim();
    const prompt = userPrompt || '帮助用户完善笔记文档，并整理归类总结';
    
    // 调试信息
    console.log('optPrompt元素:', this.elements.optPrompt);
    console.log('optPrompt值:', this.elements.optPrompt?.value);
    console.log('用户输入的提示词:', userPrompt);
    console.log('最终使用的提示词:', prompt);
    
    try {
      this.elements.optStatus.classList.remove('hidden');
      
      const data = await safeAPI.ai.optimize({ content, prompt });
      
      if (data.optimized) {
        this.setViewRaw(data.optimized);
        this.enterPreviewMode(false);
      }
      
      // 回填分类/标签
      if (data.category && this.elements.editCategory) this.elements.editCategory.value = data.category;
      if (data.tags && this.elements.editTags) {
        this.elements.editTags.value = Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags);
      }
      
      // 显示提示
      if (this.elements.optStatus) {
        const tagStr = Array.isArray(data.tags) ? data.tags.join(', ') : (typeof data.tags === 'string' ? data.tags : '');
        this.elements.optStatus.textContent = `已提取分类：${data.category || '（无）'}；标签：${tagStr || '（无）'}`;
        this.elements.optStatus.classList.remove('hidden');
        setTimeout(() => {
          this.elements.optStatus.classList.add('hidden');
        }, 2500);
      }
    } catch (error) {
      // 错误已在API层处理
    } finally {
      this.elements.optStatus.classList.add('hidden');
    }
  }

  /**
   * 处理保存优化结果
   */
  async handleSaveOptimized() {
    const noteId = this.elements.viewNoteModal.getAttribute('data-note-id');
    if (!noteId) {
      showMessage('未获取到笔记 ID，无法保存', 'error');
      return;
    }

    const title = (this.elements.editTitle?.value || this.elements.viewNoteModal.getAttribute('data-note-title') || '').trim();
    const category = (this.elements.editCategory?.value || '').trim();
    const tags = (this.elements.editTags?.value || '').trim();
    
    let content = this.currentViewRaw || '';
    if (this.elements.viewEditor && !this.elements.viewEditor.classList.contains('hidden')) {
      content = this.elements.viewEditor.value || '';
      this.currentViewRaw = content;
    }

    try {
      setLoadingState(this.elements.saveOptimizedBtn, true);
      
      await safeAPI.notes.update({ id: Number(noteId), title, content, category, tags });
      
      showMessage('已保存优化/编辑结果', 'success');
      await Promise.all([this.loadNotes(), this.loadStats()]);
      this.modals.viewNote.close();
    } catch (error) {
      // 错误已在API层处理
    } finally {
      setLoadingState(this.elements.saveOptimizedBtn, false);
    }
  }

  /**
   * 处理删除笔记
   */
  async handleDeleteNote() {
    const noteId = this.elements.viewNoteModal.getAttribute('data-note-id');
    if (!noteId) {
      showMessage('未获取到笔记 ID，无法删除', 'error');
      return;
    }

    if (!confirm('确定要删除这条笔记吗？此操作不可恢复。')) return;

    try {
      await safeAPI.notes.delete(noteId);
      showMessage('已删除', 'success');
      await Promise.all([this.loadNotes(), this.loadStats()]);
      this.modals.viewNote.close();
    } catch (error) {
      // 错误已在API层处理
    }
  }

  /**
   * 处理全屏AI优化
   */
  async handleFullscreenOptimize() {
    // 检查登录状态
    if (!this.isLoggedIn) {
      showMessage('请先登录以使用AI功能', 'warning');
      return;
    }

    const content = this.currentViewRaw || '';
    if (!content.trim()) {
      showMessage('没有可优化的内容', 'error');
      return;
    }

    // 优先使用用户输入的提示词，如果为空则使用默认提示词
    const userPrompt = this.elements.fullscreenOptPrompt?.value.trim();
    const prompt = userPrompt || '帮助用户完善笔记文档，并整理归类总结';
    
    // 调试信息
    console.log('全屏模式 - 用户输入的提示词:', userPrompt);
    console.log('全屏模式 - 最终使用的提示词:', prompt);
    
    try {
      this.elements.fullscreenOptStatus.classList.remove('hidden');
      
      const data = await safeAPI.ai.optimize({ content, prompt });
      
      if (data.optimized) {
        this.setViewRaw(data.optimized);
        this.enterFullscreenPreviewMode(false);
      }
      
      // 回填分类/标签
      if (data.category && this.elements.fullscreenEditCategory) {
        this.elements.fullscreenEditCategory.value = data.category;
      }
      if (data.tags && this.elements.fullscreenEditTags) {
        this.elements.fullscreenEditTags.value = Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags);
      }
      
      // 显示提示
      if (this.elements.fullscreenOptStatus) {
        const tagStr = Array.isArray(data.tags) ? data.tags.join(', ') : (typeof data.tags === 'string' ? data.tags : '');
        this.elements.fullscreenOptStatus.textContent = `已提取分类：${data.category || '（无）'}；标签：${tagStr || '（无）'}`;
        this.elements.fullscreenOptStatus.classList.remove('hidden');
        setTimeout(() => {
          this.elements.fullscreenOptStatus.classList.add('hidden');
        }, 2500);
      }
    } catch (error) {
      // 错误已在API层处理
    } finally {
      this.elements.fullscreenOptStatus.classList.add('hidden');
    }
  }

  /**
   * 处理全屏保存
   */
  async handleFullscreenSave() {
    const noteId = this.elements.fullscreenModal.getAttribute('data-note-id');
    if (!noteId) {
      showMessage('未获取到笔记 ID，无法保存', 'error');
      return;
    }

    const title = (this.elements.fullscreenEditTitle?.value || this.elements.fullscreenModal.getAttribute('data-note-title') || '').trim();
    const category = (this.elements.fullscreenEditCategory?.value || '').trim();
    const tags = (this.elements.fullscreenEditTags?.value || '').trim();
    
    let content = this.currentViewRaw || '';
    if (this.elements.fullscreenEditor && !this.elements.fullscreenEditor.classList.contains('hidden')) {
      content = this.elements.fullscreenEditor.value || '';
      this.currentViewRaw = content;
    }

    try {
      setLoadingState(this.elements.fullscreenSaveBtn, true);
      
      await safeAPI.notes.update({ id: Number(noteId), title, content, category, tags });
      
      showMessage('已保存优化/编辑结果', 'success');
      await Promise.all([this.loadNotes(), this.loadStats()]);
      this.closeFullscreenModal();
      this.modals.viewNote.close();
    } catch (error) {
      // 错误已在API层处理
    } finally {
      setLoadingState(this.elements.fullscreenSaveBtn, false);
    }
  }

  /**
   * 处理全屏删除
   */
  async handleFullscreenDelete() {
    const noteId = this.elements.fullscreenModal.getAttribute('data-note-id');
    if (!noteId) {
      showMessage('未获取到笔记 ID，无法删除', 'error');
      return;
    }

    if (!confirm('确定要删除这条笔记吗？此操作不可恢复。')) return;

    try {
      await safeAPI.notes.delete(noteId);
      showMessage('已删除', 'success');
      await Promise.all([this.loadNotes(), this.loadStats()]);
      this.closeFullscreenModal();
      this.modals.viewNote.close();
    } catch (error) {
      // 错误已在API层处理
    }
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new NoteApp();
});
