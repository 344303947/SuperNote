/**
 * 自动完成组件
 */
import { getElementById, createElement, addClass, removeClass, showElement, hideElement } from '../utils/dom.js';

export class Autocomplete {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = {
      dataSource: [], // 数据源
      minLength: 1, // 最小输入长度
      maxItems: 10, // 最大显示项数
      onSelect: null, // 选择回调
      onInput: null, // 输入回调
      placeholder: '输入关键词搜索...',
      ...options
    };
    
    console.log('🔧 Autocomplete构造函数，输入元素:', this.input);
    console.log('🔧 Autocomplete构造函数，数据源:', this.options.dataSource);
    console.log('🔧 Autocomplete构造函数，选项:', this.options);
    
    this.suggestions = [];
    this.selectedIndex = -1;
    this.isVisible = false;
    this.container = null;
    
    this.init();
  }
  
  init() {
    // 创建建议列表容器
    this.createContainer();
    
    // 绑定事件
    this.bindEvents();
  }
  
  createContainer() {
    this.container = createElement('div', {
      className: 'suggest-list',
      style: 'display: none;'
    });
    
    // 将容器添加到输入框的父元素中
    const parent = this.input.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(this.container);
    }
  }
  
  bindEvents() {
    // 输入事件
    this.input.addEventListener('input', (e) => {
      this.handleInput(e.target.value);
    });
    
    // 键盘事件
    this.input.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });
    
    // 输入框获得焦点时，如果是标签自动完成（minLength为0），显示所有标签
    this.input.addEventListener('focus', () => {
      if (this.options.minLength === 0) {
        console.log('🎯 标签输入框获得焦点，显示所有标签');
        this.handleInput('');
      }
    });
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.input.contains(e.target) && !this.container.contains(e.target)) {
        this.hide();
      }
    });
    
    // 输入框失去焦点
    this.input.addEventListener('blur', () => {
      // 延迟隐藏，让点击事件先触发
      setTimeout(() => this.hide(), 150);
    });
  }
  
  handleInput(value) {
    const query = value.trim();
    
    console.log('🔍 自动完成输入处理，查询词:', query);
    console.log('🔍 数据源:', this.options.dataSource);
    
    if (query.length < this.options.minLength) {
      console.log('❌ 查询词长度不足，最小长度:', this.options.minLength);
      this.hide();
      return;
    }
    
    // 过滤数据
    let filteredData;
    if (query.length === 0 && this.options.minLength === 0) {
      // 如果没有输入且最小长度为0，显示所有数据（用于标签自动完成）
      filteredData = this.options.dataSource;
      console.log('🔍 显示所有标签（无输入过滤）');
    } else {
      // 正常过滤逻辑
      filteredData = this.options.dataSource.filter(item => {
        const text = typeof item === 'string' ? item : item.text || item.name || '';
        const matches = text.toLowerCase().includes(query.toLowerCase());
        console.log(`🔍 检查项目: "${text}" 匹配 "${query}": ${matches}`);
        return matches;
      });
    }
    
    this.suggestions = filteredData.slice(0, this.options.maxItems);
    
    console.log('🔍 过滤后的建议列表:', this.suggestions);
    
    if (this.suggestions.length > 0) {
      console.log('✅ 显示建议列表');
      this.show();
    } else {
      console.log('❌ 没有匹配的建议，隐藏列表');
      this.hide();
    }
    
    // 调用输入回调
    if (this.options.onInput) {
      this.options.onInput(query, this.suggestions);
    }
  }
  
  handleKeydown(e) {
    if (!this.isVisible) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
        this.updateSelection();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectItem(this.suggestions[this.selectedIndex]);
        }
        break;
        
      case 'Escape':
        this.hide();
        break;
    }
  }
  
  updateSelection() {
    const items = this.container.querySelectorAll('.suggest-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        addClass(item, 'bg-blue-50');
        addClass(item, 'text-blue-700');
      } else {
        removeClass(item, 'bg-blue-50');
        removeClass(item, 'text-blue-700');
      }
    });
  }
  
  show() {
    if (this.suggestions.length === 0) {
      console.log('❌ 没有建议可显示');
      return;
    }
    
    console.log('✅ 显示自动完成列表，建议数量:', this.suggestions.length);
    console.log('✅ 容器元素:', this.container);
    
    this.renderSuggestions();
    showElement(this.container);
    this.isVisible = true;
    this.selectedIndex = -1;
    
    console.log('✅ 自动完成列表已显示');
  }
  
  hide() {
    console.log('❌ 隐藏自动完成列表');
    hideElement(this.container);
    this.isVisible = false;
    this.selectedIndex = -1;
  }
  
  renderSuggestions() {
    this.container.innerHTML = '';
    
    this.suggestions.forEach((item, index) => {
      const itemElement = createElement('div', {
        className: 'suggest-item hover:bg-gray-50',
        textContent: typeof item === 'string' ? item : item.text || item.name || '',
        'data-index': index
      });
      
      itemElement.addEventListener('click', () => {
        this.selectItem(item);
      });
      
      this.container.appendChild(itemElement);
    });
  }
  
  selectItem(item) {
    const value = typeof item === 'string' ? item : item.value || item.text || item.name || '';
    this.input.value = value;
    this.hide();
    
    // 触发输入事件
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    
    // 调用选择回调
    if (this.options.onSelect) {
      this.options.onSelect(item);
    }
  }
  
  updateDataSource(data) {
    this.options.dataSource = data;
  }
  
  destroy() {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}

/**
 * 创建分类自动完成
 */
export function createCategoryAutocomplete(inputElement, categories = []) {
  return new Autocomplete(inputElement, {
    dataSource: categories,
    minLength: 1,
    maxItems: 8,
    placeholder: '输入分类名称...'
  });
}

/**
 * 创建标签自动完成
 */
export function createTagAutocomplete(inputElement, tags = []) {
  return new Autocomplete(inputElement, {
    dataSource: tags,
    minLength: 0, // 修改为0，不需要输入就能显示所有标签
    maxItems: 10,
    placeholder: '输入标签名称或点击选择...',
    onSelect: (item) => {
      // 标签选择时，如果当前输入框有内容，则添加到现有标签后面
      const currentValue = inputElement.value.trim();
      const selectedTag = typeof item === 'string' ? item : item.value || item.text || item.name || '';
      
      if (currentValue && !currentValue.endsWith(selectedTag)) {
        // 检查是否已经包含该标签
        const existingTags = currentValue.split(',').map(t => t.trim());
        if (!existingTags.includes(selectedTag)) {
          inputElement.value = currentValue + ', ' + selectedTag;
        }
      } else if (!currentValue) {
        inputElement.value = selectedTag;
      }
    }
  });
}
