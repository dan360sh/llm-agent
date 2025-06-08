import { Router, Request, Response } from 'express';
import { LLMService } from '../services/llm.service';
import { LLMConfig } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * @swagger
 * /api/llm:
 *   get:
 *     summary: Получить список всех LLM моделей
 *     tags: [LLM Models]
 *     responses:
 *       200:
 *         description: Список LLM моделей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LLMConfig'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Добавить новую LLM модель
 *     tags: [LLM Models]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, provider, config]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "OpenRouter GPT-4O"
 *               provider:
 *                 type: string
 *                 enum: [openai, ollama]
 *                 example: "openai"
 *               config:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/OpenAIConfig'
 *                   - $ref: '#/components/schemas/OllamaConfig'
 *               supportsImages:
 *                 type: boolean
 *                 example: true
 *               enabled:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: LLM модель успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LLMConfig'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/llm/{id}:
 *   get:
 *     summary: Получить LLM модель по ID
 *     tags: [LLM Models]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID LLM модели
 *     responses:
 *       200:
 *         description: LLM модель
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LLMConfig'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Обновить LLM модель
 *     tags: [LLM Models]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID LLM модели
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LLMConfig'
 *     responses:
 *       200:
 *         description: LLM модель успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LLMConfig'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Удалить LLM модель
 *     tags: [LLM Models]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID LLM модели
 *     responses:
 *       204:
 *         description: LLM модель успешно удалена
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/llm/{id}/test:
 *   post:
 *     summary: Тестировать подключение к LLM модели
 *     tags: [LLM Models]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID LLM модели
 *     responses:
 *       200:
 *         description: Результат тестирования подключения
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Успешность подключения
 *                 message:
 *                   type: string
 *                   description: Сообщение о результате
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export class LLMController {
  private router: Router;
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.router = Router();
    this.llmService = llmService;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllModels.bind(this));
    this.router.get('/:id', this.getModel.bind(this));
    this.router.post('/', this.addModel.bind(this));
    this.router.put('/:id', this.updateModel.bind(this));
    this.router.delete('/:id', this.deleteModel.bind(this));
    this.router.post('/:id/test', this.testConnection.bind(this));
  }

  private async getAllModels(req: Request, res: Response) {
    try {
      const models = this.llmService.getLLMModels();
      res.json(models);
    } catch (error) {
      console.error('Error getting LLM models:', error);
      res.status(500).json({ error: 'Failed to get LLM models' });
    }
  }

  private async getModel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const model = this.llmService.getLLMModel(id);
      
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      res.json(model);
    } catch (error) {
      console.error('Error getting LLM model:', error);
      res.status(500).json({ error: 'Failed to get LLM model' });
    }
  }

  private async addModel(req: Request, res: Response) {
    try {
      const modelData = req.body;
      
      // Валидация
      if (!modelData.name || !modelData.provider || !modelData.config) {
        return res.status(400).json({ error: 'Name, provider, and config are required' });
      }

      const model: LLMConfig = {
        id: uuidv4(),
        name: modelData.name,
        provider: modelData.provider,
        config: modelData.config,
        supportsImages: modelData.supportsImages || false,
        enabled: modelData.enabled !== false,
        createdAt: new Date()
      };

      await this.llmService.addLLMModel(model);
      res.status(201).json(model);
    } catch (error) {
      console.error('Error adding LLM model:', error);
      res.status(500).json({ error: 'Failed to add LLM model' });
    }
  }

  private async updateModel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingModel = this.llmService.getLLMModel(id);
      if (!existingModel) {
        return res.status(404).json({ error: 'Model not found' });
      }

      const updatedModel: LLMConfig = {
        ...existingModel,
        ...updates,
        id: existingModel.id,
        createdAt: existingModel.createdAt
      };

      await this.llmService.updateLLMModel(updatedModel);
      res.json(updatedModel);
    } catch (error) {
      console.error('Error updating LLM model:', error);
      res.status(500).json({ error: 'Failed to update LLM model' });
    }
  }

  private async deleteModel(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const model = this.llmService.getLLMModel(id);
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      await this.llmService.deleteLLMModel(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting LLM model:', error);
      res.status(500).json({ error: 'Failed to delete LLM model' });
    }
  }

  private async testConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const model = this.llmService.getLLMModel(id);
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      const isConnected = await this.llmService.testConnection(id);
      res.json({ 
        success: isConnected,
        message: isConnected ? 'Connection successful' : 'Connection failed'
      });
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to test connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
