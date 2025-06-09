// Основные интерфейсы для приложения

export interface Message {
  id: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  images?: string[];
}

export interface Chat {
  id: string;
  name: string;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  llmConfigId: string;  // Изменено с llmModelId на llmConfigId
  mcpServerIds: string[];  // Изменено с mcpServers на mcpServerIds
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: 'openai' | 'ollama';
  config: OpenAIConfig | OllamaConfig;
  supportsImages: boolean;
  enabled: boolean;  // Изменено с isActive на enabled
  createdAt?: Date;  // Сделаем необязательным
}

export interface OpenAIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  headers?: { [key: string]: string };
}

export interface OllamaConfig {
  baseURL: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface MCPServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  enabled: boolean;  // Изменено с isEnabled на enabled
  status: 'connected' | 'disconnected' | 'error';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateChatRequest {
  agentId: string;
  name?: string;
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
  images?: File[];
}

export interface StreamResponse {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}
