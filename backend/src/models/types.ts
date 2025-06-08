export interface LLMConfig {
  id: string;
  name: string;
  provider: 'openai' | 'ollama';
  config: OpenAIConfig | OllamaConfig;
  supportsImages: boolean;
  enabled: boolean;
  createdAt: Date;
}

export interface OpenAIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  headers?: Record<string, string>;
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
  enabled: boolean;
  status: 'running' | 'stopped' | 'error';
  createdAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  llmConfigId: string;
  mcpServerIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  name: string;
  agentId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
  streaming?: boolean;
}

export interface StreamResponse {
  chatId: string;
  messageId: string;
  content: string;
  done: boolean;
}

export interface MCPConfig {
  mcpServers: Record<string, {
    command: string;
    args: string[];
  }>;
}
