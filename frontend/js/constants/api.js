/**
 * API相关常量
 */
export const API_BASE = "/api";
export const API_ENDPOINTS = {
  // 认证相关
  LOGIN: "/login",
  LOGOUT: "/logout", 
  CONFIG: "/config",
  
  // 笔记相关
  NOTES: "/notes",
  NOTE: "/note",
  SEARCH: "/search",
  NOTES_BY_CATEGORY: "/notes/by_category",
  NOTES_BY_TAG: "/notes/by_tag",
  STATS: "/stats",
  CATEGORIES: "/categories",
  TAGS: "/tags",
  
  // AI相关
  OPTIMIZE: "/optimize"
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

export const REQUEST_TIMEOUT = 300000; // 120秒（2分钟）
