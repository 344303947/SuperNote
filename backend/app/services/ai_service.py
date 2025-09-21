"""
AI服务模块
"""
import json
import re
from typing import List, Tuple, Optional, Dict, Any
from openai import OpenAI
from ..config.settings import settings
from ..core import AIConfigurationError, AIConnectionError


class AIService:
    """AI服务类"""
    
    def __init__(self):
        self.client: Optional[OpenAI] = None
        self.current_model = settings.default_model
    
    def initialize_client(self, api_url: str, api_key: str, model: str) -> None:
        """初始化AI客户端"""
        try:
            self.client = OpenAI(api_key=api_key, base_url=api_url)
            self.current_model = model
            # 不进行连接测试，避免404错误
            # 在实际使用时再进行错误处理
        except Exception as e:
            error_msg = str(e)
            if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                raise AIConnectionError("AI服务连接超时，请检查网络连接")
            else:
                raise AIConnectionError(f"AI客户端初始化失败：{error_msg}")
    
    def is_configured(self) -> bool:
        """检查AI是否已配置"""
        return self.client is not None
    
    def extract_category_and_tags(self, content: str, max_length: int = 1000) -> Tuple[str, List[str]]:
        """提取分类和标签"""
        if not self.is_configured():
            raise AIConfigurationError("AI未配置")
        
        try:
            # 获取现有分类和标签
            existing_categories, existing_tags = self._get_existing_categories_and_tags()
            
            response = self.client.chat.completions.create(
                model=self.current_model,
                messages=[
                    {
                        "role": "system",
                        "content": self._build_category_extraction_prompt(existing_categories, existing_tags)
                    },
                    {"role": "user", "content": content[:max_length]}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            raw = (response.choices[0].message.content or "").strip()
            return self._parse_category_response(raw)
            
        except Exception as e:
            print(f"AI 分析失败: {e}")
            return "其他", ["未分类"]
    
    def optimize_text(self, content: str, prompt: Optional[str] = None) -> Dict[str, Any]:
        """优化文本内容"""
        if not self.is_configured():
            raise AIConfigurationError("AI未配置")
        
        # 判断是否使用自定义提示词
        is_custom_prompt = prompt and prompt.strip() != ""
        content_length = 20000 if is_custom_prompt else 1000
        
        try:
            if is_custom_prompt:
                return self._optimize_with_custom_prompt(content, prompt, content_length)
            else:
                return self._optimize_with_default_prompt(content, content_length)
        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg or "upstream_error" in error_msg:
                raise AIConnectionError("AI服务连接失败，请检查API地址和模型名称是否正确")
            elif "401" in error_msg or "unauthorized" in error_msg.lower():
                raise AIConnectionError("AI API密钥无效，请检查API密钥是否正确")
            elif "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                raise AIConnectionError("AI服务响应超时，请稍后重试")
            else:
                raise AIConnectionError(f"优化失败: {error_msg}")
    
    def _get_existing_categories_and_tags(self) -> Tuple[List[str], List[str]]:
        """获取现有分类和标签"""
        try:
            from ..repositories.note_repository import note_repository
            categories = note_repository.get_categories_list()
            tags = note_repository.get_tags_list()
            return categories, tags
        except Exception:
            # 如果获取失败，返回空列表
            return [], []
    
    def _build_category_extraction_prompt(self, existing_categories: List[str], existing_tags: List[str]) -> str:
        """构建分类提取提示词"""
        return (
            "你是一个智能笔记分类助手。\n"
            "- 优先从'现有分类列表'中选择最合适的一个分类；若都不匹配再给出一个新的合理分类，不要给出和文章无关的分类\n"
            "- 优先从'现有标签列表'中选择最相关的 1-3 个标签；若都不匹配再给出 1-3 个新的合理标签，不要给出和文章无关的标签\n"
            "- 不好分类,没有匹配，内容过短没有合适的就给出'其他'。\n"
            "- 仅输出 JSON，不要任何解释。\n"
            "- JSON 格式：{\"category\":\"...\",\"tags\":[\"...\",\"...\"]}\n"
            f"现有分类列表：{', '.join(existing_categories) if existing_categories else '（暂无）'}\n"
            f"现有标签列表：{', '.join(existing_tags) if existing_tags else '（暂无）'}\n"
        )
    
    def _parse_category_response(self, raw: str) -> Tuple[str, List[str]]:
        """解析分类响应"""
        # 处理可能的markdown包装
        txt = raw
        if txt.startswith("```"):
            try:
                txt = txt.split("\n", 1)[1]
                if txt.endswith("```"):
                    txt = txt.rsplit("```", 1)[0]
                txt = txt.strip()
            except Exception:
                txt = raw
        
        # 解析JSON
        obj = None
        try:
            obj = json.loads(txt)
        except Exception:
            try:
                m = re.search(r"\{[\s\S]*\}", txt)
                if m:
                    obj = json.loads(m.group(0))
            except Exception:
                obj = None
        
        if not isinstance(obj, dict):
            raise ValueError("未能解析分类 JSON")
        
        category = str(obj.get("category", "其他")).strip() or "其他"
        tags_val = obj.get("tags", [])
        
        if isinstance(tags_val, str):
            tags_list = [t.strip() for t in tags_val.split(',') if t.strip()]
        elif isinstance(tags_val, list):
            tags_list = [str(t).strip() for t in tags_val if str(t).strip()]
        else:
            tags_list = []
        
        if not tags_list:
            tags_list = ["未分类"]
        
        return category, tags_list
    
    def _optimize_with_custom_prompt(self, content: str, prompt: str, content_length: int) -> Dict[str, Any]:
        """使用自定义提示词优化"""
        response = self.client.chat.completions.create(
            model=self.current_model,
            messages=[
                {"role": "user", "content": f"{prompt}\n\n原文：\n{content[:content_length]}"}
            ],
            temperature=0.7,
            max_tokens=20000
        )
        
        raw = response.choices[0].message.content.strip()
        
        # 尝试解析JSON格式的响应
        try:
            obj = json.loads(raw)
            tags = obj.get("tags", ["未分类"])
            if isinstance(tags, str):
                tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
            return {
                "title": (obj.get("title") or "").strip(),
                "optimized": (obj.get("content") or raw).strip(),
                "category": (obj.get("category") or "其他").strip(),
                "tags": ",".join(tags),
                "mode": "rewrite"
            }
        except Exception:
            # 如果不是JSON格式，直接返回原始内容
            lines = [x.strip() for x in raw.splitlines() if x.strip()]
            title = lines[0][:20] if lines else ""
            return {
                "title": title,
                "optimized": raw,
                "category": "其他",
                "tags": "未分类",
                "mode": "rewrite"
            }
    
    def _optimize_with_default_prompt(self, content: str, content_length: int) -> Dict[str, Any]:
        """使用默认提示词优化"""
        existing_categories, existing_tags = self._get_existing_categories_and_tags()
        
        response = self.client.chat.completions.create(
            model=self.current_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "你是一个专业的中文知识整理助手。默认不要改写用户原文；"
                        "请基于原文抽取'知识点总结'与'知识图谱'，并生成10-20字中文标题，同时提取合适的分类和标签。"
                        "优先从现有分类和标签中选择，如果没有合适的再创建新的。"
                        f"现有分类列表：{', '.join(existing_categories) if existing_categories else '（暂无）'}"
                        f"现有标签列表：{', '.join(existing_tags) if existing_tags else '（暂无）'}"
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "请严格输出JSON（不要解释），格式如下：\n"
                        '{"title":"示例标题","key_points":["要点1","要点2"],"graph":{"nodes":[{"id":"概念A"},{"id":"概念B"}],"edges":[{"source":"概念A","target":"概念B","relation":"包含/因果/引用"}]},"category":"分类名称","tags":["标签1","标签2"]}\n\n'
                        f"原文：\n{content[:content_length]}"
                    )
                }
            ],
            temperature=0.6,
            max_tokens=4048
        )
        
        raw = response.choices[0].message.content.strip()
        
        try:
            obj = json.loads(raw)
            tags = obj.get("tags", ["未分类"])
            if isinstance(tags, str):
                tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
            return {
                "title": (obj.get("title") or "").strip(),
                "optimized": content.strip(),  # 默认模式不修改原文
                "category": (obj.get("category") or "其他").strip(),
                "tags": ",".join(tags),
                "key_points": obj.get("key_points", []),
                "graph": obj.get("graph", {"nodes": [], "edges": []}),
                "mode": "analyze"
            }
        except Exception:
            lines = [x.strip() for x in raw.splitlines() if x.strip()]
            title = lines[0][:20] if lines else ""
            return {
                "title": title,
                "optimized": content.strip(),
                "category": "其他",
                "tags": "未分类",
                "key_points": [],
                "graph": {"nodes": [], "edges": []},
                "mode": "analyze"
            }


# 全局AI服务实例
ai_service = AIService()
