import { Router, Request, Response } from 'express';
import { AgentService } from '../services/agent.service';
import { Agent } from '../models/types';

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: Получить список всех агентов
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: Список агентов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agent'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Создать нового агента
 *     tags: [Agents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, systemPrompt, llmConfigId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Мой ассистент"
 *               description:
 *                 type: string
 *                 example: "Помощник общего назначения"
 *               systemPrompt:
 *                 type: string
 *                 example: "You are a helpful AI assistant."
 *               llmConfigId:
 *                 type: string
 *                 example: "uuid-12345"
 *               mcpServerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["mcp-server-1", "mcp-server-2"]
 *     responses:
 *       201:
 *         description: Агент успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     summary: Получить агента по ID
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID агента
 *     responses:
 *       200:
 *         description: Агент
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Обновить агента
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID агента
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Agent'
 *     responses:
 *       200:
 *         description: Агент успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Удалить агента
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID агента
 *     responses:
 *       204:
 *         description: Агент успешно удален
 *       400:
 *         description: Нельзя удалить последнего агента
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/agents/{id}/duplicate:
 *   post:
 *     summary: Дублировать агента
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID агента
 *     responses:
 *       201:
 *         description: Агент успешно дублирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

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
