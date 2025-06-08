import { Router, Request, Response } from 'express';
import { MCPManager } from '../mcp/mcp-manager';
import { MCPServer, MCPConfig } from '../models/types';

export class MCPController {
  private router: Router;
  private mcpManager: MCPManager;

  constructor(mcpManager: MCPManager) {
    this.router = Router();
    this.mcpManager = mcpManager;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllServers.bind(this));
    this.router.get('/:id', this.getServer.bind(this));
    this.router.post('/', this.addServer.bind(this));
    this.router.put('/:id', this.updateServer.bind(this));
    this.router.delete('/:id', this.deleteServer.bind(this));
    this.router.post('/:id/toggle', this.toggleServer.bind(this));
    this.router.post('/:id/start', this.startServer.bind(this));
    this.router.post('/:id/stop', this.stopServer.bind(this));
    this.router.get('/:id/tools', this.getServerTools.bind(this));
    this.router.get('/:id/resources', this.getServerResources.bind(this));
    this.router.post('/:id/call-tool', this.callTool.bind(this));
    this.router.post('/import-config', this.importConfig.bind(this));
  }

  private async getAllServers(req: Request, res: Response) {
    try {
      const servers = this.mcpManager.getServers();
      res.json(servers);
    } catch (error) {
      console.error('Error getting MCP servers:', error);
      res.status(500).json({ error: 'Failed to get MCP servers' });
    }
  }

  private async getServer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const server = this.mcpManager.getServer(id);
      
      if (!server) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      res.json(server);
    } catch (error) {
      console.error('Error getting MCP server:', error);
      res.status(500).json({ error: 'Failed to get MCP server' });
    }
  }

  private async addServer(req: Request, res: Response) {
    try {
      const serverData = req.body;
      
      // Валидация
      if (!serverData.name || !serverData.command || !Array.isArray(serverData.args)) {
        return res.status(400).json({ 
          error: 'Name, command, and args are required' 
        });
      }

      const server = await this.mcpManager.addServer({
        name: serverData.name,
        command: serverData.command,
        args: serverData.args,
        enabled: serverData.enabled !== false
      });

      res.status(201).json(server);
    } catch (error) {
      console.error('Error adding MCP server:', error);
      res.status(500).json({ error: 'Failed to add MCP server' });
    }
  }

  private async updateServer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingServer = this.mcpManager.getServer(id);
      if (!existingServer) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      const updatedServer: MCPServer = {
        ...existingServer,
        ...updates,
        id: existingServer.id,
        createdAt: existingServer.createdAt
      };

      await this.mcpManager.updateServer(updatedServer);
      res.json(updatedServer);
    } catch (error) {
      console.error('Error updating MCP server:', error);
      res.status(500).json({ error: 'Failed to update MCP server' });
    }
  }

  private async deleteServer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const server = this.mcpManager.getServer(id);
      if (!server) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      await this.mcpManager.deleteServer(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting MCP server:', error);
      res.status(500).json({ error: 'Failed to delete MCP server' });
    }
  }

  private async toggleServer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.mcpManager.toggleServer(id);
      
      const updatedServer = this.mcpManager.getServer(id);
      res.json(updatedServer);
    } catch (error) {
      console.error('Error toggling MCP server:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to toggle MCP server' });
      }
    }
  }

  private async startServer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.mcpManager.startServer(id);
      
      const updatedServer = this.mcpManager.getServer(id);
      res.json({ 
        success: true, 
        server: updatedServer,
        message: 'Server started successfully'
      });
    } catch (error) {
      console.error('Error starting MCP server:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Failed to start MCP server',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async stopServer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.mcpManager.stopServer(id);
      
      const updatedServer = this.mcpManager.getServer(id);
      res.json({ 
        success: true, 
        server: updatedServer,
        message: 'Server stopped successfully'
      });
    } catch (error) {
      console.error('Error stopping MCP server:', error);
      res.status(500).json({ error: 'Failed to stop MCP server' });
    }
  }

  private async getServerTools(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const client = this.mcpManager.getClient(id);
      if (!client) {
        return res.status(404).json({ error: 'MCP server not running' });
      }

      const tools = await client.listTools();
      res.json(tools);
    } catch (error) {
      console.error('Error getting MCP server tools:', error);
      res.status(500).json({ error: 'Failed to get server tools' });
    }
  }

  private async getServerResources(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const client = this.mcpManager.getClient(id);
      if (!client) {
        return res.status(404).json({ error: 'MCP server not running' });
      }

      const resources = await client.listResources();
      res.json(resources);
    } catch (error) {
      console.error('Error getting MCP server resources:', error);
      res.status(500).json({ error: 'Failed to get server resources' });
    }
  }

  private async callTool(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { toolName, arguments: args } = req.body;

      if (!toolName) {
        return res.status(400).json({ error: 'Tool name is required' });
      }

      const result = await this.mcpManager.callTool(id, toolName, args || {});
      res.json(result);
    } catch (error) {
      console.error('Error calling MCP tool:', error);
      if (error instanceof Error && error.message.includes('not running')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Failed to call tool',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async importConfig(req: Request, res: Response) {
    try {
      const config: MCPConfig = req.body;

      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        return res.status(400).json({ 
          error: 'Invalid config format. Expected mcpServers object' 
        });
      }

      await this.mcpManager.importFromConfig(config);
      
      const servers = this.mcpManager.getServers();
      res.json({ 
        success: true, 
        message: 'Config imported successfully',
        servers
      });
    } catch (error) {
      console.error('Error importing MCP config:', error);
      res.status(500).json({ error: 'Failed to import config' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
