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

    // Multer для загрузки файлов
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    const upload = multer({ 
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Разрешаем только изображения
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });

    this.app.use('/api/upload', upload.single('image'));

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

      socket.on('join-chat', (chatId: string) => {
        socket.join(chatId);
        console.log(`Client ${socket.id} joined chat ${chatId}`);
      });

      socket.on('leave-chat', (chatId: string) => {
        socket.leave(chatId);
        console.log(`Client ${socket.id} left chat ${chatId}`);
      });

      socket.on('send-message', async (data: { chatId: string, content: string, images?: string[] }) => {
        console.log('WebSocket message received:', data);
        
        try {
          const { chatId, content, images } = data;
          
          // Проверяем что чат существует
          const chat = this.chatService.getChat(chatId);
          if (!chat) {
            socket.emit('generation-error', {
              chatId,
              error: 'Chat not found'
            });
            return;
          }

          // Отправляем уведомление о начале генерации
          this.io.to(chatId).emit('generation-start', {
            chatId,
            messageId: Date.now().toString()
          });

          let streamingMessageId: string | null = null;
          
          // Callback для потокового ответа
          const onStream = (chunk: string) => {
            this.io.to(chatId).emit('stream-response', {
              type: 'content',
              content: chunk,
              chatId,
              messageId: streamingMessageId
            });
          };

          // Отправляем сообщение и получаем ответ
          const assistantMessage = await this.chatService.sendMessage(
            chatId, 
            content, 
            images,
            onStream
          );

          streamingMessageId = assistantMessage.id;

          // Отправляем финальное уведомление о завершении
          this.io.to(chatId).emit('stream-response', {
            type: 'done',
            chatId,
            messageId: assistantMessage.id
          });

          this.io.to(chatId).emit('generation-complete', {
            chatId,
            messageId: assistantMessage.id
          });

        } catch (error) {
          console.error('Error in WebSocket message handling:', error);
          
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