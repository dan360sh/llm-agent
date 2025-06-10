import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { ChatService } from '../services/chat.service';
import { Chat, Message } from '../models/types';

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Получить список всех чатов
 *     tags: [Chats]
 *     responses:
 *       200:
 *         description: Список чатов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Создать новый чат
 *     tags: [Chats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChatRequest'
 *     responses:
 *       201:
 *         description: Чат успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Агент не найден
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/chats/{id}/messages:
 *   post:
 *     summary: Отправить сообщение в чат
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID чата
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       200:
 *         description: Сообщение отправлено (обработка асинхронная)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 chatId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export class ChatController {
  private router: Router;
  private chatService: ChatService;
  private io: Server;

  constructor(chatService: ChatService, io: Server) {
    this.router = Router();
    this.chatService = chatService;
    this.io = io;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllChats.bind(this));
    this.router.get('/search', this.searchChats.bind(this));
    this.router.get('/:id', this.getChat.bind(this));
    this.router.post('/', this.createChat.bind(this));
    this.router.put('/:id', this.updateChat.bind(this));
    this.router.delete('/:id', this.deleteChat.bind(this));
    this.router.post('/:id/duplicate', this.duplicateChat.bind(this));
    this.router.post('/:id/clear', this.clearChat.bind(this));
    
    // Message operations
    this.router.post('/:id/messages', this.sendMessage.bind(this));
    this.router.put('/:id/messages/:messageId', this.updateMessage.bind(this));
    this.router.delete('/:id/messages/:messageId', this.deleteMessage.bind(this));
  }

  private async getAllChats(req: Request, res: Response) {
    try {
      const chats = this.chatService.getChats();
      res.json({ success: true, data: chats });
    } catch (error) {
      console.error('Error getting chats:', error);
      res.status(500).json({ success: false, error: 'Failed to get chats' });
    }
  }

  private async getChat(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const chat = this.chatService.getChat(id);
      
      if (!chat) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
      }

      res.json({ success: true, data: chat });
    } catch (error) {
      console.error('Error getting chat:', error);
      res.status(500).json({ success: false, error: 'Failed to get chat' });
    }
  }

  private async createChat(req: Request, res: Response) {
    try {
      const { agentId, name } = req.body;
      
      if (!agentId) {
        return res.status(400).json({ success: false, error: 'Agent ID is required' });
      }

      const chat = await this.chatService.createChat(agentId, name);
      res.status(201).json({ success: true, data: chat });
    } catch (error) {
      console.error('Error creating chat:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to create chat' });
      }
    }
  }

  private async updateChat(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const chat = await this.chatService.updateChat(id, updates);
      res.json(chat);
    } catch (error) {
      console.error('Error updating chat:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update chat' });
      }
    }
  }

  private async deleteChat(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.chatService.deleteChat(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ success: false, error: 'Failed to delete chat' });
    }
  }

  private async duplicateChat(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const duplicatedChat = await this.chatService.duplicateChat(id);
      res.status(201).json(duplicatedChat);
    } catch (error) {
      console.error('Error duplicating chat:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to duplicate chat' });
      }
    }
  }

  private async clearChat(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.chatService.clearChat(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing chat:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to clear chat' });
      }
    }
  }

  private async searchChats(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const chats = await this.chatService.searchChats(q);
      res.json(chats);
    } catch (error) {
      console.error('Error searching chats:', error);
      res.status(500).json({ error: 'Failed to search chats' });
    }
  }

  private async sendMessage(req: Request, res: Response) {
    try {
      console.log('HTTP sendMessage called');
      const { id } = req.params;
      const { content, images } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Message content is required' });
      }

      // Проверяем что чат существует
      const chat = this.chatService.getChat(id);
      if (!chat) {
        
        return res.status(404).json({ success: false, error: 'Chat not found' });
      }

      // Отправляем ответ немедленно для подтверждения получения сообщения
      res.json({ success: true, data: { chatId: id } });
      
      // Обрабатываем сообщение асинхронно с потоковым ответом
      this.handleMessageProcessing(id, content, images);

    } catch (error) {
      console.error('Error sending message:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to send message' });
      }
    }
  }

  // Общая функция для обработки сообщений (используется и в HTTP, и в WebSocket)
  public async handleMessageProcessing(chatId: string, content: string, images?: string[]): Promise<void> {
    try {
      console.log('ChatController: Processing message for chat:', chatId);
      console.log('ChatController: Content length:', content?.length);
      
      // Отправляем уведомление о начале генерации
      const messageId = Date.now().toString();
      console.log('ChatController: Emitting generation-start for chat:', chatId);
      this.io.to(chatId).emit('generation-start', {
        chatId,
        messageId
      });

      let streamingMessageId: string | null = messageId;
      let streamEnded = false;
      
      // Callback для потокового ответа с защитой от повторных вызовов
      const onStream = (chunk: string) => {
        if (streamEnded) {
          console.log('ChatController: Stream already ended, ignoring chunk');
          return;
        }
        
        try {
          console.log('ChatController: Streaming chunk:', chunk.substring(0, 50) + '...');
          this.io.to(chatId).emit('stream-response', {
            type: 'content',
            content: chunk,
            chatId,
            messageId: streamingMessageId
          });
        } catch (error) {
          console.error('ChatController: Error in onStream callback:', error);
        }
      };

      console.log('ChatController: Calling chatService.sendMessage...');
      // Отправляем сообщение и получаем ответ
      const assistantMessage = await this.chatService.sendMessage(
        chatId, 
        content, 
        images,
        onStream
      );

      // Помечаем поток как завершенный
      streamEnded = true;
      
      console.log('ChatController: Message sent successfully, assistant message ID:', assistantMessage.id);
      streamingMessageId = assistantMessage.id;

      // Отправляем финальное уведомление о завершении
      console.log('ChatController: Emitting generation completion events');
      this.io.to(chatId).emit('stream-response', {
        type: 'done',
        chatId,
        messageId: assistantMessage.id
      });

      this.io.to(chatId).emit('generation-complete', {
        chatId,
        messageId: assistantMessage.id
      });
      
      console.log('ChatController: Message processing completed successfully');

    } catch (error) {
      console.error('ChatController: Error in message processing:', error);
      console.error('ChatController: Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      // Отправляем ошибку через WebSocket
      this.io.to(chatId).emit('stream-response', {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        chatId
      });

      this.io.to(chatId).emit('generation-error', {
        chatId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // НЕ перебрасываем ошибку - это ключевое изменение!
      console.log('ChatController: Error handled, continuing...');
      // Не throw error; - это позволит WebSocket обработчику продолжить работу
    }
  }

  private async updateMessage(req: Request, res: Response) {
    try {
      const { id, messageId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const message = await this.chatService.updateMessage(id, messageId, content);
      
      // Отправляем обновление через WebSocket
      const updatedChat = this.chatService.getChat(id);
      this.io.to(id).emit('chat-updated', updatedChat);

      res.json(message);
    } catch (error) {
      console.error('Error updating message:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update message' });
      }
    }
  }

  private async deleteMessage(req: Request, res: Response) {
    try {
      const { id, messageId } = req.params;

      await this.chatService.deleteMessage(id, messageId);
      
      // Отправляем обновление через WebSocket
      const updatedChat = this.chatService.getChat(id);
      this.io.to(id).emit('chat-updated', updatedChat);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting message:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete message' });
      }
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
