import * as fs from 'fs';
import * as path from 'path';
import { LLMConfig, MCPServer, Agent, Chat } from '../models/types';

export class StorageService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.ensureDataDir();
    this.initializeDefaultData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private initializeDefaultData() {
    // Создаем файлы по умолчанию если их нет
    this.ensureFileExists('llm-models.json', []);
    this.ensureFileExists('mcp-servers.json', []);
    this.ensureFileExists('agents.json', []);
    this.ensureFileExists('chats.json', []);
  }

  private ensureFileExists(filename: string, defaultData: any) {
    const filePath = path.join(this.dataDir, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  private readJsonFile<T>(filename: string): T[] {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [] as T[];
    }
  }

  private writeJsonFile<T>(filename: string, data: T[]) {
    try {
      const filePath = path.join(this.dataDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      throw error;
    }
  }

  // LLM Models
  getLLMModels(): LLMConfig[] {
    return this.readJsonFile<LLMConfig>('llm-models.json');
  }

  saveLLMModel(model: LLMConfig): void {
    const models = this.getLLMModels();
    const existingIndex = models.findIndex((m: LLMConfig) => m.id === model.id);
    
    if (existingIndex >= 0) {
      models[existingIndex] = model;
    } else {
      models.push(model);
    }
    
    this.writeJsonFile('llm-models.json', models);
  }

  deleteLLMModel(id: string): void {
    const models = this.getLLMModels().filter((m: LLMConfig) => m.id !== id);
    this.writeJsonFile('llm-models.json', models);
  }

  // MCP Servers
  getMCPServers(): MCPServer[] {
    return this.readJsonFile<MCPServer>('mcp-servers.json');
  }

  saveMCPServer(server: MCPServer): void {
    const servers = this.getMCPServers();
    const existingIndex = servers.findIndex((s: MCPServer) => s.id === server.id);
    
    if (existingIndex >= 0) {
      servers[existingIndex] = server;
    } else {
      servers.push(server);
    }
    
    this.writeJsonFile('mcp-servers.json', servers);
  }

  deleteMCPServer(id: string): void {
    const servers = this.getMCPServers().filter((s: MCPServer) => s.id !== id);
    this.writeJsonFile('mcp-servers.json', servers);
  }

  // Agents
  getAgents(): Agent[] {
    return this.readJsonFile<Agent>('agents.json');
  }

  saveAgent(agent: Agent): void {
    const agents = this.getAgents();
    const existingIndex = agents.findIndex((a: Agent) => a.id === agent.id);
    
    if (existingIndex >= 0) {
      agents[existingIndex] = agent;
    } else {
      agents.push(agent);
    }
    
    this.writeJsonFile('agents.json', agents);
  }

  deleteAgent(id: string): void {
    const agents = this.getAgents().filter((a: Agent) => a.id !== id);
    this.writeJsonFile('agents.json', agents);
  }

  // Chats
  getChats(): Chat[] {
    return this.readJsonFile<Chat>('chats.json');
  }

  saveChat(chat: Chat): void {
    const chats = this.getChats();
    const existingIndex = chats.findIndex((c: Chat) => c.id === chat.id);
    
    if (existingIndex >= 0) {
      chats[existingIndex] = chat;
    } else {
      chats.push(chat);
    }
    
    this.writeJsonFile('chats.json', chats);
  }

  deleteChat(id: string): void {
    const chats = this.getChats().filter((c: Chat) => c.id !== id);
    this.writeJsonFile('chats.json', chats);
  }

  getChat(id: string): Chat | undefined {
    return this.getChats().find((c: Chat) => c.id === id);
  }
}
