import { spawn, ChildProcess } from 'child_process';
import { MCPServer } from '../models/types';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export class MCPClient {
  private process: ChildProcess | null = null;
  private server: MCPServer;
  private tools: MCPTool[] = [];
  private resources: MCPResource[] = [];

  constructor(server: MCPServer) {
    this.server = server;
  }

  async start(): Promise<void> {
    try {
      this.process = spawn(this.server.command, this.server.args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.on('error', (error) => {
        console.error(`MCP Server ${this.server.name} error:`, error);
      });

      this.process.on('exit', (code) => {
        console.log(`MCP Server ${this.server.name} exited with code ${code}`);
      });

      // Инициализируем соединение
      await this.initialize();
      
    } catch (error) {
      console.error(`Failed to start MCP server ${this.server.name}:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  private async initialize(): Promise<void> {
    // Отправляем initialize запрос
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        clientInfo: {
          name: 'llm-agent',
          version: '1.0.0'
        }
      }
    };

    await this.sendRequest(initRequest);
    
    // Получаем доступные инструменты
    await this.listTools();
    await this.listResources();
  }

  private async sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        reject(new Error('MCP process not available'));
        return;
      }

      const requestStr = JSON.stringify(request) + '\n';
      this.process.stdin.write(requestStr);

      // Простая обработка ответа (в реальной реализации нужен более сложный парсер)
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      this.process.stdout?.once('data', (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async listTools(): Promise<MCPTool[]> {
    try {
      const response = await this.sendRequest({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list'
      });

      this.tools = response.result?.tools || [];
      return this.tools;
    } catch (error) {
      console.error('Failed to list tools:', error);
      return [];
    }
  }

  async listResources(): Promise<MCPResource[]> {
    try {
      const response = await this.sendRequest({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'resources/list'
      });

      this.resources = response.result?.resources || [];
      return this.resources;
    } catch (error) {
      console.error('Failed to list resources:', error);
      return [];
    }
  }

  async callTool(name: string, arguments_: any): Promise<any> {
    try {
      const response = await this.sendRequest({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name,
          arguments: arguments_
        }
      });

      return response.result;
    } catch (error) {
      console.error(`Failed to call tool ${name}:`, error);
      throw error;
    }
  }

  async readResource(uri: string): Promise<any> {
    try {
      const response = await this.sendRequest({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'resources/read',
        params: {
          uri
        }
      });

      return response.result;
    } catch (error) {
      console.error(`Failed to read resource ${uri}:`, error);
      throw error;
    }
  }

  getTools(): MCPTool[] {
    return this.tools;
  }

  getResources(): MCPResource[] {
    return this.resources;
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}
