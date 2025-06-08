import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { StateService } from '../services/state.service';
import { ApiService } from '../services/api.service';
import { Agent, LLMConfig, MCPServer } from '../models/types';

@Component({
  selector: 'app-agents',
  template: `
    <div class="agents-container">
      <div class="section-header">
        <h2>Агенты</h2>
        <button mat-raised-button color="primary" (click)="createAgent()">
          <mat-icon>add</mat-icon>
          Создать агента
        </button>
      </div>

      <div class="agents-grid" *ngIf="(agents$ | async)?.length; else emptyState">
        <mat-card 
          *ngFor="let agent of agents$ | async" 
          class="agent-card"
          (click)="editAgent(agent)"
        >
          <mat-card-header>
            <div mat-card-avatar class="agent-avatar">
              <mat-icon>smart_toy</mat-icon>
            </div>
            <mat-card-title>{{ agent.name }}</mat-card-title>
            <mat-card-subtitle>
              {{ agent.description || 'Нет описания' }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="agent-details">
              <div class="detail-section">
                <h4>LLM Модель</h4>
                <span class="model-name">{{ getLLMModelName(agent) }}</span>
              </div>

              <div class="detail-section" *ngIf="getMCPServers(agent).length > 0">
                <h4>MCP Серверы ({{ getMCPServers(agent).length }})</h4>
                <div class="mcp-chips">
                  <mat-chip 
                    *ngFor="let server of getMCPServers(agent).slice(0, 3)"
                    [color]="server.status === 'running' ? 'primary' : 'basic'"
                  >
                    {{ server.name }}
                  </mat-chip>
                  <mat-chip *ngIf="getMCPServers(agent).length > 3" color="basic">
                    +{{ getMCPServers(agent).length - 3 }}
                  </mat-chip>
                </div>
              </div>

              <div class="detail-section">
                <h4>Системный промт</h4>
                <p class="system-prompt">{{ agent.systemPrompt }}</p>
              </div>

              <div class="agent-meta">
                <span class="created-date">
                  Создан: {{ formatDate(agent.createdAt) }}
                </span>
                <span class="updated-date">
                  Обновлен: {{ formatDate(agent.updatedAt) }}
                </span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button color="primary" (click)="editAgent(agent); $event.stopPropagation()">
              <mat-icon>edit</mat-icon>
              Изменить
            </button>
            <button mat-button (click)="duplicateAgent(agent); $event.stopPropagation()">
              <mat-icon>content_copy</mat-icon>
              Дублировать
            </button>
            <button mat-button color="warn" (click)="deleteAgent(agent); $event.stopPropagation()">
              <mat-icon>delete</mat-icon>
              Удалить
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <mat-icon class="empty-icon">smart_toy</mat-icon>
          <h3>Нет агентов</h3>
          <p>Создайте первого агента для начала работы</p>
          <button mat-raised-button color="primary" (click)="createAgent()">
            Создать агента
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .agents-container {
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

    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .agent-card {
      background: var(--surface-color, #1e1e1e);
      border: 1px solid var(--border-color, #333);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: pointer;
    }

    .agent-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .agent-avatar {
      background: var(--primary-color, #2196f3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .agent-details {
      margin-top: 16px;
    }

    .detail-section {
      margin-bottom: 16px;
    }

    .detail-section h4 {
      margin: 0 0 8px 0;
      color: var(--text-secondary, #aaa);
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .model-name {
      color: var(--text-primary, #fff);
      font-weight: 500;
    }

    .mcp-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .system-prompt {
      color: var(--text-primary, #fff);
      font-size: 0.875rem;
      line-height: 1.4;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .agent-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-secondary, #aaa);
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color, #333);
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
export class AgentsComponent implements OnInit {
  agents$: Observable<Agent[]>;
  llmModels$: Observable<LLMConfig[]>;
  mcpServers$: Observable<MCPServer[]>;

  constructor(
    private stateService: StateService,
    private apiService: ApiService
  ) {
    this.agents$ = this.stateService.agents$;
    this.llmModels$ = this.stateService.llmModels$;
    this.mcpServers$ = this.stateService.mcpServers$;
  }

  ngOnInit(): void {}

  createAgent(): void {
    // TODO: Open create agent dialog
    console.log('Create agent dialog');
  }

  editAgent(agent: Agent): void {
    // TODO: Open edit agent dialog
    console.log('Edit agent:', agent.name);
  }

  async duplicateAgent(agent: Agent): Promise<void> {
    try {
      await this.apiService.duplicateAgent(agent.id).toPromise();
      await this.stateService.refreshAgents();
    } catch (error) {
      console.error('Failed to duplicate agent:', error);
    }
  }

  async deleteAgent(agent: Agent): Promise<void> {
    // TODO: Add confirmation dialog
    try {
      await this.apiService.deleteAgent(agent.id).toPromise();
      this.stateService.removeAgent(agent.id);
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  }

  getLLMModelName(agent: Agent): string {
    const model = this.stateService.getLLMModelById(agent.llmConfigId);
    return model ? model.name : 'Модель не найдена';
  }

  getMCPServers(agent: Agent): MCPServer[] {
    return agent.mcpServerIds
      .map(id => this.stateService.getMCPServerById(id))
      .filter(server => server !== undefined) as MCPServer[];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }
}
