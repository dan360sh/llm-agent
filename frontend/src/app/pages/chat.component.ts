import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StateService } from '../services/state.service';
import { ApiService } from '../services/api.service';
import { WebSocketService } from '../services/websocket.service';
import { Chat, Agent, Message, LLMConfig, MCPServer } from '../models/types';

@Component({
  selector: 'app-chat',
  template: `
    <div class="chat-container" *ngIf="currentChat">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="chat-info">
          <h2>{{ currentChat.name }}</h2>
          <div class="chat-details">
            <span class="agent-name">{{ getAgentName() }}</span>
            <span class="separator">•</span>
            <span class="model-name">{{ getLLMModelName() }}</span>
            <span class="separator" *ngIf="getMCPServers().length > 0">•</span>
            <span class="mcp-count" *ngIf="getMCPServers().length > 0">
              {{ getMCPServers().length }} MCP
            </span>
          </div>
        </div>
        <div class="chat-actions">
          <button mat-icon-button (click)="openSettings()" matTooltip="Настройки чата">
            <mat-icon>settings</mat-icon>
          </button>
          <button mat-icon-button (click)="clearChat()" matTooltip="Очистить чат">
            <mat-icon>clear_all</mat-icon>
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="messages-container" #messagesContainer>
        <div class="messages-list">
          <div 
            *ngFor="let message of currentChat.messages" 
            class="message"
            [class.user-message]="message.role === 'user'"
            [class.assistant-message]="message.role === 'assistant'"
            [class.system-message]="message.role === 'system'"
          >
            <div class="message-avatar">
              <mat-icon *ngIf="message.role === 'user'">person</mat-icon>
              <mat-icon *ngIf="message.role === 'assistant'">smart_toy</mat-icon>
              <mat-icon *ngIf="message.role === 'system'">settings</mat-icon>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-images" *ngIf="message.images && message.images.length > 0">
                <img 
                  *ngFor="let image of message.images" 
                  [src]="getImageUrl(image)" 
                  alt="Attached image"
                  class="message-image"
                >
              </div>
              <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
            </div>
          </div>

          <!-- Streaming indicator -->
          <div *ngIf="isStreaming" class="message assistant-message streaming">
            <div class="message-avatar">
              <mat-icon>smart_toy</mat-icon>
            </div>
            <div class="message-content">
              <div class="message-text">{{ streamingContent }}</div>
              <div class="streaming-indicator">
                <mat-spinner diameter="16"></mat-spinner>
                <span>Печатает...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="message-input-container">
        <div class="input-wrapper">
          <div class="input-controls">
            <button 
              mat-icon-button 
              (click)="triggerFileInput()" 
              matTooltip="Прикрепить изображение"
              [disabled]="!supportsImages()"
            >
              <mat-icon>attach_file</mat-icon>
            </button>
            <input 
              #fileInput 
              type="file" 
              accept="image/*" 
              (change)="onFileSelected($event)"
              style="display: none"
              multiple
            >
          </div>
          
          <mat-form-field class="message-field" appearance="outline">
            <textarea 
              matInput 
              [(ngModel)]="messageText"
              (keydown)="onKeyDown($event)"
              placeholder="Введите сообщение..."
              rows="1"
              #messageInput
              [disabled]="isStreaming"
            ></textarea>
          </mat-form-field>

          <div class="send-controls">
            <button 
              mat-icon-button 
              *ngIf="isStreaming"
              (click)="stopGeneration()"
              color="warn"
              matTooltip="Остановить генерацию"
            >
              <mat-icon>stop</mat-icon>
            </button>
            <button 
              mat-fab 
              *ngIf="!isStreaming"
              (click)="sendMessage()"
              [disabled]="!canSendMessage()"
              color="primary"
              class="send-button"
            >
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </div>

        <!-- Attached Images Preview -->
        <div class="attached-images" *ngIf="attachedImages.length > 0">
          <div 
            *ngFor="let image of attachedImages; let i = index" 
            class="attached-image"
          >
            <img [src]="image.preview" alt="Attached">
            <button 
              mat-icon-button 
              (click)="removeAttachedImage(i)"
              class="remove-image"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" *ngIf="!currentChat">
      <mat-icon class="empty-icon">chat_bubble_outline</mat-icon>
      <h3>Выберите чат или создайте новый</h3>
      <p>Начните общение с AI агентом</p>
      <button mat-raised-button color="primary" (click)="createNewChat()">
        Создать новый чат
      </button>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--background-color, #121212);
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color, #333);
      background: var(--surface-color, #1e1e1e);
    }

    .chat-info h2 {
      margin: 0 0 4px 0;
      color: var(--text-primary, #fff);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .chat-details {
      color: var(--text-secondary, #aaa);
      font-size: 0.875rem;
    }

    .separator {
      margin: 0 8px;
    }

    .chat-actions {
      display: flex;
      gap: 8px;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px 0;
    }

    .messages-list {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .message {
      display: flex;
      margin-bottom: 24px;
      animation: fadeIn 0.3s ease-in;
    }

    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .user-message .message-avatar {
      background: var(--primary-color, #2196f3);
      color: white;
    }

    .assistant-message .message-avatar {
      background: var(--surface-color, #1e1e1e);
      color: var(--text-secondary, #aaa);
      border: 1px solid var(--border-color, #333);
    }

    .system-message .message-avatar {
      background: var(--warning-color, #ff9800);
      color: white;
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .message-text {
      color: var(--text-primary, #fff);
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .message-images {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .message-image {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
      object-fit: cover;
    }

    .message-time {
      color: var(--text-secondary, #aaa);
      font-size: 0.75rem;
      margin-top: 4px;
    }

    .streaming {
      opacity: 0.8;
    }

    .streaming-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      color: var(--text-secondary, #aaa);
      font-size: 0.875rem;
    }

    .message-input-container {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color, #333);
      background: var(--surface-color, #1e1e1e);
    }

    .input-wrapper {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      align-items: flex-end;
      gap: 12px;
    }

    .input-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message-field {
      flex: 1;
    }

    .send-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .send-button {
      width: 48px;
      height: 48px;
    }

    .attached-images {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .attached-image {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border-color, #333);
    }

    .attached-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .remove-image {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      width: 24px;
      height: 24px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: var(--text-secondary, #aaa);
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: var(--text-primary, #fff);
    }

    .empty-state p {
      margin: 0 0 24px 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  currentChat: Chat | null = null;
  messageText = '';
  isStreaming = false;
  streamingContent = '';
  attachedImages: { file: File; preview: string }[] = [];
  
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stateService: StateService,
    private apiService: ApiService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    // Subscribe to route params
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const chatId = params['id'];
        if (chatId && chatId !== 'new') {
          this.loadChat(chatId);
        } else if (chatId === 'new') {
          this.showNewChatDialog();
        }
      });

    // Subscribe to current chat changes
    this.stateService.currentChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chat => {
        if (this.currentChat && chat && this.currentChat.id !== chat.id) {
          this.wsService.leaveChat(this.currentChat.id);
        }
        
        this.currentChat = chat;
        
        if (chat) {
          this.wsService.joinChat(chat.id);
          this.shouldScrollToBottom = true;
        }
      });

    // Subscribe to WebSocket events
    this.wsService.getMessageStream()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stream => {
        if (stream.chatId === this.currentChat?.id) {
          if (stream.done) {
            this.isStreaming = false;
            this.streamingContent = '';
            this.stateService.refreshChats(); // Refresh to get the complete message
          } else {
            this.isStreaming = true;
            this.streamingContent += stream.chunk;
            this.shouldScrollToBottom = true;
          }
        }
      });

    this.wsService.getChatUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedChat => {
        if (updatedChat && updatedChat.id === this.currentChat?.id) {
          this.stateService.updateChat(updatedChat);
          this.shouldScrollToBottom = true;
        }
      });

    this.wsService.getErrors()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        console.error('WebSocket error:', error);
        this.isStreaming = false;
        // TODO: Show error toast
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    if (this.currentChat) {
      this.wsService.leaveChat(this.currentChat.id);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadChat(chatId: string): Promise<void> {
    try {
      const chat = await this.apiService.getChat(chatId).toPromise();
      if (chat) {
        this.stateService.setCurrentChat(chat);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
      this.router.navigate(['/chat']);
    }
  }

  showNewChatDialog(): void {
    // TODO: Implement new chat dialog
    console.log('Show new chat dialog');
  }

  createNewChat(): void {
    this.router.navigate(['/chat/new']);
  }

  async sendMessage(): Promise<void> {
    if (!this.canSendMessage() || !this.currentChat) {
      return;
    }

    const messageContent = this.messageText.trim();
    const images = await this.uploadAttachedImages();

    // Clear input
    this.messageText = '';
    this.attachedImages = [];

    try {
      await this.apiService.sendMessage(this.currentChat.id, {
        content: messageContent,
        images
      }).toPromise();

      this.shouldScrollToBottom = true;
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast
    }
  }

  stopGeneration(): void {
    // TODO: Implement stop generation
    this.isStreaming = false;
    this.streamingContent = '';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (!files) return;

    for (let file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.attachedImages.push({
            file,
            preview: e.target?.result as string
          });
        };
        reader.readAsDataURL(file);
      }
    }

    // Clear the input
    event.target.value = '';
  }

  removeAttachedImage(index: number): void {
    this.attachedImages.splice(index, 1);
  }

  private async uploadAttachedImages(): Promise<string[]> {
    const uploadPromises = this.attachedImages.map(async (image) => {
      try {
        const result = await this.apiService.uploadImage(image.file).toPromise();
        return result.url;
      } catch (error) {
        console.error('Failed to upload image:', error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter(url => url !== null);
  }

  canSendMessage(): boolean {
    return this.messageText.trim().length > 0 && !this.isStreaming;
  }

  supportsImages(): boolean {
    const agent = this.getCurrentAgent();
    if (!agent) return false;

    const llmModel = this.stateService.getLLMModelById(agent.llmConfigId);
    return llmModel?.supportsImages || false;
  }

  getAgentName(): string {
    const agent = this.getCurrentAgent();
    return agent ? agent.name : 'Unknown Agent';
  }

  getLLMModelName(): string {
    const agent = this.getCurrentAgent();
    if (!agent) return 'No Model';

    const llmModel = this.stateService.getLLMModelById(agent.llmConfigId);
    return llmModel ? llmModel.name : 'Unknown Model';
  }

  getMCPServers(): MCPServer[] {
    const agent = this.getCurrentAgent();
    if (!agent) return [];

    return agent.mcpServerIds
      .map(id => this.stateService.getMCPServerById(id))
      .filter(server => server !== undefined) as MCPServer[];
  }

  private getCurrentAgent(): Agent | undefined {
    if (!this.currentChat) return undefined;
    return this.stateService.getAgentById(this.currentChat.agentId);
  }

  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `http://localhost:3000${imagePath}`;
  }

  formatMessageTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openSettings(): void {
    // TODO: Implement chat settings dialog
    console.log('Open chat settings');
  }

  async clearChat(): Promise<void> {
    if (!this.currentChat) return;

    try {
      await this.apiService.clearChat(this.currentChat.id).toPromise();
      await this.stateService.refreshChats();
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}
