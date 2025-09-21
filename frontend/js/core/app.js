/**
 * 主应用类 - 新架构版本
 */
import { authAPI, notesAPI, statsAPI } from '../services/api.js';
import { aiService } from '../services/ai.js';
import { Note } from '../models/note.js';
import { NoteSearch, NoteFilter } from '../models/note.js';
import { Modal } from '../components/base/modal.js';
import { createCategoryAutocomplete, createTagAutocomplete } from '../components/autocomplete.js';
import { 
  getElementById, 
  addClass, 
  removeClass, 
  setTextContent, 
  setInnerHTML,
  showElement,
  hideElement 
} from '../utils/dom.js';
import { formatDate, formatTags } from '../utils/formatting.js';
import { preventDoubleClick, preventDoubleClickAI, preventDoubleClickSave } from '../utils/events.js';

export class App {
  constructor() {
    this.currentNotes = [];
    this.currentPage = 1;
    this.pageSize = 5;
    this.totalPages = 1;
    this.searchQuery = '';
    this.currentFilter = new NoteFilter();
    this.isLoggedIn = false;
    this.currentNoteId = null;
    
    // 模态框实例
    this.newNoteModal = null;
    this.viewNoteModal = null;
    this.fullscreenModal = null;
    
    // 自动完成实例
    this.categoryAutocomplete = null;
    this.tagAutocomplete = null;
    this.newCategoryAutocomplete = null;
    this.newTagAutocomplete = null;
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleNewNote = this.handleNewNote.bind(this);
    this.handleSaveNote = this.handleSaveNote.bind(this);
    this.handleSaveNewNote = this.handleSaveNewNote.bind(this);
    this.handleNewOptimize = this.handleNewOptimize.bind(this);
    this.handleNewAnalyze = this.handleNewAnalyze.bind(this);
    this.handleSaveOptimized = this.handleSaveOptimized.bind(this);
    this.handleOptimizeNote = this.handleOptimizeNote.bind(this);
    this.handleAnalyzeNote = this.handleAnalyzeNote.bind(this);
    this.handleFullscreenSave = this.handleFullscreenSave.bind(this);
    this.handleFullscreenOptimize = this.handleFullscreenOptimize.bind(this);
    this.handleFullscreenAnalyze = this.handleFullscreenAnalyze.bind(this);
    this.handleExitFullscreen = this.handleExitFullscreen.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleOptimize = this.handleOptimize.bind(this);
    this.handleDeleteNote = this.handleDeleteNote.bind(this);
    this.handleDeleteNoteFromModal = this.handleDeleteNoteFromModal.bind(this);
    this.handleDeleteNoteFromFullscreen = this.handleDeleteNoteFromFullscreen.bind(this);
    this.handleViewNote = this.handleViewNote.bind(this);
    this.handleFullscreen = this.handleFullscreen.bind(this);
    this.handleClearFilter = this.handleClearFilter.bind(this);
    this.handleCategoryFilter = this.handleCategoryFilter.bind(this);
    this.handleTagFilter = this.handleTagFilter.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.switchToEditMode = this.switchToEditMode.bind(this);
    this.switchToPreviewMode = this.switchToPreviewMode.bind(this);
    this.switchToFullscreenEditMode = this.switchToFullscreenEditMode.bind(this);
    this.switchToFullscreenPreviewMode = this.switchToFullscreenPreviewMode.bind(this);
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      console.log('🚀 初始化智能笔记管理系统 (新架构)');
      
      // 初始化模态框
      this.initModals();
      
      // 绑定事件
      this.bindEvents();
      
      // 加载初始数据
      await this.loadInitialData();
      
      console.log('✅ 应用初始化完成');
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      this.showError('应用初始化失败，请刷新页面重试');
    }
  }

  /**
   * 初始化模态框
   */
  initModals() {
    // 由于HTML中已经有静态模态框，这里不需要动态创建
    // 只需要绑定事件即可
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 登录表单
    const loginForm = getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin);
    }

    // 模型选择
    const modelSelect = getElementById('modelSelect');
    const customModelInput = getElementById('customModelInput');
    if (modelSelect && customModelInput) {
      modelSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
          showElement(customModelInput);
        } else {
          hideElement(customModelInput);
        }
      });
    }

    // 主界面按钮
    const logoutBtn = getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', preventDoubleClick(this.handleLogout, 2000));
    }

    const newNoteBtn = getElementById('newNoteBtn');
    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', preventDoubleClick(this.handleNewNote, 300));
    }

    const searchInput = getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch);
    }

    const clearFilterBtn = getElementById('clearFilterBtn');
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', preventDoubleClick(this.handleClearFilter, 300));
    }

    // 新建笔记模态框事件
    this.bindNewNoteModalEvents();
    
    // 查看笔记模态框事件
    this.bindViewNoteModalEvents();
    
    // 全屏模态框事件
    this.bindFullscreenModalEvents();
  }

  /**
   * 绑定模态框事件
   */
  bindModalEvents() {
    // 新建笔记模态框事件
    this.bindNewNoteModalEvents();
    
    // 查看笔记模态框事件
    this.bindViewNoteModalEvents();
    
    // 全屏模态框事件
    this.bindFullscreenModalEvents();
  }

  /**
   * 绑定新建笔记模态框事件
   */
  bindNewNoteModalEvents() {
    // 新建笔记按钮
    const newNoteBtn = getElementById('newNoteBtn');
    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', preventDoubleClick(this.handleNewNote, 300));
    }

    // 取消按钮
    const cancelBtn = getElementById('cancelBtn');
    const cancelBtn2 = getElementById('cancelBtn2');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', preventDoubleClick(() => this.hideModal('newNoteModal'), 300));
    }
    if (cancelBtn2) {
      cancelBtn2.addEventListener('click', preventDoubleClick(() => this.hideModal('newNoteModal'), 300));
    }

    // 保存按钮
    const saveNoteBtn = getElementById('saveNoteBtn');
    if (saveNoteBtn) {
      saveNoteBtn.addEventListener('click', preventDoubleClickSave(this.handleSaveNewNote, 2000));
    }

    // 分析标题分类按钮
    const newAnalyzeBtn = getElementById('newAnalyzeBtn');
    if (newAnalyzeBtn) {
      newAnalyzeBtn.addEventListener('click', preventDoubleClickAI(this.handleNewAnalyze, 1000));
    }

    // AI优化重写按钮
    const newOptimizeBtn = getElementById('newOptimizeCombinedBtn');
    if (newOptimizeBtn) {
      newOptimizeBtn.addEventListener('click', preventDoubleClickAI(this.handleNewOptimize, 1000));
    }

    // 新建笔记预览切换按钮
    const toggleNewPreviewBtn = getElementById('toggleNewPreviewBtn');
    const noteContent = getElementById('noteContent');
    const notePreview = getElementById('notePreview');
    
    if (toggleNewPreviewBtn && noteContent && notePreview) {
      toggleNewPreviewBtn.addEventListener('click', () => {
        const isHidden = notePreview.classList.contains('hidden');
        if (isHidden) {
          // 显示预览
          notePreview.innerHTML = this.renderMarkdown(noteContent.value || '');
          removeClass(notePreview, 'hidden');
          setTextContent(toggleNewPreviewBtn, '隐藏预览');
        } else {
          // 隐藏预览
          addClass(notePreview, 'hidden');
          setTextContent(toggleNewPreviewBtn, '预览 Markdown');
        }
      });

      // 添加实时预览同步监听器
      noteContent.addEventListener('input', () => {
        if (!notePreview.classList.contains('hidden')) {
          notePreview.innerHTML = this.renderMarkdown(noteContent.value || '');
        }
      });
    }
  }

  /**
   * 绑定查看笔记模态框事件
   */
  bindViewNoteModalEvents() {
    // 关闭按钮
    const closeViewBtn = getElementById('closeViewBtn');
    if (closeViewBtn) {
      closeViewBtn.addEventListener('click', preventDoubleClick(() => this.hideModal('viewNoteModal'), 300));
    }

    // 全屏按钮
    const fullscreenBtn = getElementById('fullscreenBtn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', preventDoubleClick(this.handleFullscreen, 300));
    }

    // 预览/编辑模式切换按钮
    const toggleEditBtn = getElementById('toggleEditBtn');
    const togglePreviewBtn = getElementById('togglePreviewBtn');
    if (toggleEditBtn) {
      toggleEditBtn.addEventListener('click', preventDoubleClick(() => this.switchToEditMode(), 300));
    }
    if (togglePreviewBtn) {
      togglePreviewBtn.addEventListener('click', preventDoubleClick(() => this.switchToPreviewMode(), 300));
    }

    // 保存按钮
    const saveOptimizedBtn = getElementById('saveOptimizedBtn');
    if (saveOptimizedBtn) {
      saveOptimizedBtn.addEventListener('click', preventDoubleClickSave(this.handleSaveOptimized, 2000));
    }

    // 删除按钮
    const deleteNoteBtn = getElementById('deleteNoteBtn');
    if (deleteNoteBtn) {
      deleteNoteBtn.addEventListener('click', preventDoubleClick(() => this.handleDeleteNoteFromModal(), 2000));
    }

    // 分析标题分类按钮
    const analyzeBtn = getElementById('analyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', preventDoubleClickAI(this.handleAnalyzeNote, 1000));
    }

    // AI优化重写按钮
    const optimizeBtn = getElementById('optimizeBtn');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', preventDoubleClickAI(this.handleOptimizeNote, 1000));
    }
  }

  /**
   * 绑定全屏模态框事件
   */
  bindFullscreenModalEvents() {
    // 退出全屏按钮
    const exitFullscreenBtn = getElementById('exitFullscreenBtn');
    if (exitFullscreenBtn) {
      exitFullscreenBtn.addEventListener('click', preventDoubleClick(this.handleExitFullscreen, 300));
    }

    // 全屏预览/编辑模式切换按钮
    const fullscreenToggleEditBtn = getElementById('fullscreenToggleEditBtn');
    const fullscreenTogglePreviewBtn = getElementById('fullscreenTogglePreviewBtn');
    if (fullscreenToggleEditBtn) {
      fullscreenToggleEditBtn.addEventListener('click', preventDoubleClick(() => this.switchToFullscreenEditMode(), 300));
    }
    if (fullscreenTogglePreviewBtn) {
      fullscreenTogglePreviewBtn.addEventListener('click', preventDoubleClick(() => this.switchToFullscreenPreviewMode(), 300));
    }

    // 全屏保存按钮
    const fullscreenSaveBtn = getElementById('fullscreenSaveBtn');
    if (fullscreenSaveBtn) {
      fullscreenSaveBtn.addEventListener('click', preventDoubleClickSave(this.handleFullscreenSave, 2000));
    }

    // 全屏删除按钮
    const fullscreenDeleteBtn = getElementById('fullscreenDeleteBtn');
    if (fullscreenDeleteBtn) {
      fullscreenDeleteBtn.addEventListener('click', preventDoubleClick(() => this.handleDeleteNoteFromFullscreen(), 2000));
    }

    // 全屏分析标题分类按钮
    const fullscreenAnalyzeBtn = getElementById('fullscreenAnalyzeBtn');
    if (fullscreenAnalyzeBtn) {
      fullscreenAnalyzeBtn.addEventListener('click', preventDoubleClickAI(this.handleFullscreenAnalyze, 1000));
    }

    // 全屏AI优化重写按钮
    const fullscreenOptimizeBtn = getElementById('fullscreenOptimizeBtn');
    if (fullscreenOptimizeBtn) {
      fullscreenOptimizeBtn.addEventListener('click', preventDoubleClickAI(this.handleFullscreenOptimize, 1000));
    }
  }

  /**
   * 加载初始数据
   */
  async loadInitialData() {
    try {
      // 检查登录状态
      await this.checkLoginStatus();
      
      // 加载笔记列表
      await this.loadNotes();
      
      // 加载统计数据
      await this.loadStats();
      
      // 初始化自动完成功能
      await this.initAutocomplete();
      
      // 清空所有AI优化重写提示词输入框
      this.clearAIOptimizationPrompts();
      
      // 初始化时隐藏过滤状态
      this.hideActiveFilter();
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  }

  /**
   * 初始化自动完成功能（恢复之前版本的实现）
   */
  async initAutocomplete() {
    try {
      // 从API获取分类和标签数据
      const categories = await statsAPI.getCategories();
      const tags = await statsAPI.getTags();
      
      console.log('📊 从API获取到的分类数据:', categories);
      console.log('🏷️ 从API获取到的标签数据:', tags);
      
      // 缓存数据，供自动完成使用
      this.cachedCategories = categories;
      this.cachedTags = tags;
      
      // 绑定模糊建议到输入框（使用之前版本的实现）
      this.attachFuzzySuggest(getElementById('noteCategory'), () => this.cachedCategories, false);
      this.attachFuzzySuggest(getElementById('editCategory'), () => this.cachedCategories, false);
      this.attachFuzzySuggest(getElementById('noteTags'), () => this.cachedTags, true);
      this.attachFuzzySuggest(getElementById('editTags'), () => this.cachedTags, true);
      
      console.log('✅ 自动完成功能初始化完成（使用之前版本实现）');
    } catch (error) {
      console.error('❌ 自动完成功能初始化失败:', error);
      // 如果API调用失败，尝试从统计数据获取（备用方案）
      try {
        const categories = this.getCategoriesFromStats();
        const tags = this.getTagsFromStats();
        
        console.log('📊 使用备用方案获取到的分类数据:', categories);
        console.log('🏷️ 使用备用方案获取到的标签数据:', tags);
        
        // 缓存数据，供自动完成使用
        this.cachedCategories = categories;
        this.cachedTags = tags;
        
        // 绑定模糊建议到输入框
        this.attachFuzzySuggest(getElementById('noteCategory'), () => this.cachedCategories, false);
        this.attachFuzzySuggest(getElementById('editCategory'), () => this.cachedCategories, false);
        this.attachFuzzySuggest(getElementById('noteTags'), () => this.cachedTags, true);
        this.attachFuzzySuggest(getElementById('editTags'), () => this.cachedTags, true);
        
        console.log('✅ 自动完成功能初始化完成（备用方案）');
      } catch (fallbackError) {
        console.error('❌ 备用方案也失败了:', fallbackError);
      }
    }
  }
  
  /**
   * 从统计数据中获取分类列表
   */
  getCategoriesFromStats() {
    try {
      const statsContainer = getElementById('categoryCloud');
      if (!statsContainer) return [];
      
      const categoryButtons = statsContainer.querySelectorAll('button');
      return Array.from(categoryButtons).map(btn => {
        const text = btn.textContent || '';
        const match = text.match(/^(.+?)\s*\((\d+)\)$/);
        return match ? match[1].trim() : text.trim();
      }).filter(name => name);
    } catch (error) {
      console.error('获取分类列表失败:', error);
      return [];
    }
  }
  
  /**
   * 从统计数据中获取标签列表
   */
  getTagsFromStats() {
    try {
      const statsContainer = getElementById('tagCloud');
      if (!statsContainer) return [];
      
      const tagButtons = statsContainer.querySelectorAll('button');
      return Array.from(tagButtons).map(btn => {
        const text = btn.textContent || '';
        const match = text.match(/^(.+?)\s*\((\d+)\)$/);
        return match ? match[1].trim() : text.trim();
      }).filter(name => name);
    } catch (error) {
      console.error('获取标签列表失败:', error);
      return [];
    }
  }
  
  
  /**
   * 更新自动完成数据源
   */
  updateAutocompleteData() {
    const categories = this.getCategoriesFromStats();
    const tags = this.getTagsFromStats();
    
    // 更新新建笔记的自动完成
    if (this.newCategoryAutocomplete) {
      this.newCategoryAutocomplete.updateDataSource(categories);
    }
    if (this.newTagAutocomplete) {
      this.newTagAutocomplete.updateDataSource(tags);
    }
    
    // 更新编辑笔记的自动完成
    if (this.categoryAutocomplete) {
      this.categoryAutocomplete.updateDataSource(categories);
    }
    if (this.tagAutocomplete) {
      this.tagAutocomplete.updateDataSource(tags);
    }
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      const config = await authAPI.getConfig();
      this.isLoggedIn = config.logged_in;
      
      if (this.isLoggedIn) {
        this.showMainInterface();
        // 显示配置信息
        this.updateConfigDisplay(config);
      } else {
        this.showLoginInterface();
        // 隐藏配置信息
        this.hideConfigDisplay();
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      this.showLoginInterface();
      this.hideConfigDisplay();
    }
  }

  /**
   * 显示登录界面
   */
  showLoginInterface() {
    const apiConfig = getElementById('apiConfig');
    const mainApp = getElementById('mainApp');
    
    if (apiConfig) showElement(apiConfig);
    if (mainApp) hideElement(mainApp);
  }

  /**
   * 显示主界面
   */
  showMainInterface() {
    const apiConfig = getElementById('apiConfig');
    const mainApp = getElementById('mainApp');
    
    if (apiConfig) hideElement(apiConfig);
    if (mainApp) showElement(mainApp);
  }

  /**
   * 更新配置信息显示
   */
  updateConfigDisplay(config) {
    const configInfo = getElementById('configInfo');
    const currentApiUrl = getElementById('currentApiUrl');
    const currentModel = getElementById('currentModel');
    
    if (configInfo && currentApiUrl && currentModel) {
      // 更新API地址显示
      currentApiUrl.textContent = config.api_url || '未配置';
      
      // 更新模型显示
      currentModel.textContent = config.default_model || '未配置';
      
      // 显示配置信息区域
      showElement(configInfo);
    }
  }

  /**
   * 隐藏配置信息显示
   */
  hideConfigDisplay() {
    const configInfo = getElementById('configInfo');
    if (configInfo) {
      hideElement(configInfo);
    }
  }

  /**
   * 处理登录
   */
  async handleLogin(e) {
    e.preventDefault();
    
    try {
      const apiUrl = getElementById('apiUrl')?.value?.trim();
      const apiKey = getElementById('apiKey')?.value?.trim();
      const modelSelect = getElementById('modelSelect');
      const customModelInput = getElementById('customModelInput');
      
      let model = modelSelect?.value || 'Qwen3-Next-80B-A3B-Instruct';
      if (model === 'custom') {
        model = customModelInput?.value?.trim() || 'Qwen3-Next-80B-A3B-Instruct';
      }
      
      if (!apiUrl || !apiKey) {
        this.showError('请填写完整的API配置信息');
        return;
      }
      
      await authAPI.login({ api_url: apiUrl, api_key: apiKey, model });
      this.isLoggedIn = true;
      this.showMainInterface();
      this.showSuccess('登录成功');
      
      // 获取配置信息并显示
      const config = await authAPI.getConfig();
      this.updateConfigDisplay(config);
      
      // 重新加载数据
      await this.loadNotes();
      await this.loadStats();
    } catch (error) {
      console.error('登录失败:', error);
      this.showError(error.message || '登录失败');
    }
  }

  /**
   * 处理退出登录
   */
  async handleLogout() {
    try {
      await authAPI.logout();
      this.isLoggedIn = false;
      this.showLoginInterface();
      this.hideConfigDisplay();
      this.showSuccess('已退出登录');
      
      // 清空数据
      this.currentNotes = [];
      this.currentPage = 1;
      this.searchQuery = '';
      this.currentFilter.clear();
      
      // 清空界面
      this.renderNotes([]);
      this.renderStats({ categories: [], tags: [] });
      
      // 隐藏过滤状态
      this.hideActiveFilter();
    } catch (error) {
      console.error('退出登录失败:', error);
      this.showError(error.message || '退出登录失败');
    }
  }

  /**
   * 清空新建笔记输入内容
   */
  clearNewNoteInputs() {
    // 清空新建笔记模态框中的所有输入字段
    const noteTitle = getElementById('noteTitle');
    const noteContent = getElementById('noteContent');
    const noteCategory = getElementById('noteCategory');
    const noteTags = getElementById('noteTags');
    const newOptPrompt = getElementById('newOptPrompt');
    const notePreview = getElementById('notePreview');

    if (noteTitle) noteTitle.value = '';
    if (noteContent) noteContent.value = '';
    if (noteCategory) noteCategory.value = '';
    if (noteTags) noteTags.value = '';
    if (newOptPrompt) newOptPrompt.value = '';
    
    // 清空预览内容
    if (notePreview) {
      notePreview.innerHTML = '';
      addClass(notePreview, 'hidden');
    }
  }

  /**
   * 清空所有AI优化重写提示词输入框
   */
  clearAIOptimizationPrompts() {
    // 清空新建笔记模态框的AI优化重写提示词
    const newOptPrompt = getElementById('newOptPrompt');
    if (newOptPrompt) newOptPrompt.value = '';

    // 清空预览笔记模态框的AI优化重写提示词
    const optPrompt = getElementById('optPrompt');
    if (optPrompt) optPrompt.value = '';

    // 清空全屏模态框的AI优化重写提示词
    const fullscreenOptPrompt = getElementById('fullscreenOptPrompt');
    if (fullscreenOptPrompt) fullscreenOptPrompt.value = '';
  }

  /**
   * 处理新建笔记
   */
  handleNewNote() {
    // 先清空所有输入内容
    this.clearNewNoteInputs();
    // 然后显示模态框
    this.showModal('newNoteModal');
  }

  /**
   * 显示模态框
   */
  showModal(modalId) {
    const modal = getElementById(modalId);
    if (modal) {
      removeClass(modal, 'hidden');
    }
  }

  /**
   * 隐藏模态框
   */
  hideModal(modalId) {
    const modal = getElementById(modalId);
    if (modal) {
      addClass(modal, 'hidden');
    }
  }

  /**
   * 处理保存笔记
   */
  async handleSaveNote(noteData) {
    try {
      const note = new Note(noteData);
      const validation = note.validate();
      
      if (!validation.isValid) {
        this.showError(validation.errors.join(', '));
        return;
      }
      
      if (note.id) {
        // 更新笔记
        await notesAPI.update(note.toApiFormat());
        this.showSuccess('笔记更新成功');
      } else {
        // 创建笔记
        await notesAPI.create(note.toApiFormat());
        this.showSuccess('笔记创建成功');
      }
      
      // 关闭模态框
      this.hideModal('newNoteModal');
      this.hideModal('viewNoteModal');
      this.hideModal('fullscreenModal');
      
      // 重新加载数据
      await this.loadNotes();
      await this.loadStats();
    } catch (error) {
      console.error('保存笔记失败:', error);
      this.showError(error.message || '保存笔记失败');
    }
  }

  /**
   * 处理搜索
   */
  async handleSearch(e) {
    this.searchQuery = e.target.value.trim();
    this.currentPage = 1;
    
    // 如果有搜索内容，清除过滤状态显示
    if (this.searchQuery) {
      this.hideActiveFilter();
      this.currentFilter.clear();
    }
    
    await this.loadNotes();
  }

  /**
   * 处理AI优化重写
   */
  async handleOptimize(content, prompt, callback) {
    try {
      if (!this.isLoggedIn) {
        this.showError('请先登录');
        return;
      }
      
      const result = await aiService.optimizeText(content, prompt);
      
      if (callback && typeof callback === 'function') {
        callback(result);
      }
      
      return result;
    } catch (error) {
      console.error('AI优化重写失败:', error);
      
      // 特殊处理不同类型的错误
      if (error.message && error.message.includes('AI优化重写正在进行中')) {
        console.log('AI优化重写正在进行中，显示友好提示');
        this.showInfo('AI优化重写正在进行中，请稍候...');
      } else if (error.message && error.message.includes('请求已取消')) {
        console.log('请求被取消，不显示错误信息');
        // 不显示错误信息，因为这是正常的去重行为
      } else if (error.name === 'AbortError') {
        console.log('请求被中止，不显示错误信息');
        // 不显示错误信息，因为这是正常的去重行为
      } else {
        this.showError(error.message || 'AI优化重写失败');
      }
    }
  }

  /**
   * 重置AI优化重写状态（用于调试和错误恢复）
   */
  resetAIOptimizationState() {
    aiService.resetOptimizationState();
    console.log('AI优化重写状态已重置');
  }

  /**
   * 处理删除笔记
   */
  async handleDeleteNote(noteId) {
    try {
      // 如果没有传入noteId，使用当前笔记ID
      const idToDelete = noteId || this.currentNoteId;
      
      if (!idToDelete) {
        this.showError('无法获取要删除的笔记ID');
        return;
      }

      if (!confirm('确定要删除这条笔记吗？')) {
        return;
      }

      await notesAPI.delete(idToDelete);
      this.showSuccess('笔记删除成功');

      // 关闭模态框
      this.hideModal('viewNoteModal');
      this.hideModal('fullscreenModal');

      // 清空当前笔记ID
      this.currentNoteId = null;

      // 重新加载数据
      await this.loadNotes();
      await this.loadStats();
    } catch (error) {
      console.error('删除笔记失败:', error);
      
      // 处理不同类型的错误
      let errorMessage = '删除笔记失败';
      
      if (error.message) {
        if (error.message.includes('404') || error.message.includes('不存在')) {
          errorMessage = '笔记不存在或已被删除';
        } else if (error.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络设置';
        } else {
          errorMessage = error.message;
        }
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      
      this.showError(errorMessage);
    }
  }

  /**
   * 从普通模态框删除笔记
   */
  async handleDeleteNoteFromModal() {
    await this.handleDeleteNote();
  }

  /**
   * 从全屏模态框删除笔记
   */
  async handleDeleteNoteFromFullscreen() {
    await this.handleDeleteNote();
  }

  /**
   * 处理查看笔记
   */
  async handleViewNote(noteId) {
    try {
      const noteData = await notesAPI.getById(noteId);
      const note = new Note(noteData);

      // 显示笔记详情
      this.showNoteInModal(note);
    } catch (error) {
      console.error('获取笔记失败:', error);
      this.showError(error.message || '获取笔记失败');
    }
  }

  /**
   * 处理全屏显示
   */
  handleFullscreen() {
    // 同步数据到全屏模态框
    this.syncDataToFullscreen();
    
    // 重置全屏模态框为预览模式
    this.resetFullscreenToPreviewMode();
    
    this.showModal('fullscreenModal');
  }

  /**
   * 处理清除过滤
   */
  async handleClearFilter() {
    this.currentFilter.clear();
    this.searchQuery = '';
    this.currentPage = 1;
    
    const searchInput = getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
    }
    
    // 隐藏过滤状态显示
    this.hideActiveFilter();
    
    await this.loadNotes();
    this.showSuccess('已清除过滤条件');
  }

  /**
   * 处理分类过滤
   */
  async handleCategoryFilter(category) {
    this.currentFilter.setCategory(category);
    this.currentPage = 1;
    
    // 显示过滤状态
    this.showActiveFilter('分类', category);
    
    await this.loadNotes();
  }

  /**
   * 处理标签过滤
   */
  async handleTagFilter(tag) {
    this.currentFilter.setTag(tag);
    this.currentPage = 1;
    
    // 显示过滤状态
    this.showActiveFilter('标签', tag);
    
    await this.loadNotes();
  }

  /**
   * 处理分页变化
   */
  async handlePageChange(page) {
    this.currentPage = page;
    await this.loadNotes();
  }

  /**
   * 加载笔记列表
   */
  async loadNotes() {
    try {
      let notes = [];
      
      if (this.searchQuery) {
        notes = await notesAPI.search(this.searchQuery);
      } else if (this.currentFilter.isActive) {
        const filterType = this.currentFilter.getFilterType();
        const filterValue = this.currentFilter.getFilterValue();
        
        if (filterType === 'category') {
          notes = await notesAPI.getByCategory(filterValue);
        } else if (filterType === 'tag') {
          notes = await notesAPI.getByTag(filterValue);
        }
      } else {
        notes = await notesAPI.getAll();
      }
      
      this.currentNotes = notes.map(note => new Note(note));
      this.totalPages = Math.ceil(this.currentNotes.length / this.pageSize);
      
      this.renderNotes(this.currentNotes);
      this.renderPagination();
    } catch (error) {
      console.error('加载笔记失败:', error);
      this.showError(error.message || '加载笔记失败');
    }
  }

  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const stats = await statsAPI.getStats();
      this.renderStats(stats);
      
      // 更新自动完成数据源
      this.updateAutocompleteData();
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }

  /**
   * 渲染笔记列表
   */
  renderNotes(notes) {
    const notesList = getElementById('noteList');
    if (!notesList) return;
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const pageNotes = notes.slice(startIndex, endIndex);
    
    if (pageNotes.length === 0) {
      setInnerHTML(notesList, '<div class="text-center text-gray-500 py-8">暂无笔记</div>');
      return;
    }
    
    const notesHtml = pageNotes.map(note => `
      <div class="note-item bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
           onclick="app.handleViewNote(${note.id})">
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-lg font-semibold text-gray-800 truncate">${note.title}</h3>
          <span class="text-sm text-gray-500">${note.getFormattedCreatedAt()}</span>
        </div>
        <div class="flex flex-wrap gap-2 mb-2">
          <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${note.category}</span>
          ${note.tags.map(tag => `<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">${tag}</span>`).join('')}
        </div>
        <p class="text-gray-600 text-sm line-clamp-2">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
      </div>
    `).join('');
    
    setInnerHTML(notesList, notesHtml);
  }

  /**
   * 渲染分页
   */
  renderPagination() {
    const pagination = getElementById('pagination');
    if (!pagination) return;
    
    if (this.totalPages <= 1) {
      setInnerHTML(pagination, '');
      return;
    }
    
    let paginationHtml = '<div class="flex justify-center items-center space-x-2">';
    
    // 上一页
    if (this.currentPage > 1) {
      paginationHtml += `<button onclick="app.handlePageChange(${this.currentPage - 1})" 
                              class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">上一页</button>`;
    }
    
    // 页码
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === this.currentPage) {
        paginationHtml += `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`;
      } else {
        paginationHtml += `<button onclick="app.handlePageChange(${i})" 
                                class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">${i}</button>`;
      }
    }
    
    // 下一页
    if (this.currentPage < this.totalPages) {
      paginationHtml += `<button onclick="app.handlePageChange(${this.currentPage + 1})" 
                              class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">下一页</button>`;
    }
    
    paginationHtml += '</div>';
    setInnerHTML(pagination, paginationHtml);
  }

  /**
   * 渲染统计数据
   */
  renderStats(stats) {
    this.renderCategories(stats.categories || []);
    this.renderTags(stats.tags || []);
  }

  /**
   * 渲染分类统计
   */
  renderCategories(categories) {
    const categoriesContainer = getElementById('catCloud');
    if (!categoriesContainer) return;
    
    const categoriesHtml = categories.slice(0, 20).map(cat => `
      <button onclick="app.handleCategoryFilter('${cat.name}')" 
              class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors">
        ${cat.name} (${cat.count})
      </button>
    `).join('');
    
    setInnerHTML(categoriesContainer, categoriesHtml);
  }

  /**
   * 渲染标签统计
   */
  renderTags(tags) {
    const tagsContainer = getElementById('tagCloud');
    if (!tagsContainer) return;
    
    const tagsHtml = tags.slice(0, 30).map(tag => `
      <button onclick="app.handleTagFilter('${tag.name}')" 
              class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full hover:bg-green-200 transition-colors">
        ${tag.name} (${tag.count})
      </button>
    `).join('');
    
    setInnerHTML(tagsContainer, tagsHtml);
  }

  /**
   * 在模态框中显示笔记
   */
  showNoteInModal(note) {
    // 存储当前笔记ID
    this.currentNoteId = note.id;

    // 更新模态框标题
    const viewTitle = getElementById('viewTitle');
    if (viewTitle) {
      viewTitle.textContent = note.title;
    }

    // 更新编辑表单字段
    const editTitle = getElementById('editTitle');
    const editCategory = getElementById('editCategory');
    const editTags = getElementById('editTags');
    const viewEditor = getElementById('viewEditor');
    const viewPreview = getElementById('viewPreview');

    if (editTitle) editTitle.value = note.title;
    if (editCategory) editCategory.value = note.category;
    if (editTags) editTags.value = note.getTagsString();
    if (viewEditor) viewEditor.value = note.content;

    // 渲染预览
    if (viewPreview) {
      viewPreview.innerHTML = this.renderMarkdown(note.content);
    }

    // 重置为预览模式
    this.resetToPreviewMode();

    // 显示预览模态框
    this.showModal('viewNoteModal');
  }

  /**
   * 渲染Markdown内容
   */
  renderMarkdown(content) {
    if (typeof marked !== 'undefined') {
      return marked.parse(content);
    }
    return content.replace(/\n/g, '<br>');
  }

  /**
   * 显示成功消息
   */
  showSuccess(message) {
    // 这里可以实现一个全局的消息提示组件
    console.log('✅', message);
  }

  /**
   * 显示信息消息
   */
  showInfo(message) {
    // 这里可以实现一个全局的消息提示组件
    console.log('ℹ️', message);
  }

  /**
   * 显示错误消息
   */
  showError(message) {
    // 这里可以实现一个全局的消息提示组件
    console.error('❌', message);
    alert(message); // 临时使用alert，后续可以替换为更好的UI组件
  }

  /**
   * 处理保存新建笔记
   */
  async handleSaveNewNote() {
    try {
      const title = getElementById('noteTitle')?.value?.trim();
      const content = getElementById('noteContent')?.value?.trim();
      const category = getElementById('noteCategory')?.value?.trim();
      const tags = getElementById('noteTags')?.value?.trim();

      if (!title || !content) {
        this.showError('请填写标题和内容');
        return;
      }

      const noteData = {
        title,
        content,
        category: category || '其他',
        tags: tags || '未分类'
      };

      await this.handleSaveNote(noteData);
    } catch (error) {
      console.error('保存新建笔记失败:', error);
      this.showError(error.message || '保存失败');
    }
  }

  /**
   * 处理新建笔记AI优化重写（需要用户输入提示词）
   */
  async handleNewOptimize() {
    try {
      const content = getElementById('noteContent')?.value?.trim();
      const prompt = getElementById('newOptPrompt')?.value?.trim();

      if (!content) {
        this.showError('请先输入笔记内容');
        return;
      }

      if (!prompt) {
        this.showError('AI优化重写功能需要输入提示词');
        return;
      }

      // AI优化重写模式：只更新文本内容，保持标题、分类、标签不变
      const result = await this.handleOptimize(content, prompt, (result) => {
        if (result.optimized) {
          const contentInput = getElementById('noteContent');
          if (contentInput) contentInput.value = result.optimized;
          
          // 同步更新新建笔记的预览内容
          const notePreview = getElementById('notePreview');
          if (notePreview && !notePreview.classList.contains('hidden')) {
            notePreview.innerHTML = this.renderMarkdown(result.optimized);
          }
        }
      });

      this.showSuccess('AI优化重写完成');
    } catch (error) {
      console.error('AI优化重写失败:', error);
      this.showError(error.message || 'AI优化重写失败');
    }
  }

  /**
   * 处理新建笔记分析标题分类（等同于无提示词的AI优化重写）
   */
  async handleNewAnalyze() {
    try {
      const content = getElementById('noteContent')?.value?.trim();

      if (!content) {
        this.showError('请先输入笔记内容');
        return;
      }

      // 分析标题分类等同于无提示词的AI优化重写，使用默认提示词
      const result = await this.handleOptimize(content, null, (result) => {
        // 使用默认提示词：更新所有字段（标题、分类、标签、内容）
        if (result.title) {
          const titleInput = getElementById('noteTitle');
          if (titleInput) titleInput.value = result.title;
        }
        if (result.category) {
          const categoryInput = getElementById('noteCategory');
          if (categoryInput) categoryInput.value = result.category;
        }
        if (result.tags) {
          const tagsInput = getElementById('noteTags');
          if (tagsInput) tagsInput.value = Array.isArray(result.tags) ? result.tags.join(', ') : result.tags;
        }
        if (result.optimized) {
          const contentInput = getElementById('noteContent');
          if (contentInput) contentInput.value = result.optimized;
          
          // 同步更新新建笔记的预览内容
          const notePreview = getElementById('notePreview');
          if (notePreview && !notePreview.classList.contains('hidden')) {
            notePreview.innerHTML = this.renderMarkdown(result.optimized);
          }
        }
      });

      this.showSuccess('分析标题分类完成');
    } catch (error) {
      console.error('分析标题分类失败:', error);
      this.showError(error.message || '分析标题分类失败');
    }
  }

  /**
   * 处理保存优化后的笔记
   */
  async handleSaveOptimized() {
    try {
      const editTitle = getElementById('editTitle')?.value?.trim();
      const editCategory = getElementById('editCategory')?.value?.trim();
      const editTags = getElementById('editTags')?.value?.trim();
      const viewEditor = getElementById('viewEditor')?.value?.trim();

      if (!editTitle || !viewEditor) {
        this.showError('请填写标题和内容');
        return;
      }

      // 获取当前笔记ID（需要从模态框数据中获取）
      const noteId = this.currentNoteId;
      if (!noteId) {
        this.showError('无法获取笔记ID');
        return;
      }

      const noteData = {
        id: noteId,
        title: editTitle,
        content: viewEditor,
        category: editCategory || '其他',
        tags: editTags || '未分类'
      };

      await this.handleSaveNote(noteData);
    } catch (error) {
      console.error('保存优化后笔记失败:', error);
      this.showError(error.message || '保存失败');
    }
  }

  /**
   * 处理笔记AI优化重写（需要用户输入提示词）
   */
  async handleOptimizeNote() {
    try {
      const content = getElementById('viewEditor')?.value?.trim();
      const prompt = getElementById('optPrompt')?.value?.trim();

      if (!content) {
        this.showError('请先输入笔记内容');
        return;
      }

      if (!prompt) {
        this.showError('AI优化重写功能需要输入提示词');
        return;
      }

      // AI优化重写模式：只更新文本内容，保持标题、分类、标签不变
      const result = await this.handleOptimize(content, prompt, (result) => {
        if (result.optimized) {
          const contentInput = getElementById('viewEditor');
          if (contentInput) contentInput.value = result.optimized;
          
          // 同步更新预览内容
          const viewPreview = getElementById('viewPreview');
          if (viewPreview) {
            viewPreview.innerHTML = this.renderMarkdown(result.optimized);
          }
        }
      });

      this.showSuccess('AI优化重写完成');
    } catch (error) {
      console.error('AI优化重写失败:', error);
      this.showError(error.message || 'AI优化重写失败');
    }
  }

  /**
   * 处理笔记分析标题分类（等同于无提示词的AI优化重写）
   */
  async handleAnalyzeNote() {
    try {
      const content = getElementById('viewEditor')?.value?.trim();

      if (!content) {
        this.showError('请先输入笔记内容');
        return;
      }

      // 分析标题分类等同于无提示词的AI优化重写，使用默认提示词
      const result = await this.handleOptimize(content, null, (result) => {
        // 使用默认提示词：更新所有字段（标题、分类、标签、内容）
        if (result.title) {
          const titleInput = getElementById('editTitle');
          if (titleInput) titleInput.value = result.title;
        }
        if (result.category) {
          const categoryInput = getElementById('editCategory');
          if (categoryInput) categoryInput.value = result.category;
        }
        if (result.tags) {
          const tagsInput = getElementById('editTags');
          if (tagsInput) tagsInput.value = Array.isArray(result.tags) ? result.tags.join(', ') : result.tags;
        }
        if (result.optimized) {
          const contentInput = getElementById('viewEditor');
          if (contentInput) contentInput.value = result.optimized;
          
          // 同步更新预览内容
          const viewPreview = getElementById('viewPreview');
          if (viewPreview) {
            viewPreview.innerHTML = this.renderMarkdown(result.optimized);
          }
        }
      });

      this.showSuccess('分析标题分类完成');
    } catch (error) {
      console.error('分析标题分类失败:', error);
      this.showError(error.message || '分析标题分类失败');
    }
  }

  /**
   * 处理退出全屏
   */
  handleExitFullscreen() {
    this.hideModal('fullscreenModal');
  }

  /**
   * 处理全屏保存
   */
  async handleFullscreenSave() {
    try {
      const title = getElementById('fullscreenEditTitle')?.value?.trim();
      const content = getElementById('fullscreenEditor')?.value?.trim();
      const category = getElementById('fullscreenEditCategory')?.value?.trim();
      const tags = getElementById('fullscreenEditTags')?.value?.trim();

      if (!title || !content) {
        this.showError('请填写标题和内容');
        return;
      }

      // 获取当前笔记ID
      const noteId = this.currentNoteId;
      if (!noteId) {
        this.showError('无法获取笔记ID');
        return;
      }

      const noteData = {
        id: noteId,
        title,
        content,
        category: category || '其他',
        tags: tags || '未分类'
      };

      // 调用保存API
      await notesAPI.update(noteData);
      this.showSuccess('笔记保存成功');

      // 同步数据到普通模态框
      this.syncDataFromFullscreen();

      // 关闭所有相关模态框
      this.hideModal('fullscreenModal');
      this.hideModal('viewNoteModal');

      // 重新加载数据
      await this.loadNotes();
      await this.loadStats();
    } catch (error) {
      console.error('全屏保存失败:', error);
      this.showError(error.message || '保存失败');
    }
  }


  /**
   * 处理全屏AI优化重写（需要用户输入提示词）
   */
  async handleFullscreenOptimize() {
    try {
      const content = getElementById('fullscreenEditor')?.value?.trim();
      const prompt = getElementById('fullscreenOptPrompt')?.value?.trim();

      if (!content) {
        this.showError('请先输入笔记内容');
        return;
      }

      if (!prompt) {
        this.showError('AI优化重写功能需要输入提示词');
        return;
      }

      // AI优化重写模式：只更新文本内容，保持标题、分类、标签不变
      const result = await this.handleOptimize(content, prompt, (result) => {
        if (result.optimized) {
          const contentInput = getElementById('fullscreenEditor');
          if (contentInput) contentInput.value = result.optimized;
          
          // 同步更新全屏预览内容
          const fullscreenPreview = getElementById('fullscreenPreview');
          if (fullscreenPreview) {
            fullscreenPreview.innerHTML = this.renderMarkdown(result.optimized);
          }
        }
      });

      this.showSuccess('AI优化重写完成');
    } catch (error) {
      console.error('AI优化重写失败:', error);
      this.showError(error.message || 'AI优化重写失败');
    }
  }

  /**
   * 处理全屏分析标题分类（等同于无提示词的AI优化重写）
   */
  async handleFullscreenAnalyze() {
    try {
      const content = getElementById('fullscreenEditor')?.value?.trim();

      if (!content) {
        this.showError('请先输入笔记内容');
        return;
      }

      // 分析标题分类等同于无提示词的AI优化重写，使用默认提示词
      const result = await this.handleOptimize(content, null, (result) => {
        // 使用默认提示词：更新所有字段（标题、分类、标签、内容）
        if (result.title) {
          const titleInput = getElementById('fullscreenEditTitle');
          if (titleInput) titleInput.value = result.title;
        }
        if (result.category) {
          const categoryInput = getElementById('fullscreenEditCategory');
          if (categoryInput) categoryInput.value = result.category;
        }
        if (result.tags) {
          const tagsInput = getElementById('fullscreenEditTags');
          if (tagsInput) tagsInput.value = Array.isArray(result.tags) ? result.tags.join(', ') : result.tags;
        }
        if (result.optimized) {
          const contentInput = getElementById('fullscreenEditor');
          if (contentInput) contentInput.value = result.optimized;
          
          // 同步更新全屏预览内容
          const fullscreenPreview = getElementById('fullscreenPreview');
          if (fullscreenPreview) {
            fullscreenPreview.innerHTML = this.renderMarkdown(result.optimized);
          }
        }
      });

      this.showSuccess('分析标题分类完成');
    } catch (error) {
      console.error('分析标题分类失败:', error);
      this.showError(error.message || '分析标题分类失败');
    }
  }

  /**
   * 切换到编辑模式（普通模态框）
   */
  switchToEditMode() {
    const viewEditor = getElementById('viewEditor');
    const viewPreview = getElementById('viewPreview');
    const toggleEditBtn = getElementById('toggleEditBtn');
    const togglePreviewBtn = getElementById('togglePreviewBtn');

    if (viewEditor && viewPreview && toggleEditBtn && togglePreviewBtn) {
      // 显示编辑器，隐藏预览
      removeClass(viewEditor, 'hidden');
      addClass(viewPreview, 'hidden');
      
      // 更新按钮状态
      addClass(toggleEditBtn, 'hidden');
      removeClass(togglePreviewBtn, 'hidden');
      
      // 更新按钮文本
      setTextContent(togglePreviewBtn, '预览模式');
      
      // 添加实时同步监听器，确保编辑时预览内容同步更新
      this.addPreviewSyncListener();
    }
  }

  /**
   * 切换到预览模式（普通模态框）
   */
  switchToPreviewMode() {
    const viewEditor = getElementById('viewEditor');
    const viewPreview = getElementById('viewPreview');
    const toggleEditBtn = getElementById('toggleEditBtn');
    const togglePreviewBtn = getElementById('togglePreviewBtn');

    if (viewEditor && viewPreview && toggleEditBtn && togglePreviewBtn) {
      // 隐藏编辑器，显示预览
      addClass(viewEditor, 'hidden');
      removeClass(viewPreview, 'hidden');
      
      // 更新按钮状态
      removeClass(toggleEditBtn, 'hidden');
      addClass(togglePreviewBtn, 'hidden');
      
      // 更新按钮文本
      setTextContent(toggleEditBtn, '编辑模式');
      
      // 更新预览内容，确保显示最新的编辑内容
      if (viewEditor.value) {
        viewPreview.innerHTML = this.renderMarkdown(viewEditor.value);
      }
      
      // 移除实时同步监听器，避免不必要的更新
      this.removePreviewSyncListener();
    }
  }

  /**
   * 切换到全屏编辑模式
   */
  switchToFullscreenEditMode() {
    const fullscreenEditor = getElementById('fullscreenEditor');
    const fullscreenPreview = getElementById('fullscreenPreview');
    const fullscreenToggleEditBtn = getElementById('fullscreenToggleEditBtn');
    const fullscreenTogglePreviewBtn = getElementById('fullscreenTogglePreviewBtn');

    if (fullscreenEditor && fullscreenPreview && fullscreenToggleEditBtn && fullscreenTogglePreviewBtn) {
      // 显示编辑器，隐藏预览
      removeClass(fullscreenEditor, 'hidden');
      addClass(fullscreenPreview, 'hidden');
      
      // 更新按钮状态
      addClass(fullscreenToggleEditBtn, 'hidden');
      removeClass(fullscreenTogglePreviewBtn, 'hidden');
      
      // 更新按钮文本
      setTextContent(fullscreenTogglePreviewBtn, '预览模式');
      
      // 添加实时同步监听器，确保编辑时预览内容同步更新
      this.addFullscreenPreviewSyncListener();
    }
  }

  /**
   * 切换到全屏预览模式
   */
  switchToFullscreenPreviewMode() {
    const fullscreenEditor = getElementById('fullscreenEditor');
    const fullscreenPreview = getElementById('fullscreenPreview');
    const fullscreenToggleEditBtn = getElementById('fullscreenToggleEditBtn');
    const fullscreenTogglePreviewBtn = getElementById('fullscreenTogglePreviewBtn');

    if (fullscreenEditor && fullscreenPreview && fullscreenToggleEditBtn && fullscreenTogglePreviewBtn) {
      // 隐藏编辑器，显示预览
      addClass(fullscreenEditor, 'hidden');
      removeClass(fullscreenPreview, 'hidden');
      
      // 更新按钮状态
      removeClass(fullscreenToggleEditBtn, 'hidden');
      addClass(fullscreenTogglePreviewBtn, 'hidden');
      
      // 更新按钮文本
      setTextContent(fullscreenToggleEditBtn, '编辑模式');
      
      // 更新预览内容，确保显示最新的编辑内容
      if (fullscreenEditor.value) {
        fullscreenPreview.innerHTML = this.renderMarkdown(fullscreenEditor.value);
      }
      
      // 移除实时同步监听器，避免不必要的更新
      this.removeFullscreenPreviewSyncListener();
    }
  }

  /**
   * 重置为预览模式（普通模态框）
   */
  resetToPreviewMode() {
    const viewEditor = getElementById('viewEditor');
    const viewPreview = getElementById('viewPreview');
    const toggleEditBtn = getElementById('toggleEditBtn');
    const togglePreviewBtn = getElementById('togglePreviewBtn');

    if (viewEditor && viewPreview && toggleEditBtn && togglePreviewBtn) {
      // 显示预览，隐藏编辑器
      addClass(viewEditor, 'hidden');
      removeClass(viewPreview, 'hidden');
      
      // 更新按钮状态
      removeClass(toggleEditBtn, 'hidden');
      addClass(togglePreviewBtn, 'hidden');
      
      // 更新按钮文本
      setTextContent(toggleEditBtn, '编辑模式');
    }
  }

  /**
   * 同步数据到全屏模态框
   */
  syncDataToFullscreen() {
    const editTitle = getElementById('editTitle');
    const editCategory = getElementById('editCategory');
    const editTags = getElementById('editTags');
    const viewEditor = getElementById('viewEditor');
    const optPrompt = getElementById('optPrompt');

    const fullscreenEditTitle = getElementById('fullscreenEditTitle');
    const fullscreenEditCategory = getElementById('fullscreenEditCategory');
    const fullscreenEditTags = getElementById('fullscreenEditTags');
    const fullscreenEditor = getElementById('fullscreenEditor');
    const fullscreenOptPrompt = getElementById('fullscreenOptPrompt');

    // 同步数据
    if (editTitle && fullscreenEditTitle) fullscreenEditTitle.value = editTitle.value;
    if (editCategory && fullscreenEditCategory) fullscreenEditCategory.value = editCategory.value;
    if (editTags && fullscreenEditTags) fullscreenEditTags.value = editTags.value;
    if (viewEditor && fullscreenEditor) fullscreenEditor.value = viewEditor.value;
    if (optPrompt && fullscreenOptPrompt) fullscreenOptPrompt.value = optPrompt.value;

    // 更新全屏预览
    const fullscreenPreview = getElementById('fullscreenPreview');
    if (fullscreenEditor && fullscreenPreview) {
      fullscreenPreview.innerHTML = this.renderMarkdown(fullscreenEditor.value);
    }
  }

  /**
   * 同步数据从全屏模态框到普通模态框
   */
  syncDataFromFullscreen() {
    const editTitle = getElementById('editTitle');
    const editCategory = getElementById('editCategory');
    const editTags = getElementById('editTags');
    const viewEditor = getElementById('viewEditor');
    const optPrompt = getElementById('optPrompt');

    const fullscreenEditTitle = getElementById('fullscreenEditTitle');
    const fullscreenEditCategory = getElementById('fullscreenEditCategory');
    const fullscreenEditTags = getElementById('fullscreenEditTags');
    const fullscreenEditor = getElementById('fullscreenEditor');
    const fullscreenOptPrompt = getElementById('fullscreenOptPrompt');

    // 同步数据从全屏模态框到普通模态框
    if (editTitle && fullscreenEditTitle) editTitle.value = fullscreenEditTitle.value;
    if (editCategory && fullscreenEditCategory) editCategory.value = fullscreenEditCategory.value;
    if (editTags && fullscreenEditTags) editTags.value = fullscreenEditTags.value;
    if (viewEditor && fullscreenEditor) viewEditor.value = fullscreenEditor.value;
    if (optPrompt && fullscreenOptPrompt) optPrompt.value = fullscreenOptPrompt.value;

    // 更新普通模态框的预览
    const viewPreview = getElementById('viewPreview');
    if (viewEditor && viewPreview) {
      viewPreview.innerHTML = this.renderMarkdown(viewEditor.value);
    }
  }

  /**
   * 重置全屏模态框为预览模式
   */
  resetFullscreenToPreviewMode() {
    const fullscreenEditor = getElementById('fullscreenEditor');
    const fullscreenPreview = getElementById('fullscreenPreview');
    const fullscreenToggleEditBtn = getElementById('fullscreenToggleEditBtn');
    const fullscreenTogglePreviewBtn = getElementById('fullscreenTogglePreviewBtn');

    if (fullscreenEditor && fullscreenPreview && fullscreenToggleEditBtn && fullscreenTogglePreviewBtn) {
      // 显示预览，隐藏编辑器
      addClass(fullscreenEditor, 'hidden');
      removeClass(fullscreenPreview, 'hidden');
      
      // 更新按钮状态
      removeClass(fullscreenToggleEditBtn, 'hidden');
      addClass(fullscreenTogglePreviewBtn, 'hidden');
      
      // 更新按钮文本
      setTextContent(fullscreenToggleEditBtn, '编辑模式');
    }
  }

  /**
   * 添加预览同步监听器（普通模态框）
   */
  addPreviewSyncListener() {
    const viewEditor = getElementById('viewEditor');
    const viewPreview = getElementById('viewPreview');
    
    if (viewEditor && viewPreview && !this.previewSyncListener) {
      this.previewSyncListener = () => {
        if (viewEditor.value) {
          viewPreview.innerHTML = this.renderMarkdown(viewEditor.value);
        }
      };
      viewEditor.addEventListener('input', this.previewSyncListener);
    }
  }

  /**
   * 移除预览同步监听器（普通模态框）
   */
  removePreviewSyncListener() {
    const viewEditor = getElementById('viewEditor');
    
    if (viewEditor && this.previewSyncListener) {
      viewEditor.removeEventListener('input', this.previewSyncListener);
      this.previewSyncListener = null;
    }
  }

  /**
   * 添加全屏预览同步监听器
   */
  addFullscreenPreviewSyncListener() {
    const fullscreenEditor = getElementById('fullscreenEditor');
    const fullscreenPreview = getElementById('fullscreenPreview');
    
    if (fullscreenEditor && fullscreenPreview && !this.fullscreenPreviewSyncListener) {
      this.fullscreenPreviewSyncListener = () => {
        if (fullscreenEditor.value) {
          fullscreenPreview.innerHTML = this.renderMarkdown(fullscreenEditor.value);
        }
      };
      fullscreenEditor.addEventListener('input', this.fullscreenPreviewSyncListener);
    }
  }

  /**
   * 移除全屏预览同步监听器
   */
  removeFullscreenPreviewSyncListener() {
    const fullscreenEditor = getElementById('fullscreenEditor');
    
    if (fullscreenEditor && this.fullscreenPreviewSyncListener) {
      fullscreenEditor.removeEventListener('input', this.fullscreenPreviewSyncListener);
      this.fullscreenPreviewSyncListener = null;
    }
  }

  /**
   * 为输入框添加模糊搜索建议（恢复之前版本的实现）
   * @param {HTMLElement} inputEl - 输入框元素
   * @param {Function} sourceGetter - 数据源获取函数
   * @param {boolean} isTags - 是否为标签输入框（影响追加逻辑）
   */
  attachFuzzySuggest(inputEl, sourceGetter, isTags = false) {
    if (!inputEl || typeof sourceGetter !== 'function') return;
    
    const parent = inputEl.parentElement;
    if (parent) parent.style.position = parent.style.position || 'relative';
    
    const list = document.createElement('div');
    list.className = 'suggest-list hidden';
    parent.appendChild(list);
    
    let activeIndex = -1;

    function getQueryParts() {
      const val = (inputEl.value || '').trim();
      if (!isTags) return [val, null];
      const parts = val.split(',');
      const last = parts.pop();
      return [String(last || '').trim(), parts];
    }
    
    function setWithSelection(choice) {
      if (!isTags) { 
        inputEl.value = choice; 
        return; 
      }
      const [_, head] = getQueryParts();
      const newVal = [...(head || []), choice].filter(s => s !== '').join(', ');
      inputEl.value = newVal;
    }
    
    function render(query) {
      const src = sourceGetter() || [];
      const q = (query || '').toLowerCase();
      const items = q ? src.filter(v => String(v).toLowerCase().includes(q)) : src.slice(0, 20);
      
      if (!items.length) { 
        list.innerHTML = ''; 
        list.classList.add('hidden'); 
        activeIndex = -1; 
        return; 
      }
      
      list.innerHTML = items.slice(0, 20).map((v, i) => 
        `<div class="suggest-item${i===0?' active':''}" data-index="${i}" data-val="${String(v).replace(/"/g,'&quot;')}">${v}</div>`
      ).join('');
      
      activeIndex = 0;
      list.classList.remove('hidden');
    }
    
    function moveActive(delta) {
      const items = list.querySelectorAll('.suggest-item');
      if (!items.length) return;
      activeIndex = (activeIndex + delta + items.length) % items.length;
      items.forEach((el,i)=>{ el.classList.toggle('active', i===activeIndex); });
    }
    
    function pickActive() {
      const item = list.querySelector(`.suggest-item[data-index="${activeIndex}"]`);
      if (!item) return;
      const val = item.getAttribute('data-val') || '';
      setWithSelection(val);
      list.classList.add('hidden');
      inputEl.dispatchEvent(new Event('change'));
    }
    
    inputEl.addEventListener('input', () => {
      const [q] = getQueryParts();
      render(q);
    });
    
    inputEl.addEventListener('focus', () => {
      const [q] = getQueryParts();
      render(q);
    });
    
    inputEl.addEventListener('keydown', (e) => {
      if (list.classList.contains('hidden')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); pickActive(); }
      else if (e.key === 'Escape') { list.classList.add('hidden'); }
    });
    
    document.addEventListener('click', (e) => {
      if (!list.contains(e.target) && e.target !== inputEl) list.classList.add('hidden');
    });
    
    list.addEventListener('click', (e) => {
      const item = e.target.closest('.suggest-item');
      if (!item) return;
      const val = item.getAttribute('data-val') || '';
      setWithSelection(val);
      list.classList.add('hidden');
      inputEl.dispatchEvent(new Event('change'));
    });
  }

  /**
   * 显示当前过滤条件
   * @param {string} filterType - 过滤类型（分类/标签）
   * @param {string} filterValue - 过滤值
   */
  showActiveFilter(filterType, filterValue) {
    const activeFilter = getElementById('activeFilter');
    const filterTypeEl = getElementById('filterType');
    const filterValueEl = getElementById('filterValue');
    
    if (activeFilter && filterTypeEl && filterValueEl) {
      filterTypeEl.textContent = filterType;
      filterValueEl.textContent = filterValue;
      removeClass(activeFilter, 'hidden');
    }
  }

  /**
   * 隐藏当前过滤条件显示
   */
  hideActiveFilter() {
    const activeFilter = getElementById('activeFilter');
    if (activeFilter) {
      addClass(activeFilter, 'hidden');
    }
  }
}
