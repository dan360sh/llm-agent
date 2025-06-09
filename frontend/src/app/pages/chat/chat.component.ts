import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
  template: `
    <div class="chat-container" *ngIf="chat">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="chat-info">
          <h2>{{ chat.name }}</h2>
          <p class="chat-meta">{{ messages.length }} messages • Created {{ formatDate(chat.createdAt) }}</p>
        </div>
        <div class="chat-actions">
          <button (click)="goBack()" class="btn btn-secondary">
            ← Back to Chats
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="messages-container" #messagesContainer>
        <div *ngIf="messages.length === 0" class="empty-chat">
          <div class="empty-state">
            <h3>Start a conversation</h3>
            <p>Send your first message to begin chatting</p>
          </div>
        </div>

        <div *ngFor="let message of messages" 
             class="message" 
             [class.user-message]="message.role === 'user'"
             [class.assistant-message]="message.role === 'assistant'">
          <div class="message-avatar">
            <span *ngIf="message.role === 'user'" class="avatar user-avatar">👤</span>
            <span *ngIf="message.role === 'assistant'" class="avatar assistant-avatar">🤖</span>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-role">{{ message.role === 'user' ? 'You' : 'Assistant' }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-text" [innerHTML]="formatMessageContent(message.content)"></div>
            <div *ngIf="message.images && message.images.length > 0" class="message-images">
              <div *ngFor="let image of message.images" class="image-placeholder">
                📷 {{ image }}
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="isGenerating" class="message assistant-message generating">
          <div class="message-avatar">
            <span class="avatar assistant-avatar">🤖</span>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-role">Assistant</span>
              <span class="message-time">Typing...</span>
            </div>
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-container">
        <div class="input-wrapper">
          <textarea [(ngModel)]="messageText" 
                    (keydown)="onKeyDown($event)"
                    placeholder="Type your message..." 
                    class="message-input"
                    rows="1"
                    #messageInput></textarea>
          <button (click)="sendMessage()" 
                  [disabled]="!messageText.trim() || isGenerating"
                  class="send-button"
                  [class.disabled]="!messageText.trim() || isGenerating">
            <span *ngIf="!isGenerating">Send</span>
            <span *ngIf="isGenerating">Sending...</span>
          </button>
        </div>
        <div *ngIf="statusMessage" class="status-message" 
             [class.error]="statusMessage.includes('Error')" 
             [class.success]="!statusMessage.includes('Error')">
          {{ statusMessage }}
        </div>
      </div>
    </div>

    <div *ngIf="!chat && !loading" class="error-state">
      <h3>Chat not found</h3>
      <p>The chat you're looking for doesn't exist or has been deleted.</p>
      <button (click)="goBack()" class="btn btn-primary">Go back to chats</button>
    </div>

    <div *ngIf="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading chat...</p>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 1000px;
      margin: 0 auto;
      background: white;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 25px;
      border-bottom: 1px solid #e0e0e0;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .chat-info h2 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 24px;
    }

    .chat-meta {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .chat-actions .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: #9e9e9e;
      color: white;
    }

    .btn-secondary:hover {
      background: #757575;
    }

    .btn-primary {
      background: #2196f3;
      color: white;
    }

    .btn-primary:hover {
      background: #1976d2;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px 25px;
      background: #f8f9fa;
    }

    .empty-chat {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      text-align: center;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 20px;
    }

    .empty-state p {
      margin: 0;
      color: #999;
      font-size: 16px;
    }

    .message {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      max-width: 80%;
    }

    .user-message {
      margin-left: auto;
      flex-direction: row-reverse;
    }

    .assistant-message {
      margin-right: auto;
    }

    .message-avatar {
      flex-shrink: 0;
    }

    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 20px;
    }

    .user-avatar {
      background: #2196f3;
      color: white;
    }

    .assistant-avatar {
      background: #4caf50;
      color: white;
    }

    .message-content {
      flex: 1;
      background: white;
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .user-message .message-content {
      background: #2196f3;
      color: white;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .message-role {
      font-weight: 600;
      font-size: 14px;
    }

    .user-message .message-role {
      color: rgba(255,255,255,0.9);
    }

    .message-time {
      font-size: 12px;
      color: #999;
    }

    .user-message .message-time {
      color: rgba(255,255,255,0.7);
    }

    .message-text {
      line-height: 1.5;
      font-size: 15px;
    }

    .message-images {
      margin-top: 10px;
    }

    .image-placeholder {
      display: inline-block;
      background: #f0f0f0;
      padding: 8px 12px;
      border-radius: 6px;
      margin-right: 8px;
      font-size: 14px;
      color: #666;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes typing {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    .input-container {
      padding: 20px 25px;
      background: white;
      border-top: 1px solid #e0e0e0;
    }

    .input-wrapper {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .message-input {
      flex: 1;
      min-height: 20px;
      max-height: 120px;
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 24px;
      font-size: 15px;
      font-family: inherit;
      resize: none;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .message-input:focus {
      border-color: #2196f3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    }

    .send-button {
      padding: 12px 24px;
      background: #2196f3;
      color: white;
      border: none;
      border-radius: 24px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .send-button:hover:not(.disabled) {
      background: #1976d2;
    }

    .send-button.disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .status-message {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
    }

    .status-message.success {
      background: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }

    .status-message.error {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ffcdd2;
    }

    .error-state, .loading-state {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
      padding: 40px;
    }

    .error-state h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 24px;
    }

    .error-state p {
      margin: 0 0 20px 0;
      color: #999;
      font-size: 16px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #2196f3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-state p {
      color: #666;
      font-size: 16px;
    }
  `]
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
  
  private routeSubscription?: Subscription;
  private shouldScrollToBottom = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
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
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadChat(chatId: string) {
    this.loading = true;
    console.log('Loading chat with ID:', chatId); // Debug log
    
    // Получаем все чаты и находим нужный по ID
    this.http.get<Chat[]>('/api/chats').subscribe({
      next: (chats) => {
        console.log('All chats received:', chats); // Debug log
        const foundChat = chats.find(chat => chat.id === chatId);
        
        if (foundChat) {
          console.log('Chat found:', foundChat); // Debug log
          this.chat = foundChat;
          this.messages = foundChat.messages || [];
          this.loading = false;
          this.shouldScrollToBottom = true;
        } else {
          console.log('Chat not found with ID:', chatId); // Debug log
          this.loading = false;
          this.statusMessage = 'Chat not found';
        }
      },
      error: (error) => {
        console.error('Error loading chats:', error);
        console.log('Chat ID that failed:', chatId); // Debug log
        this.loading = false;
        this.statusMessage = 'Error loading chats: ' + (error.error?.message || error.message || 'Unknown error');
      }
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const content = this.messageText.trim();
    if (!content || !this.chat || this.isGenerating) return;

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.messageText = '';
    this.isGenerating = true;
    this.shouldScrollToBottom = true;

    // Send message to backend
    this.http.post<{success: boolean, chatId: string}>(`/api/chats/${this.chat.id}/messages`, {
      content
    }).subscribe({
      next: (response) => {
        // Message sent successfully, response will come via WebSocket
        if (response.success) {
          console.log('Message sent successfully');
          // Reload chat to get the assistant's response
          setTimeout(() => {
            this.loadChat(this.chat!.id);
          }, 1000); // Wait 1 second for processing
        }
        this.isGenerating = false;
        this.statusMessage = '';
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.statusMessage = 'Error sending message: ' + (error.error?.message || 'Unknown error');
        this.isGenerating = false;
        // Remove the user message if sending failed
        this.messages.pop();
      }
    });
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
}
