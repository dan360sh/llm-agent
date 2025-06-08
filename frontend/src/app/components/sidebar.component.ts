import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StateService } from '../services/state.service';
import { Chat, Agent } from '../models/types';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>LLM Agent</h1>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <h3>Навигация</h3>
          <ul class="nav-list">
            <li>
              <a routerLink="/chat" routerLinkActive="active" class="nav-link">
                <mat-icon>chat</mat-icon>
                <span>Чаты</span>
              </a>
            </li>
            <li>
              <a routerLink="/settings" routerLinkActive="active" class="nav-link">
                <mat-icon>settings</mat-icon>
                <span>Настройки</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="nav-section">
          <div class="section-header">
            <h3>Чаты</h3>
            <button mat-icon-button (click)="createNewChat()" class="add-btn">
              <mat-icon>add</mat-icon>
            </button>
          </div>
          <div class="chats-list">
            <div 
              *ngFor="let chat of chats$ | async" 
              class="chat-item"
              [class.active]="(currentChat$ | async)?.id === chat.id"
              (click)="selectChat(chat)"
              (contextmenu)="onChatContextMenu($event, chat)"
            >
              <div class="chat-info">
                <div class="chat-name">{{ chat.name }}</div>
                <div class="chat-preview">{{ getLastMessage(chat) }}</div>
              </div>
              <div class="chat-time">{{ formatTime(chat.updatedAt) }}</div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 300px;
      background: var(--surface-color, #1e1e1e);
      border-right: 1px solid var(--border-color, #333);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-color, #333);
    }

    .sidebar-header h1 {
      margin: 0;
      color: var(--text-primary, #fff);
      font-size: 1.5rem;
      font-weight: 600;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 16px 0;
    }

    .nav-section {
      margin-bottom: 24px;
    }

    .nav-section h3 {
      padding: 0 20px 8px;
      margin: 0;
      color: var(--text-secondary, #aaa);
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px 8px;
    }

    .section-header h3 {
      padding: 0;
    }

    .add-btn {
      color: var(--text-secondary, #aaa);
    }

    .add-btn:hover {
      color: var(--primary-color, #2196f3);
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: var(--text-secondary, #aaa);
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      background: var(--hover-color, #2a2a2a);
      color: var(--text-primary, #fff);
    }

    .nav-link.active {
      background: var(--primary-color, #2196f3);
      color: white;
    }

    .nav-link mat-icon {
      margin-right: 12px;
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .chats-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .chat-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-left: 3px solid transparent;
    }

    .chat-item:hover {
      background: var(--hover-color, #2a2a2a);
    }

    .chat-item.active {
      background: var(--selected-color, #1976d2);
      border-left-color: var(--primary-color, #2196f3);
    }

    .chat-info {
      flex: 1;
      min-width: 0;
    }

    .chat-name {
      color: var(--text-primary, #fff);
      font-weight: 500;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-preview {
      color: var(--text-secondary, #aaa);
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-time {
      color: var(--text-secondary, #aaa);
      font-size: 0.75rem;
      margin-left: 8px;
      flex-shrink: 0;
    }
  `]
})
export class SidebarComponent implements OnInit {
  chats$: Observable<Chat[]>;
  currentChat$: Observable<Chat | null>;
  agents$: Observable<Agent[]>;

  constructor(
    private stateService: StateService,
    private router: Router
  ) {
    this.chats$ = this.stateService.chats$;
    this.currentChat$ = this.stateService.currentChat$;
    this.agents$ = this.stateService.agents$;
  }

  ngOnInit(): void {}

  selectChat(chat: Chat): void {
    this.stateService.setCurrentChat(chat);
    this.router.navigate(['/chat', chat.id]);
  }

  createNewChat(): void {
    this.router.navigate(['/chat/new']);
  }

  onChatContextMenu(event: MouseEvent, chat: Chat): void {
    event.preventDefault();
    // TODO: Implement context menu for chat deletion
    console.log('Context menu for chat:', chat.name);
  }

  getLastMessage(chat: Chat): string {
    if (chat.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      return lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '');
    }
    return 'Нет сообщений';
  }

  formatTime(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'сейчас';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}ч`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}д`;
    }
  }
}
