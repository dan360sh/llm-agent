import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';

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

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  public start(port: number = 3000) {
    this.server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
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
