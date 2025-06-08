import { MCPServer, MCPConfig } from '../models/types';
import { MCPClient } from './mcp-client';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';

export class MCPManager {
  private storageService: StorageService;
  private clients: Map<string, MCPClient> = new Map();

  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.initializeServers();
  }

  private async initializeServers() {
    const servers = this.storageService.getMCPServers();
    
    for (const server of servers) {
      if (server.enabled) {
        try {
          await this.startServer(server.id);
        } catch (error) {
          console.error(`Failed to start MCP server ${server.name}:`, error);
          // Обновляем статус сервера
          server.status = 'error';
          this.storageService.saveMCPServer(server);
        }
      }
    }
  }

  async addServer(config: Omit<MCPServer, 'id' | 'createdAt' | 'status'>): Promise<MCPServer> {
    const server: MCPServer = {
      ...config,
      id: uuidv4(),
      status: 'stopped',
      createdAt: new Date()
    };

    this.storageService.saveMCPServer(server);

    if (server.enabled) {
      try {
        await this.startServer(server.id);
      } catch (error) {
        server.status = 'error';
        this.storageService.saveMCPServer(server);
        throw error;
      }
    }

    return server;
  }

  async updateServer(server: MCPServer): Promise<void> {
    const wasRunning = this.clients.has(server.id);
    
    if (wasRunning) {
      await this.stopServer(server.id);
    }

    this.storageService.saveMCPServer(server);

    if (server.enabled) {
      try {
        await this.startServer(server.id);
      } catch (error) {
        server.status = 'error';
        this.storageService.saveMCPServer(server);
        throw error;
      }
    }
  }

  async deleteServer(id: string): Promise<void> {
    await this.stopServer(id);
    this.storageService.deleteMCPServer(id);
  }

  async startServer(id: string): Promise<void> {
    const server = this.getServer(id);
    if (!server) {
      throw new Error(`Server not found: ${id}`);
    }

    if (this.clients.has(id)) {
      return; // Уже запущен
    }

    const client = new MCPClient(server);
    
    try {
      await client.start();
      this.clients.set(id, client);
      
      // Обновляем статус
      server.status = 'running';
      this.storageService.saveMCPServer(server);
      
    } catch (error) {
      server.status = 'error';
      this.storageService.saveMCPServer(server);
      throw error;
    }
  }

  async stopServer(id: string): Promise<void> {
    const client = this.clients.get(id);
    if (client) {
      await client.stop();
      this.clients.delete(id);
    }

    const server = this.getServer(id);
    if (server) {
      server.status = 'stopped';
      this.storageService.saveMCPServer(server);
    }
  }

  async toggleServer(id: string): Promise<void> {
    const server = this.getServer(id);
    if (!server) {
      throw new Error(`Server not found: ${id}`);
    }

    if (server.enabled && server.status === 'running') {
      await this.stopServer(id);
      server.enabled = false;
    } else {
      server.enabled = true;
      await this.startServer(id);
    }

    this.storageService.saveMCPServer(server);
  }

  getServers(): MCPServer[] {
    return this.storageService.getMCPServers();
  }

  getServer(id: string): MCPServer | undefined {
    return this.storageService.getMCPServers().find((s: MCPServer) => s.id === id);
  }

  getClient(id: string): MCPClient | undefined {
    return this.clients.get(id);
  }

  getRunningClients(): Map<string, MCPClient> {
    return this.clients;
  }

  async importFromConfig(config: MCPConfig): Promise<void> {
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      const existingServer = this.getServers().find((s: MCPServer) => s.name === name);
      
      if (!existingServer) {
        await this.addServer({
          name,
          command: serverConfig.command,
          args: serverConfig.args,
          enabled: true
        });
      }
    }
  }

  async getAvailableTools(serverIds: string[]) {
    const tools = [];
    
    for (const serverId of serverIds) {
      const client = this.clients.get(serverId);
      if (client && client.isRunning()) {
        const serverTools = client.getTools();
        tools.push(...serverTools.map(tool => ({
          ...tool,
          serverId
        })));
      }
    }

    return tools;
  }

  async callTool(serverId: string, toolName: string, arguments_: any) {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`MCP server not running: ${serverId}`);
    }

    return await client.callTool(toolName, arguments_);
  }
}
