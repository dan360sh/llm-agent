import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface LLMModel {
  id: string;
  name: string;
  provider: 'openai' | 'ollama';
  config: any;
  supportsImages: boolean;
  enabled: boolean;
  createdAt?: Date;
}

@Component({
  selector: 'app-llm-models',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="llm-models-container">
      <h2>LLM Models</h2>
      
      <!-- Existing Models -->
      <div class="existing-models-section">
        <h3>Existing Models</h3>
        <div *ngIf="models.length === 0" class="no-models-message">
          No LLM models configured yet. Add one below.
        </div>
        <div *ngFor="let model of models" class="model-card">
          <div class="model-info">
            <h4 class="model-name">{{ model.name }}</h4>
            <p class="model-details">
              <span class="provider-badge" [class]="'provider-' + model.provider">{{ model.provider }}</span>
              <span class="status-badge" [class]="model.enabled ? 'status-enabled' : 'status-disabled'">
                {{ model.enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </p>
          </div>
          <button (click)="deleteModel(model.id)" class="delete-button">
            Delete
          </button>
        </div>
      </div>

      <!-- Add New Model Form -->
      <div class="add-model-form">
        <h3>Add New LLM Model</h3>
        
        <div class="form-group">
          <label class="form-label">Name:</label>
          <input type="text" [(ngModel)]="newModel.name" placeholder="Model Name" class="form-input">
        </div>

        <div class="form-group">
          <label class="form-label">Provider:</label>
          <select [(ngModel)]="newModel.provider" (ngModelChange)="onProviderChange()" class="form-select">
            <option value="openai">OpenAI Compatible</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>

        <!-- OpenAI Config -->
        <div *ngIf="newModel.provider === 'openai'" class="config-section">
          <h4 class="config-title">OpenAI Configuration</h4>
          
          <div class="form-group">
            <label class="form-label">API Key:</label>
            <input type="password" [(ngModel)]="newModel.config.apiKey" placeholder="sk-..." class="form-input">
          </div>

          <div class="form-group">
            <label class="form-label">Base URL:</label>
            <input type="text" [(ngModel)]="newModel.config.baseURL" placeholder="https://api.openai.com/v1" class="form-input">
          </div>

          <div class="form-group">
            <label class="form-label">Model:</label>
            <input type="text" [(ngModel)]="newModel.config.model" placeholder="gpt-4" class="form-input">
          </div>
        </div>

        <!-- Ollama Config -->
        <div *ngIf="newModel.provider === 'ollama'" class="config-section">
          <h4 class="config-title">Ollama Configuration</h4>
          
          <div class="form-group">
            <label class="form-label">Base URL:</label>
            <input type="text" [(ngModel)]="newModel.config.baseURL" placeholder="http://localhost:11434" class="form-input">
          </div>

          <div class="form-group">
            <label class="form-label">Model:</label>
            <input type="text" [(ngModel)]="newModel.config.model" placeholder="llama2" class="form-input">
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="newModel.supportsImages" class="form-checkbox">
            <span class="checkbox-text">Supports Images</span>
          </label>
        </div>

        <div class="form-actions">
          <button (click)="addModel()" [disabled]="!isFormValid()" class="btn btn-primary" [class.disabled]="!isFormValid()">
            Add Model
          </button>
          <button (click)="testConnection()" [disabled]="!isFormValid()" class="btn btn-secondary" [class.disabled]="!isFormValid()">
            Test Connection
          </button>
        </div>

        <div *ngIf="statusMessage" class="status-message" [class.error]="statusMessage.includes('Error')" [class.success]="!statusMessage.includes('Error')">
          {{ statusMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .llm-models-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    h2 {
      color: #333;
      margin-bottom: 30px;
      font-size: 28px;
    }

    h3 {
      color: #444;
      margin-bottom: 20px;
      font-size: 20px;
    }

    .existing-models-section {
      margin-bottom: 40px;
    }

    .no-models-message {
      color: #666;
      padding: 30px;
      border: 2px dashed #ddd;
      border-radius: 8px;
      text-align: center;
      background: #fafafa;
      font-style: italic;
    }

    .model-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 12px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s ease;
    }

    .model-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .model-info {
      flex: 1;
    }

    .model-name {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #333;
    }

    .model-details {
      margin: 0;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .provider-badge, .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .provider-openai {
      background: #e3f2fd;
      color: #1976d2;
    }

    .provider-ollama {
      background: #e8f5e8;
      color: #388e3c;
    }

    .status-enabled {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .status-disabled {
      background: #ffebee;
      color: #c62828;
    }

    .delete-button {
      background: #f44336;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    .delete-button:hover {
      background: #d32f2f;
    }

    .add-model-form {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 30px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

    .config-section {
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 20px;
      background: #f9f9f9;
    }

    .config-title {
      margin: 0 0 15px 0;
      color: #555;
      font-size: 16px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    .form-checkbox {
      width: auto;
      margin: 0;
    }

    .checkbox-text {
      color: #333;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 30px;
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
      background: #4caf50;
      color: white;
    }

    .btn-secondary:hover:not(.disabled) {
      background: #388e3c;
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
  `]
})
export class LLMModelsComponent implements OnInit {
  models: LLMModel[] = [];
  statusMessage = '';

  newModel: any = {
    name: '',
    provider: 'openai',
    config: {
      apiKey: '',
      baseURL: '',
      model: '',
      temperature: 0.7,
      maxTokens: 3000
    },
    supportsImages: false,
    enabled: true
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadModels();
    this.onProviderChange();
  }

  loadModels() {
    this.http.get<LLMModel[]>('/api/llm').subscribe({
      next: (models) => {
        this.models = models;
      },
      error: (error) => {
        console.error('Error loading models:', error);
        this.statusMessage = 'Error loading models. Make sure backend is running.';
      }
    });
  }

  onProviderChange() {
    if (this.newModel.provider === 'openai') {
      this.newModel.config = {
        apiKey: '',
        baseURL: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 3000
      };
    } else if (this.newModel.provider === 'ollama') {
      this.newModel.config = {
        baseURL: 'http://localhost:11434',
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 3000
      };
    }
  }

  isFormValid(): boolean {
    return !!(this.newModel.name && this.newModel.config.model && 
             (this.newModel.provider === 'ollama' || this.newModel.config.apiKey));
  }

  addModel() {
    if (!this.isFormValid()) return;

    this.http.post<{success: boolean, data: LLMModel}>('/api/llm', this.newModel).subscribe({
      next: (response) => {
        if (response.success) {
          this.models.push(response.data);
          this.statusMessage = 'Model added successfully!';
          this.resetForm();
        }
      },
      error: (error) => {
        console.error('Error adding model:', error);
        this.statusMessage = 'Error adding model: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  testConnection() {
    if (!this.isFormValid()) return;

    this.statusMessage = 'Testing connection...';
    this.http.post<{success: boolean}>('/api/llm/test', this.newModel).subscribe({
      next: (response) => {
        this.statusMessage = response.success ? 'Connection successful!' : 'Connection failed!';
      },
      error: (error) => {
        console.error('Error testing connection:', error);
        this.statusMessage = 'Connection test failed: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  deleteModel(id: string) {
    if (!confirm('Are you sure you want to delete this model?')) return;

    this.http.delete<{success: boolean}>(`/api/llm/${id}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.models = this.models.filter(m => m.id !== id);
          this.statusMessage = 'Model deleted successfully!';
        }
      },
      error: (error) => {
        console.error('Error deleting model:', error);
        this.statusMessage = 'Error deleting model: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  resetForm() {
    this.newModel = {
      name: '',
      provider: 'openai',
      config: {
        apiKey: '',
        baseURL: '',
        model: '',
        temperature: 0.7,
        maxTokens: 3000
      },
      supportsImages: false,
      enabled: true
    };
    this.onProviderChange();
  }
}
