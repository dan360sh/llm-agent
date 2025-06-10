import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebSocketService, StreamResponse, ConnectionStatus } from '../../services/websocket.service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  timestamp: Date;
}

interface Chat {
  id: string;
  name: string;
  agentId?: string;
  llmModelId?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  chat: Chat | null = null;
  messages: Message[] = [];
  messageText = '';
  isGenerating = false;
  loading = true;
  statusMessage = '';
  connectionStatus: ConnectionStatus = { connected: false };
  currentStreamMessage = '';
  
  private routeSubscription?: Subscription;
  private streamSubscription?: Subscription;
  private connectionSubscription?: Subscription;
  private shouldScrollToBottom = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit() {
    // Подписываемся на статус подключения
    this.connectionSubscription = this.webSocketService.getConnectionStatus().subscribe(status => {
      this.connectionStatus = status;
      if (status.error) {
        this.statusMessage = `Connection error: ${status.error}`;
      }
    });

    // Подписываемся на потоковые ответы
    this.streamSubscription = this.webSocketService.getStreamResponse().subscribe(response => {
      this.handleStreamResponse(response);
    });

    // Подписываемся на параметры маршрута
    this.routeSubscription = this.route.params.subscribe(params => {
      const chatId = params['id'];
      if (chatId) {
        this.loadChat(chatId);
      } else {
        this.loading = false;
      }
    });
  }

  ngOnDestroy() {
    this.routeSubscription?.unsubscribe();
    this.streamSubscription?.unsubscribe();
    this.connectionSubscription?.unsubscribe();
    this.webSocketService.leaveChat();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadChat(chatId: string) {
    this.loading = true;
    console.log('Loading chat with ID:', chatId);
    
    // Получаем все чаты и находим нужный по ID
    this.http.get<{success: boolean, data: Chat[]}>('http://localhost:3000/api/chats').subscribe({
      next: (response) => {
        console.log('All chats received:', response);
        const chats = response.data || [];
        const foundChat = chats.find(chat => chat.id === chatId);
        
        if (foundChat) {
          console.log('Chat found:', foundChat);
          this.chat = foundChat;
          this.messages = foundChat.messages || [];
          this.loading = false;
          this.shouldScrollToBottom = true;
          
          // Присоединяемся к WebSocket комнате чата
          this.webSocketService.joinChat(chatId);
        } else {
          console.log('Chat not found with ID:', chatId);
          this.loading = false;
          this.statusMessage = 'Chat not found';
        }
      },
      error: (error) => {
        console.error('Error loading chats:', error);
        this.loading = false;
        this.statusMessage = 'Error loading chats: ' + (error.error?.message || error.message || 'Unknown error');
      }
    });
  }

  handleStreamResponse(response: StreamResponse) {
    console.log('Handling stream response:', response);
    
    switch (response.type) {
      case 'start':
        this.isGenerating = true;
        this.currentStreamMessage = '';
        this.shouldScrollToBottom = true;
        break;
        
      case 'content':
        if (response.content) {
          this.currentStreamMessage += response.content;
          this.shouldScrollToBottom = true;
        }
        break;
        
      case 'done':
        this.isGenerating = false;
        if (this.currentStreamMessage) {
          // Добавляем завершенное сообщение в список
          const assistantMessage: Message = {
            id: response.messageId || Date.now().toString(),
            role: 'assistant',
            content: this.currentStreamMessage,
            timestamp: new Date()
          };
          this.messages.push(assistantMessage);
          this.currentStreamMessage = '';
          this.shouldScrollToBottom = true;
        }
        break;
        
      case 'error':
        this.isGenerating = false;
        this.currentStreamMessage = '';
        this.statusMessage = `Error: ${response.error || 'Unknown error'}`;
        break;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const content = this.messageText.trim();
    if (!content || !this.chat || this.isGenerating || !this.connectionStatus.connected) return;

    // Добавляем сообщение пользователя сразу
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.messageText = '';
    this.shouldScrollToBottom = true;

    // Отправляем сообщение через WebSocket
    this.webSocketService.sendMessage(this.chat.id, content);
    this.statusMessage = '';
  }

  stopGeneration() {
    this.webSocketService.stopGeneration();
    this.isGenerating = false;
    this.currentStreamMessage = '';
  }

  reconnectWebSocket() {
    this.webSocketService.reconnect();
    this.statusMessage = 'Attempting to reconnect...';
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  goBack() {
    this.router.navigate(['/chats']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageContent(content: string): string {
    // Simple formatting - convert line breaks to <br>
    return content.replace(/\n/g, '<br>');
  }

  getCurrentTime(): string {
    return this.formatTime(new Date());
  }
}