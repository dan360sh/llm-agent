import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Chat, Agent, LLMConfig, MCPServer } from '../models/types';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  // State subjects
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  private agentsSubject = new BehaviorSubject<Agent[]>([]);
  private llmModelsSubject = new BehaviorSubject<LLMConfig[]>([]);
  private mcpServersSubject = new BehaviorSubject<MCPServer[]>([]);
  private currentChatSubject = new BehaviorSubject<Chat | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public chats$ = this.chatsSubject.asObservable();
  public agents$ = this.agentsSubject.asObservable();
  public llmModels$ = this.llmModelsSubject.asObservable();
  public mcpServers$ = this.mcpServersSubject.asObservable();
  public currentChat$ = this.currentChatSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    this.setLoading(true);
    try {
      await Promise.all([
        this.refreshChats(),
        this.refreshAgents(),
        this.refreshLLMModels(),
        this.refreshMCPServers()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      this.setLoading(false);
    }
  }

  // Loading state
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  // Chats
  async refreshChats(): Promise<void> {
    try {
      const chats = await this.apiService.getChats().toPromise();
      this.chatsSubject.next(chats || []);
    } catch (error) {
      console.error('Failed to refresh chats:', error);
      this.chatsSubject.next([]);
    }
  }

  addChat(chat: Chat): void {
    const currentChats = this.chatsSubject.value;
    this.chatsSubject.next([chat, ...currentChats]);
  }

  updateChat(updatedChat: Chat): void {
    const currentChats = this.chatsSubject.value;
    const index = currentChats.findIndex(c => c.id === updatedChat.id);
    if (index !== -1) {
      currentChats[index] = updatedChat;
      this.chatsSubject.next([...currentChats]);
    }

    // Update current chat if it's the same
    if (this.currentChatSubject.value?.id === updatedChat.id) {
      this.currentChatSubject.next(updatedChat);
    }
  }

  removeChat(chatId: string): void {
    const currentChats = this.chatsSubject.value;
    this.chatsSubject.next(currentChats.filter(c => c.id !== chatId));

    // Clear current chat if it was deleted
    if (this.currentChatSubject.value?.id === chatId) {
      this.currentChatSubject.next(null);
    }
  }

  setCurrentChat(chat: Chat | null): void {
    this.currentChatSubject.next(chat);
  }

  getCurrentChat(): Chat | null {
    return this.currentChatSubject.value;
  }

  // Agents
  async refreshAgents(): Promise<void> {
    try {
      const agents = await this.apiService.getAgents().toPromise();
      this.agentsSubject.next(agents || []);
    } catch (error) {
      console.error('Failed to refresh agents:', error);
      this.agentsSubject.next([]);
    }
  }

  addAgent(agent: Agent): void {
    const currentAgents = this.agentsSubject.value;
    this.agentsSubject.next([...currentAgents, agent]);
  }

  updateAgent(updatedAgent: Agent): void {
    const currentAgents = this.agentsSubject.value;
    const index = currentAgents.findIndex(a => a.id === updatedAgent.id);
    if (index !== -1) {
      currentAgents[index] = updatedAgent;
      this.agentsSubject.next([...currentAgents]);
    }
  }

  removeAgent(agentId: string): void {
    const currentAgents = this.agentsSubject.value;
    this.agentsSubject.next(currentAgents.filter(a => a.id !== agentId));
  }

  getAgentById(id: string): Agent | undefined {
    return this.agentsSubject.value.find(a => a.id === id);
  }

  // LLM Models
  async refreshLLMModels(): Promise<void> {
    try {
      const models = await this.apiService.getLLMModels().toPromise();
      this.llmModelsSubject.next(models || []);
    } catch (error) {
      console.error('Failed to refresh LLM models:', error);
      this.llmModelsSubject.next([]);
    }
  }

  addLLMModel(model: LLMConfig): void {
    const currentModels = this.llmModelsSubject.value;
    this.llmModelsSubject.next([...currentModels, model]);
  }

  updateLLMModel(updatedModel: LLMConfig): void {
    const currentModels = this.llmModelsSubject.value;
    const index = currentModels.findIndex(m => m.id === updatedModel.id);
    if (index !== -1) {
      currentModels[index] = updatedModel;
      this.llmModelsSubject.next([...currentModels]);
    }
  }

  removeLLMModel(modelId: string): void {
    const currentModels = this.llmModelsSubject.value;
    this.llmModelsSubject.next(currentModels.filter(m => m.id !== modelId));
  }

  getLLMModelById(id: string): LLMConfig | undefined {
    return this.llmModelsSubject.value.find(m => m.id === id);
  }

  // MCP Servers
  async refreshMCPServers(): Promise<void> {
    try {
      const servers = await this.apiService.getMCPServers().toPromise();
      this.mcpServersSubject.next(servers || []);
    } catch (error) {
      console.error('Failed to refresh MCP servers:', error);
      this.mcpServersSubject.next([]);
    }
  }

  addMCPServer(server: MCPServer): void {
    const currentServers = this.mcpServersSubject.value;
    this.mcpServersSubject.next([...currentServers, server]);
  }

  updateMCPServer(updatedServer: MCPServer): void {
    const currentServers = this.mcpServersSubject.value;
    const index = currentServers.findIndex(s => s.id === updatedServer.id);
    if (index !== -1) {
      currentServers[index] = updatedServer;
      this.mcpServersSubject.next([...currentServers]);
    }
  }

  removeMCPServer(serverId: string): void {
    const currentServers = this.mcpServersSubject.value;
    this.mcpServersSubject.next(currentServers.filter(s => s.id !== serverId));
  }

  getMCPServerById(id: string): MCPServer | undefined {
    return this.mcpServersSubject.value.find(s => s.id === id);
  }

  // Utility methods
  getState() {
    return {
      chats: this.chatsSubject.value,
      agents: this.agentsSubject.value,
      llmModels: this.llmModelsSubject.value,
      mcpServers: this.mcpServersSubject.value,
      currentChat: this.currentChatSubject.value,
      loading: this.loadingSubject.value
    };
  }
}
