import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { specs } from './utils/swagger.config';

import { StorageService } from './storage/storage.service';
import { LLMService } from './services/llm.service';
import { AgentService } from './services/agent.service';
import { ChatService } from './services/chat.service';
import { MCPManager } from './mcp/mcp-manager';

import { LLMController } from './controllers/llm.controller';
import { AgentController } from './controllers/agent.controller';
import { ChatController } from './controllers/chat.controller';
import { MCPController } from './controllers/mcp.controller';

class App {
  private app: express.Application;
  private server: any;
  private io: Server;

  // Services
  private storageService!: StorageService;
  private llmService!: LLMService;
  private agentService!: AgentService;
  private chatService!: ChatService;
  private mcpManager!: MCPManager;

  // Controllers
  private llmController!: LLMController;
  private agentController!: AgentController;
  private chatController!: ChatController;
  private mcpController!: MCPController;

  constructor() {
    this.app = express();
    this.app.use(cors())
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.initializeServices();
    this.initializeControllers();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureSocketIO();
  }

  private initializeServices() {
    this.storageService = new StorageService();
    this.llmService = new LLMService(this.storageService);
    this.agentService = new AgentService(this.storageService);
    this.mcpManager = new MCPManager(this.storageService);
    this.chatService = new ChatService(
      this.storageService,
      this.llmService,
      this.agentService,
      this.mcpManager
    );
  }

  private initializeControllers() {
    this.llmController = new LLMController(this.llmService);
    this.agentController = new AgentController(this.agentService);
    this.chatController = new ChatController(this.chatService, this.io);
    this.mcpController = new MCPController(this.mcpManager);
  }

  private configureMiddleware() {
    // CORS
    this.app.use(cors());

    // JSON parser
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Static files для загруженных изображений
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Логирование запросов
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private configureRoutes() {
    // Swagger Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'LLM Agent API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
      },
    }));

    // API Routes
    this.app.use('/api/llm', this.llmController.getRouter());
    this.app.use('/api/agents', this.agentController.getRouter());
    this.app.use('/api/chats', this.chatController.getRouter());
    this.app.use('/api/mcp', this.mcpController.getRouter());

    // Upload endpoint
    this.app.post('/api/upload', (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        success: true, 
        filename: req.file.filename,
        url: fileUrl,
        path: fileUrl
      });
    });

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    });
  }

  private configureSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Добавляем хранение текущего чата для этого сокета
      let currentChatId: string | null = null;

      socket.on('join-chat', (chatId: string) => {
        // Если уже в другом чате, покидаем его
        if (currentChatId && currentChatId !== chatId) {
          socket.leave(currentChatId);
          console.log(`Client ${socket.id} left chat ${currentChatId}`);
        }
        
        socket.join(chatId);
        currentChatId = chatId;
        console.log(`Client ${socket.id} joined chat ${chatId}`);
        
        // Подтверждаем присоединение
        socket.emit('joined-chat', { chatId });
      });

      socket.on('leave-chat', (chatId: string) => {
        socket.leave(chatId);
        if (currentChatId === chatId) {
          currentChatId = null;
        }
        console.log(`Client ${socket.id} left chat ${chatId}`);
      });

      socket.on('send-message', async (data: { chatId: string, content: string, images?: string[] }) => {
        console.log('=== WebSocket message received ===');
        console.log('Socket ID:', socket.id);
        console.log('Data:', data);
        console.log('Current chat ID:', currentChatId);
        console.log('Socket rooms:', Array.from(socket.rooms));
        
        try {
          const { chatId, content, images } = data;
          console.log('Processing message for chat:', chatId, 'content length:', content?.length);
          
          // Убеждаемся, что сокет в правильной комнате
          if (!socket.rooms.has(chatId)) {
            console.log('Socket not in room, rejoining...');
            socket.join(chatId);
            currentChatId = chatId;
          }
          
          // Проверяем что чат существует
          const chat = this.chatService.getChat(chatId);
          if (!chat) {
            console.error('Chat not found:', chatId);
            socket.emit('generation-error', {
              chatId,
              error: 'Chat not found'
            });
            return;
          }
          
          console.log('Chat found, proceeding with message processing...');
          
          // Обрабатываем сообщение
          await this.chatController.handleMessageProcessing(chatId, content, images);
          
          console.log('=== Message processing completed successfully ===');
          
          // ПРИНУДИТЕЛЬНО переподключаем сокет к комнате после обработки
          setTimeout(() => {
            if (socket.connected) {
              socket.leave(chatId);
              socket.join(chatId);
              console.log(`Socket ${socket.id} rejoined chat ${chatId} after message processing`);
            }
          }, 100);

        } catch (error) {
          console.error('=== Error in WebSocket message handling ===');
          console.error('Error:', error);
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
          
          // Отправляем ошибку напрямую клиенту
          socket.emit('stream-response', {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            chatId: data.chatId
          });

          socket.emit('generation-error', {
            chatId: data.chatId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      socket.on('stop-generation', (data: { chatId: string }) => {
        console.log('Stop generation requested for chat:', data.chatId);
        
        // TODO: Реализовать остановку генерации
        // Сейчас просто отправим уведомление о завершении
        this.io.to(data.chatId).emit('generation-complete', {
          chatId: data.chatId,
          messageId: Date.now().toString()
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (currentChatId) {
          console.log('Client was in chat:', currentChatId);
        }
      });
      
      // Добавляем ping-pong для поддержания соединения
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  public start(port: number = 3000) {
    this.server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
      console.log(`📁 Data directory: ${path.join(__dirname, '../data')}`);
      console.log(`📷 Uploads directory: ${path.join(__dirname, '../uploads')}`);
    });
  }

  public getApp() {
    return this.app;
  }

  public getIO() {
    return this.io;
  }
}

export default App;