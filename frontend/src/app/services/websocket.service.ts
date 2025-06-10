import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface StreamResponse {
  type: 'content' | 'done' | 'error' | 'start';
  content?: string;
  error?: string;
  chatId?: string;
  messageId?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private streamSubject = new Subject<StreamResponse>();
  private connectionStatus = new BehaviorSubject<ConnectionStatus>({ connected: false });
  private currentChatId: string | null = null;
  private isGenerating = false;

  constructor() {
    this.connect();
  }

  connect(): void {
    try {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected:', this.socket?.id);
        this.connectionStatus.next({ connected: true });
        
        // Начинаем ping-pong для поддержания соединения
        this.startPingPong();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.connectionStatus.next({ connected: false });
        this.isGenerating = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.connectionStatus.next({ connected: false, error: error.message });
      });

      // Слушаем потоковые ответы от LLM
      this.socket.on('stream-response', (data: StreamResponse) => {
        console.log('Received stream response:', data);
        this.streamSubject.next(data);
        
        if (data.type === 'done' || data.type === 'error') {
          this.isGenerating = false;
        }
      });

      // Слушаем начало генерации
      this.socket.on('generation-start', (data: { chatId: string, messageId: string }) => {
        console.log('Generation started:', data);
        this.isGenerating = true;
        this.streamSubject.next({
          type: 'start',
          chatId: data.chatId,
          messageId: data.messageId
        });
      });

      // Слушаем завершение генерации
      this.socket.on('generation-complete', (data: { chatId: string, messageId: string }) => {
        console.log('Generation completed:', data);
        this.isGenerating = false;
        this.streamSubject.next({
          type: 'done',
          chatId: data.chatId,
          messageId: data.messageId
        });
      });

      // Слушаем ошибки генерации
      this.socket.on('generation-error', (data: { chatId: string, error: string }) => {
        console.error('Generation error:', data);
        this.isGenerating = false;
        this.streamSubject.next({
          type: 'error',
          chatId: data.chatId,
          error: data.error
        });
      });
      
      // Обрабатываем pong ответы
      this.socket.on('pong', () => {
        console.log('Received pong from server');
      });

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.connectionStatus.next({ connected: false, error: 'Failed to connect' });
    }
  }
  
  private startPingPong(): void {
    if (this.socket) {
      // Отправляем ping каждые 30 секунд
      setInterval(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('ping');
        }
      }, 30000);
    }
  }

  disconnect(): void {
    if (this.socket) {
      if (this.currentChatId) {
        this.socket.emit('leave-chat', this.currentChatId);
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus.next({ connected: false });
    this.isGenerating = false;
  }

  joinChat(chatId: string): void {
    if (this.socket && this.socket.connected) {
      // Покидаем предыдущий чат если есть
      if (this.currentChatId && this.currentChatId !== chatId) {
        this.socket.emit('leave-chat', this.currentChatId);
      }
      
      // Присоединяемся к новому чату
      this.socket.emit('join-chat', chatId);
      this.currentChatId = chatId;
      console.log('Joining chat:', chatId);
      
      // Ожидаем подтверждения
      this.socket.once('joined-chat', (data: { chatId: string }) => {
        console.log('Successfully joined chat:', data.chatId);
      });
    } else {
      console.error('WebSocket not connected, cannot join chat');
      // Попытаемся переподключиться
      this.reconnect();
    }
  }

  leaveChat(): void {
    if (this.socket && this.currentChatId) {
      this.socket.emit('leave-chat', this.currentChatId);
      this.currentChatId = null;
      console.log('Left current chat');
    }
  }

  sendMessage(chatId: string, content: string, images?: string[]): void {
    if (this.socket && this.socket.connected) {
      const messageData = {
        chatId,
        content,
        images: images || []
      };
      
      console.log('Sending message:', messageData);
      this.socket.emit('send-message', messageData);
      this.isGenerating = true;
    } else {
      console.error('WebSocket not connected');
      this.streamSubject.next({
        type: 'error',
        error: 'WebSocket not connected'
      });
    }
  }

  stopGeneration(): void {
    if (this.socket && this.currentChatId) {
      console.log('Stopping generation for chat:', this.currentChatId);
      this.socket.emit('stop-generation', { chatId: this.currentChatId });
      this.isGenerating = false;
    }
  }

  getStreamResponse(): Observable<StreamResponse> {
    return this.streamSubject.asObservable();
  }

  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus.asObservable();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  isCurrentlyGenerating(): boolean {
    return this.isGenerating;
  }

  getCurrentChatId(): string | null {
    return this.currentChatId;
  }

  // Метод для переподключения
  reconnect(): void {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}