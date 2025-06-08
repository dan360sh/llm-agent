import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { StateService } from '../services/state.service';
import { ApiService } from '../services/api.service';
import { MCPServer } from '../models/types';

@Component({
  selector: 'app-mcp-servers',
  template: `
    <div class="mcp-servers-container">
      <div class="section-header">
        <h2>MCP Серверы</h2>
        <button mat-raised-button color="primary" (click)="addServer()">
          <mat-icon>add</mat-icon>
          Добавить сервер
        </button>
      </div>

      <div class="servers-grid" *ngIf="(mcpServers$ | async)?.length; else emptyState">
        <mat-card 
          *ngFor="let server of mcpServers$ | async" 
          class="server-card"
          [class.running]="server.status === 'running'"
          [class.error]="server.status === 'error'"
        >
          <mat-card-header>
            <div mat-card-avatar class="server-avatar">
              <mat-icon>{{ getStatusIcon(server.status) }}</mat-icon>
            </div>
            <mat-card-title>{{ server.name }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip-set class="server-chips">
                <mat-chip [color]="getStatusColor(server.status)">
                  {{ getStatusText(server.status) }}
                </mat-chip>
                <mat-chip [color]="server.enabled ? 'primary' : 'basic'">
                  {{ server.enabled ? 'Включен' : 'Отключен' }}
                </mat-chip>
              </mat-chip-set>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="server-details">
              <div class="detail-row">
                <span class="label">Команда:</span>
                <span class="value">{{ server.command }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Аргументы:</span>
                <span class="value">{{ server.args.join(' ') }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Создан:</span>
                <span class="value">{{ formatDate(server.createdAt) }}</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button 
              mat-button 
              color="primary" 
              (click)="toggleServer(server)"
              [disabled]="isToggling.has(server.id)"
            >
              <mat-icon *ngIf="!isToggling.has(server.id)">
                {{ server.enabled && server.status === 'running' ? 'stop' : 'play_arrow' }}
              </mat-icon>
              <mat-spinner diameter="16" *ngIf="isToggling.has(server.id)"></mat-spinner>
              {{ server.enabled && server.status === 'running' ? 'Остановить' : 'Запустить' }}
            </button>
            <button mat-button (click)="editServer(server)">
              <mat-icon>edit</mat-icon>
              Изменить
            </button>
            <button mat-button color="warn" (click)="deleteServer(server)">
              <mat-icon>delete</mat-icon>
              Удалить
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <mat-icon class="empty-icon">extension</mat-icon>
          <h3>Нет MCP серверов</h3>
          <p>Добавьте первый MCP сервер для расширения возможностей</p>
          <button mat-raised-button color="primary" (click)="addServer()">
            Добавить сервер
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .mcp-servers-container {
      padding: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-header h2 {
      margin: 0;
      color: var(--text-primary, #fff);
      font-size: 1.5rem;
      font-weight: 600;
    }

    .servers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .server-card {
      background: var(--surface-color, #1e1e1e);
      border: 1px solid var(--border-color, #333);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .server-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .server-card.running {
      border-left: 4px solid var(--success-color, #4caf50);
    }

    .server-card.error {
      border-left: 4px solid var(--error-color, #f44336);
    }

    .server-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .server-card.running .server-avatar {
      background: var(--success-color, #4caf50);
      color: white;
    }

    .server-card.error .server-avatar {
      background: var(--error-color, #f44336);
      color: white;
    }

    .server-card:not(.running):not(.error) .server-avatar {
      background: var(--text-secondary, #aaa);
      color: var(--background-color, #121212);
    }

    .server-chips {
      margin-top: 8px;
    }

    .server-details {
      margin-top: 16px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.875rem;
    }

    .label {
      color: var(--text-secondary, #aaa);
      font-weight: 500;
      min-width: 80px;
    }

    .value {
      color: var(--text-primary, #fff);
      flex: 1;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      color: var(--text-secondary, #aaa);
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
  `]
})
export class MCPServersComponent implements OnInit {
  mcpServers$: Observable<MCPServer[]>;
  isToggling = new Set<string>();

  constructor(
    private stateService: StateService,
    private apiService: ApiService
  ) {
    this.mcpServers$ = this.stateService.mcpServers$;
  }

  ngOnInit(): void {}

  addServer(): void {
    // TODO: Open add server dialog
    console.log('Add MCP server dialog');
  }

  editServer(server: MCPServer): void {
    // TODO: Open edit server dialog
    console.log('Edit MCP server:', server.name);
  }

  async toggleServer(server: MCPServer): Promise<void> {
    this.isToggling.add(server.id);

    try {
      await this.apiService.toggleMCPServer(server.id).toPromise();
      await this.stateService.refreshMCPServers();
    } catch (error) {
      console.error('Failed to toggle server:', error);
    } finally {
      this.isToggling.delete(server.id);
    }
  }

  async deleteServer(server: MCPServer): Promise<void> {
    // TODO: Add confirmation dialog
    try {
      await this.apiService.deleteMCPServer(server.id).toPromise();
      this.stateService.removeMCPServer(server.id);
    } catch (error) {
      console.error('Failed to delete server:', error);
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'running':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'radio_button_unchecked';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'running':
        return 'primary';
      case 'error':
        return 'warn';
      default:
        return 'basic';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'running':
        return 'Запущен';
      case 'error':
        return 'Ошибка';
      default:
        return 'Остановлен';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }
}
