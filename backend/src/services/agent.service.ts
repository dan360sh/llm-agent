import { Agent } from '../models/types';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';

export class AgentService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.initializeDefaultAgent();
  }

  private initializeDefaultAgent() {
    const agents = this.storageService.getAgents();
    
    if (agents.length === 0) {
      // Создаем агента по умолчанию
      const defaultAgent: Agent = {
        id: uuidv4(),
        name: 'Default Assistant',
        description: 'Default AI assistant',
        systemPrompt: 'You are a helpful AI assistant. Be concise and helpful in your responses.',
        llmConfigId: '', // Будет установлен при добавлении первой LLM модели
        mcpServerIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.storageService.saveAgent(defaultAgent);
    }
  }

  async createAgent(agentData: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    const agent: Agent = {
      ...agentData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.storageService.saveAgent(agent);
    return agent;
  }

  async updateAgent(id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>): Promise<Agent> {
    const agent = this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    const updatedAgent: Agent = {
      ...agent,
      ...updates,
      id: agent.id,
      createdAt: agent.createdAt,
      updatedAt: new Date()
    };

    this.storageService.saveAgent(updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<void> {
    const agents = this.getAgents();
    
    // Не позволяем удалить последнего агента
    if (agents.length <= 1) {
      throw new Error('Cannot delete the last agent');
    }

    this.storageService.deleteAgent(id);
  }

  getAgents(): Agent[] {
    return this.storageService.getAgents();
  }

  getAgent(id: string): Agent | undefined {
    return this.storageService.getAgents().find((agent: Agent) => agent.id === id);
  }

  getDefaultAgent(): Agent {
    const agents = this.getAgents();
    return agents[0]; // Возвращаем первого агента как агента по умолчанию
  }

  async validateAgent(agent: Partial<Agent>): Promise<string[]> {
    const errors: string[] = [];

    if (!agent.name || agent.name.trim().length === 0) {
      errors.push('Agent name is required');
    }

    if (!agent.systemPrompt || agent.systemPrompt.trim().length === 0) {
      errors.push('System prompt is required');
    }

    if (!agent.llmConfigId) {
      errors.push('LLM model is required');
    }

    // Можно добавить дополнительные валидации

    return errors;
  }

  async duplicateAgent(id: string): Promise<Agent> {
    const originalAgent = this.getAgent(id);
    if (!originalAgent) {
      throw new Error(`Agent not found: ${id}`);
    }

    const duplicatedAgent = await this.createAgent({
      name: `${originalAgent.name} (Copy)`,
      description: originalAgent.description,
      systemPrompt: originalAgent.systemPrompt,
      llmConfigId: originalAgent.llmConfigId,
      mcpServerIds: [...originalAgent.mcpServerIds]
    });

    return duplicatedAgent;
  }

  getAgentsByLLMModel(llmConfigId: string): Agent[] {
    return this.getAgents().filter((agent: Agent) => agent.llmConfigId === llmConfigId);
  }

  getAgentsByMCPServer(mcpServerId: string): Agent[] {
    return this.getAgents().filter((agent: Agent) => 
      agent.mcpServerIds.includes(mcpServerId)
    );
  }
}
