import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { StateService } from '../services/state.service';
import { ApiService } from '../services/api.service';
import { LLMConfig } from '../models/types';

@Component({
  selector: 'app-llm-models',
  template: `
    <div class="llm-models-container">
      <div class="section-header">
        <h2>LLM Модели</h2>
        <button mat-raised-button color="primary" (click)="addModel()">
          <mat-icon>add</mat-icon>
          Добавить модель
        </button>
      </div>

      <div class="models-grid" *ngIf="(llmModels$ | async)?.length; else emptyState">
        <mat-card 
          *ngFor="let model of llmModels$ | async" 
          class="model-card"
          [class.disabled]="!model.enabled"
        >
          <mat-card-header>
            <div mat-card-avatar class="model-avatar">
              <mat-icon>{{ getProviderIcon(model.provider) }}</mat-icon>
            </div>
            <mat-card-title>{{ model.name }}</mat-card-title>
            <mat-card-subtitle>
              {{ model.provider === 'openai' ? 'OpenAI API' : 'Ollama' }}
              <mat-chip-set class="model-chips">
                <mat-chip *ngIf="model.supportsImages" color="accent">
                  <mat-icon matChipAvatar>image</mat-icon>
                  Изображения
                </mat-chip>
                <mat-chip [color]="model.enabled ? 'primary' : 'basic'">
                  {{ model.enabled ? 'Активна' : 'Отключена' }}
                </mat-chip>
              </mat-chip-set>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="model-details">
              <div class="detail-row">
                <span class="label">Модель:</span>
                <span class="value">{{ getModelName(model) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">URL:</span>
                <span class="value">{{ getBaseURL(model) }}</span>
              </div>
              <div class="detail-row" *ngIf="model.provider === 'openai'">
                <span class="label">Max Tokens:</span>
                <span class="value">{{ getMaxTokens(model) || 'Default' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Температура:</span>
                <span class="value">{{ getTemperature(model) || 'Default' }}</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button 
              mat-button 
              color="primary" 
              (click)="testConnection(model)"
              [disabled]="testingModels.has(model.id)"
            >
              <mat-icon *ngIf="!testingModels.has(model.id)">wifi</mat-icon>
              <mat-spinner diameter="16" *ngIf="testingModels.has(model.id)"></mat-spinner>
              Тест
            </button>
            <button mat-button (click)="editModel(model)">
              <mat-icon>edit</mat-icon>
              Изменить
            </button>
            <button mat-button (click)="toggleModel(model)">
              <mat-icon>{{ model.enabled ? 'toggle_on' : 'toggle_off' }}</mat-icon>
              {{ model.enabled ? 'Отключить' : 'Включить' }}
            </button>
            <button mat-button color="warn" (click)="deleteModel(model)">
              <mat-icon>delete</mat-icon>
              Удалить
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <mat-icon class="empty-icon">smart_toy</mat-icon>
          <h3>Нет LLM моделей</h3>
          <p>Добавьте первую модель для начала работы</p>
          <button mat-raised-button color="primary" (click)="addModel()">
            Добавить модель
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .llm-models-container {
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

    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .model-card {
      background: var(--surface-color, #1e1e1e);
      border: 1px solid var(--border-color, #333);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .model-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .model-card.disabled {
      opacity: 0.6;
    }

    .model-avatar {
      background: var(--primary-color, #2196f3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .model-chips {
      margin-top: 8px;
    }

    .model-details {
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
    }

    .value {
      color: var(--text-primary, #fff);
      max-width: 200px;
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
export class LLMModelsComponent implements OnInit {
  llmModels$: Observable<LLMConfig[]>;
  testingModels = new Set<string>();

  constructor(
    private stateService: StateService,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.llmModels$ = this.stateService.llmModels$;
  }

  ngOnInit(): void {}

  addModel(): void {
    // TODO: Open add model dialog
    console.log('Add model dialog');
  }

  editModel(model: LLMConfig): void {
    // TODO: Open edit model dialog
    console.log('Edit model:', model.name);
  }

  async testConnection(model: LLMConfig): Promise<void> {
    this.testingModels.add(model.id);

    try {
      const result = await this.apiService.testLLMConnection(model.id).toPromise();
      
      if (result?.success) {
        this.snackBar.open('✅ Подключение успешно', 'Закрыть', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      } else {
        this.snackBar.open('❌ Ошибка подключения', 'Закрыть', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      this.snackBar.open('❌ Ошибка при тестировании', 'Закрыть', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.testingModels.delete(model.id);
    }
  }

  async toggleModel(model: LLMConfig): Promise<void> {
    try {
      const updatedModel = { ...model, enabled: !model.enabled };
      await this.apiService.updateLLMModel(model.id, updatedModel).toPromise();
      this.stateService.updateLLMModel(updatedModel);
      
      this.snackBar.open(
        `Модель ${updatedModel.enabled ? 'включена' : 'отключена'}`,
        'Закрыть',
        { duration: 3000 }
      );
    } catch (error) {
      console.error('Failed to toggle model:', error);
      this.snackBar.open('Ошибка при изменении статуса', 'Закрыть', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  async deleteModel(model: LLMConfig): Promise<void> {
    // TODO: Add confirmation dialog
    try {
      await this.apiService.deleteLLMModel(model.id).toPromise();
      this.stateService.removeLLMModel(model.id);
      
      this.snackBar.open('Модель удалена', 'Закрыть', {
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to delete model:', error);
      this.snackBar.open('Ошибка при удалении', 'Закрыть', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  getProviderIcon(provider: string): string {
    switch (provider) {
      case 'openai':
        return 'cloud';
      case 'ollama':
        return 'computer';
      default:
        return 'smart_toy';
    }
  }

  getModelName(model: LLMConfig): string {
    if (model.provider === 'openai') {
      return (model.config as any).model || 'Unknown';
    } else if (model.provider === 'ollama') {
      return (model.config as any).model || 'Unknown';
    }
    return 'Unknown';
  }

  getBaseURL(model: LLMConfig): string {
    return (model.config as any).baseURL || 'Unknown';
  }

  getMaxTokens(model: LLMConfig): number | null {
    return (model.config as any).maxTokens || null;
  }

  getTemperature(model: LLMConfig): number | null {
    return (model.config as any).temperature || null;
  }
}
