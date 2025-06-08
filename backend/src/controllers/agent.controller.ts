import { Router, Request, Response } from 'express';
import { AgentService } from '../services/agent.service';
import { Agent } from '../models/types';

export class AgentController {
  private router: Router;
  private agentService: AgentService;

  constructor(agentService: AgentService) {
    this.router = Router();
    this.agentService = agentService;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllAgents.bind(this));
    this.router.get('/:id', this.getAgent.bind(this));
    this.router.post('/', this.createAgent.bind(this));
    this.router.put('/:id', this.updateAgent.bind(this));
    this.router.delete('/:id', this.deleteAgent.bind(this));
    this.router.post('/:id/duplicate', this.duplicateAgent.bind(this));
  }

  private async getAllAgents(req: Request, res: Response) {
    try {
      const agents = this.agentService.getAgents();
      res.json(agents);
    } catch (error) {
      console.error('Error getting agents:', error);
      res.status(500).json({ error: 'Failed to get agents' });
    }
  }

  private async getAgent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const agent = this.agentService.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      res.json(agent);
    } catch (error) {
      console.error('Error getting agent:', error);
      res.status(500).json({ error: 'Failed to get agent' });
    }
  }

  private async createAgent(req: Request, res: Response) {
    try {
      const agentData = req.body;
      
      // Валидация
      const validationErrors = await this.agentService.validateAgent(agentData);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validationErrors
        });
      }

      const agent = await this.agentService.createAgent(agentData);
      res.status(201).json(agent);
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  }

  private async updateAgent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Валидация обновлений
      const validationErrors = await this.agentService.validateAgent({
        ...this.agentService.getAgent(id),
        ...updates
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validationErrors
        });
      }

      const agent = await this.agentService.updateAgent(id, updates);
      res.json(agent);
    } catch (error) {
      console.error('Error updating agent:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update agent' });
      }
    }
  }

  private async deleteAgent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.agentService.deleteAgent(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting agent:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('Cannot delete')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete agent' });
      }
    }
  }

  private async duplicateAgent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const duplicatedAgent = await this.agentService.duplicateAgent(id);
      res.status(201).json(duplicatedAgent);
    } catch (error) {
      console.error('Error duplicating agent:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to duplicate agent' });
      }
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
