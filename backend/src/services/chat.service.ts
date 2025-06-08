import { Chat, Message, Agent } from '../models/types';
import { StorageService } from '../storage/storage.service';
import { LLMService } from './llm.service';
import { AgentService } from './agent.service';
import { MCPManager } from '../mcp/mcp-manager';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  private storageService: StorageService;
  private llmService: LLMService;
  private agentService: AgentService;
  private mcpManager: MCPManager;

  constructor(
    storageService: StorageService,
    llmService: LLMService,
    agentService: AgentService,
    mcpManager: MCPManager
  ) {
    this.storageService = storageService;
    this.llmService = llmService;
    this.agentService = agentService;
    this.mcpManager = mcpManager;
  }

  async createChat(agentId: string, name?: string): Promise<Chat> {
    const agent = this.agentService.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const chat: Chat = {
      id: uuidv4(),
      name: name || `Chat with ${agent.name}`,
      agentId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.storageService.saveChat(chat);
    return chat;
  }

  async updateChat(id: string, updates: Partial<Omit<Chat, 'id' | 'createdAt'>>): Promise<Chat> {
    const chat = this.getChat(id);
    if (!chat) {
      throw new Error(`Chat not found: ${id}`);
    }

    const updatedChat: Chat = {
      ...chat,
      ...updates,
      id: chat.id,
      createdAt: chat.createdAt,
      updatedAt: new Date()
    };

    this.storageService.saveChat(updatedChat);
    return updatedChat;
  }

  async deleteChat(id: string): Promise<void> {
    this.storageService.deleteChat(id);
  }

  getChats(): Chat[] {
    return this.storageService.getChats().sort(
      (a: Chat, b: Chat) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getChat(id: string): Chat | undefined {
    return this.storageService.getChat(id);
  }

  async addMessage(chatId: string, content: string, role: 'user' | 'assistant' | 'system', images?: string[]): Promise<Message> {
    const chat = this.getChat(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    const message: Message = {
      id: uuidv4(),
      role,
      content,
      images: images || [],
      timestamp: new Date()
    };

    chat.messages.push(message);
    chat.updatedAt = new Date();
    
    this.storageService.saveChat(chat);
    return message;
  }

  async sendMessage(
    chatId: string, 
    content: string, 
    images?: string[],
    onStream?: (chunk: string) => void
  ): Promise<Message> {
    const chat = this.getChat(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    const agent = this.agentService.getAgent(chat.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${chat.agentId}`);
    }

    // Добавляем сообщение пользователя
    await this.addMessage(chatId, content, 'user', images);

    // Подготавливаем контекст для LLM
    const messages = await this.prepareMessagesForLLM(chat, agent);

    try {
      // Генерируем ответ от LLM
      const response = await this.llmService.generateResponse(
        agent.llmConfigId,
        messages,
        onStream
      );

      // Добавляем ответ ассистента
      const assistantMessage = await this.addMessage(chatId, response, 'assistant');
      
      return assistantMessage;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  private async prepareMessagesForLLM(chat: Chat, agent: Agent): Promise<Message[]> {
    const messages: Message[] = [];

    // Добавляем системный промт
    if (agent.systemPrompt) {
      messages.push({
        id: uuidv4(),
        role: 'system',
        content: agent.systemPrompt,
        timestamp: new Date()
      });
    }

    // Добавляем контекст от MCP серверов если есть
    const mcpContext = await this.getMCPContext(agent.mcpServerIds);
    if (mcpContext) {
      messages.push({
        id: uuidv4(),
        role: 'system',
        content: mcpContext,
        timestamp: new Date()
      });
    }

    // Добавляем историю сообщений (ограничиваем последними 20 сообщениями)
    const recentMessages = chat.messages.slice(-20);
    messages.push(...recentMessages);

    return messages;
  }

  private async getMCPContext(mcpServerIds: string[]): Promise<string | null> {
    if (mcpServerIds.length === 0) {
      return null;
    }

    try {
      const availableTools = await this.mcpManager.getAvailableTools(mcpServerIds);
      
      if (availableTools.length === 0) {
        return null;
      }

      const toolDescriptions = availableTools.map(tool => 
        `- ${tool.name}: ${tool.description}`
      ).join('\n');

      return `Available tools:\n${toolDescriptions}\n\nYou can use these tools to help the user. Call them when appropriate.`;
    } catch (error) {
      console.error('Error getting MCP context:', error);
      return null;
    }
  }

  async updateMessage(chatId: string, messageId: string, content: string): Promise<Message> {
    const chat = this.getChat(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    const messageIndex = chat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      throw new Error(`Message not found: ${messageId}`);
    }

    chat.messages[messageIndex].content = content;
    chat.updatedAt = new Date();

    this.storageService.saveChat(chat);
    return chat.messages[messageIndex];
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    const chat = this.getChat(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    chat.messages = chat.messages.filter(m => m.id !== messageId);
    chat.updatedAt = new Date();

    this.storageService.saveChat(chat);
  }

  async clearChat(chatId: string): Promise<void> {
    const chat = this.getChat(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    chat.messages = [];
    chat.updatedAt = new Date();

    this.storageService.saveChat(chat);
  }

  async getChatsByAgent(agentId: string): Promise<Chat[]> {
    return this.getChats().filter((chat: Chat) => chat.agentId === agentId);
  }

  async duplicateChat(chatId: string): Promise<Chat> {
    const originalChat = this.getChat(chatId);
    if (!originalChat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    const duplicatedChat: Chat = {
      id: uuidv4(),
      name: `${originalChat.name} (Copy)`,
      agentId: originalChat.agentId,
      messages: originalChat.messages.map(msg => ({
        ...msg,
        id: uuidv4()
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.storageService.saveChat(duplicatedChat);
    return duplicatedChat;
  }

  async searchChats(query: string): Promise<Chat[]> {
    const allChats = this.getChats();
    const searchQuery = query.toLowerCase();

    return allChats.filter((chat: Chat) => {
      // Поиск по названию чата
      if (chat.name.toLowerCase().includes(searchQuery)) {
        return true;
      }

      // Поиск по содержимому сообщений
      return chat.messages.some((message: Message) => 
        message.content.toLowerCase().includes(searchQuery)
      );
    });
  }
}
