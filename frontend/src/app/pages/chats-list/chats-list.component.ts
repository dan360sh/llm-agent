import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
  lastMessage?: string;
  llmModelId?: string;
  mcpServers: string[];
}

interface LLMModel {
  id: string;
  name: string;
  provider: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-chats-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chats-container">
      <div class="chats-header">
        <h2>Chats</h2>
        <button (click)="showCreateForm = true" class="btn btn-primary">
          + New Chat
        </button>
      </div>

      <!-- Create Chat Form -->
      <div *ngIf="showCreateForm" class="create-chat-form">
        <h3>Create New Chat</h3>
        
        <div class="form-group">
          <label class="form-label">Chat Title:</label>
          <input type="text" [(ngModel)]="newChat.title" placeholder="Enter chat title" class="form-input">
        </div>

        <div class="form-group">
          <label class="form-label">Select Agent or LLM Model:</label>
          <div class="selection-tabs">
            <button (click)="selectionMode = 'agent'" 
                    [class.active]="selectionMode === 'agent'"
                    class="tab-button">
              Use Agent
            </button>
            <button (click)="selectionMode = 'llm'" 
                    [class.active]="selectionMode === 'llm'"
                    class="tab-button">
              Use LLM Model
            </button>
          </div>
        </div>

        <!-- Agent Selection -->
        <div *ngIf="selectionMode === 'agent'" class="form-group">
          <label class="form-label">Agent:</label>
          <select [(ngModel)]="newChat.agentId" class="form-select">
            <option value="">Select an agent...</option>
            <option *ngFor="let agent of agents" [value]="agent.id">
              {{ agent.name }} - {{ agent.description }}
            </option>
          </select>
          <small class="form-help">Agents come with pre-configured system prompts and tools</small>
        </div>

        <!-- LLM Model Selection -->
        <div *ngIf="selectionMode === 'llm'" class="form-group">
          <label class="form-label">LLM Model:</label>
          <select [(ngModel)]="newChat.llmModelId" class="form-select">
            <option value="">Select a model...</option>
            <option *ngFor="let model of llmModels" [value]="model.id">
              {{ model.name }} ({{ model.provider }})
            </option>
          </select>
        </div>

        <div class="form-actions">
          <button (click)="createChat()" [disabled]="!isFormValid()" 
                  class="btn btn-primary" [class.disabled]="!isFormValid()">
            Create Chat
          </button>
          <button (click)="cancelCreate()" class="btn btn-secondary">
            Cancel
          </button>
        </div>

        <div *ngIf="statusMessage" class="status-message" 
             [class.error]="statusMessage.includes('Error')" 
             [class.success]="!statusMessage.includes('Error')">
          {{ statusMessage }}
        </div>
      </div>

      <!-- Existing Chats -->
      <div class="existing-chats">
        <div *ngIf="chats.length === 0 && !loading" class="no-chats-message">
          <div class="empty-state">
            <h3>No chats yet</h3>
            <p>Create your first chat to start conversing with AI</p>
            <button (click)="showCreateForm = true" class="btn btn-primary">
              Create Your First Chat
            </button>
          </div>
        </div>

        <div *ngIf="loading" class="loading-message">
          Loading chats...
        </div>

        <div *ngFor="let chat of chats" class="chat-card" (click)="openChat(chat.id)">
          <div class="chat-info">
            <h4 class="chat-title">{{ chat.title }}</h4>
            <p class="chat-meta">
              <span class="chat-date">{{ formatDate(chat.updatedAt) }}</span>
              <span class="chat-count" *ngIf="chat.messageCount">{{ chat.messageCount }} messages</span>
            </p>
            <p class="chat-preview" *ngIf="chat.lastMessage">{{ chat.lastMessage }}</p>
          </div>
          <div class="chat-actions" (click)="$event.stopPropagation()">
            <button (click)="deleteChat(chat.id)" class="delete-button" title="Delete chat">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chats-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .chats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .chats-header h2 {
      margin: 0;
      color: #333;
      font-size: 28px;
    }

    .create-chat-form {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .create-chat-form h3 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #2196f3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    }

    .form-help {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #666;
    }

    .selection-tabs {
      display: flex;
      border: 1px solid #ddd;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 15px;
    }

    .tab-button {
      flex: 1;
      padding: 12px;
      border: none;
      background: white;
      color: #666;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-button:hover {
      background: #f5f5f5;
    }

    .tab-button.active {
      background: #2196f3;
      color: white;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 25px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #2196f3;
      color: white;
    }

    .btn-primary:hover:not(.disabled) {
      background: #1976d2;
    }

    .btn-secondary {
      background: #9e9e9e;
      color: white;
    }

    .btn-secondary:hover {
      background: #757575;
    }

    .btn.disabled {
      background: #ccc;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .status-message {
      margin-top: 15px;
      padding: 12px;
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

    .existing-chats {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .no-chats-message {
      padding: 60px 20px;
      text-align: center;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 24px;
    }

    .empty-state p {
      margin: 0 0 20px 0;
      color: #999;
      font-size: 16px;
    }

    .loading-message {
      padding: 40px;
      text-align: center;
      color: #666;
      font-size: 16px;
    }

    .chat-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .chat-card:hover {
      background-color: #f8f9fa;
    }

    .chat-card:last-child {
      border-bottom: none;
    }

    .chat-info {
      flex: 1;
    }

    .chat-title {
      margin: 0 0 5px 0;
      font-size: 18px;
      color: #333;
    }

    .chat-meta {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #666;
      display: flex;
      gap: 15px;
    }

    .chat-date {
      color: #888;
    }

    .chat-count {
      color: #666;
    }

    .chat-preview {
      margin: 0;
      font-size: 14px;
      color: #888;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 400px;
    }

    .chat-actions {
      display: flex;
      gap: 8px;
    }

    .delete-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      font-size: 16px;
      transition: background-color 0.2s ease;
    }

    .delete-button:hover {
      background-color: #ffebee;
    }
  `]
})
export class ChatsListComponent implements OnInit {
  chats: Chat[] = [];
  llmModels: LLMModel[] = [];
  agents: Agent[] = [];
  loading = false;
  statusMessage = '';
  showCreateForm = false;
  selectionMode: 'agent' | 'llm' = 'agent';

  newChat = {
    title: '',
    agentId: '',
    llmModelId: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadChats();
    this.loadLLMModels();
    this.loadAgents();
  }

  loadChats() {
    this.loading = true;
    this.http.get<{success: boolean, data: Chat[]}>('/api/chats').subscribe({
      next: (response) => {
        this.chats = response.data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading chats:', error);
        this.statusMessage = 'Error loading chats. Make sure backend is running.';
        this.loading = false;
      }
    });
  }

  loadLLMModels() {
    this.http.get<LLMModel[]>('/api/llm').subscribe({
      next: (models) => {
        this.llmModels = models;
      },
      error: (error) => {
        console.error('Error loading LLM models:', error);
      }
    });
  }

  loadAgents() {
    this.http.get<Agent[]>('/api/agents').subscribe({
      next: (agents) => {
        this.agents = agents; // Show all agents
      },
      error: (error) => {
        console.error('Error loading agents:', error);
      }
    });
  }

  isFormValid(): boolean {
    return !!(this.newChat.title && 
             (this.selectionMode === 'agent' ? this.newChat.agentId : this.newChat.llmModelId));
  }

  createChat() {
    if (!this.isFormValid()) return;

    const chatData = {
      title: this.newChat.title,
      agentId: this.selectionMode === 'agent' ? this.newChat.agentId : undefined,
      llmModelId: this.selectionMode === 'llm' ? this.newChat.llmModelId : undefined
    };

    this.http.post<{success: boolean, data: Chat}>('/api/chats', chatData).subscribe({
      next: (response) => {
        if (response.success) {
          this.statusMessage = 'Chat created successfully!';
          this.cancelCreate();
          this.loadChats();
          // Navigate to the new chat
          this.router.navigate(['/chat', response.data.id]);
        }
      },
      error: (error) => {
        console.error('Error creating chat:', error);
        this.statusMessage = 'Error creating chat: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  cancelCreate() {
    this.showCreateForm = false;
    this.newChat = {
      title: '',
      agentId: '',
      llmModelId: ''
    };
    this.statusMessage = '';
  }

  openChat(chatId: string) {
    this.router.navigate(['/chat', chatId]);
  }

  deleteChat(chatId: string) {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    this.http.delete<{success: boolean}>(`/api/chats/${chatId}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.statusMessage = 'Chat deleted successfully!';
          this.loadChats();
        }
      },
      error: (error) => {
        console.error('Error deleting chat:', error);
        this.statusMessage = 'Error deleting chat: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  formatDate(date: Date): string {
    const now = new Date();
    const chatDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - chatDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return chatDate.toLocaleDateString();
    }
  }
}
