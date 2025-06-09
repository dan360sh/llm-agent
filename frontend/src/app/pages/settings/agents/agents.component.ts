import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  llmModelId?: string;
  mcpServers: string[];
  enabled: boolean;
  createdAt?: Date;
}

interface LLMModel {
  id: string;
  name: string;
  provider: string;
}

interface MCPServer {
  id: string;
  name: string;
  enabled: boolean;
}

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="agents-container">
      <h2>Agents</h2>
      
      <!-- Existing Agents -->
      <div class="existing-agents-section">
        <h3>Existing Agents</h3>
        <div *ngIf="agents.length === 0" class="no-agents-message">
          No agents configured yet. Add one below.
        </div>
        <div *ngFor="let agent of agents" class="agent-card">
          <div class="agent-info">
            <h4 class="agent-name">{{ agent.name }}</h4>
            <p class="agent-description">{{ agent.description }}</p>
            <div class="agent-details">
              <span class="llm-badge" *ngIf="getLLMName(agent.llmModelId)">
                LLM: {{ getLLMName(agent.llmModelId) }}
              </span>
              <span class="mcp-badge" *ngIf="agent.mcpServers.length > 0">
                MCP: {{ agent.mcpServers.length }} server(s)
              </span>
              <span class="status-badge" [class]="agent.enabled ? 'status-enabled' : 'status-disabled'">
                {{ agent.enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
          </div>
          <div class="agent-actions">
            <button (click)="toggleAgent(agent)" class="btn-toggle" [class.enabled]="agent.enabled">
              {{ agent.enabled ? 'Disable' : 'Enable' }}
            </button>
            <button (click)="editAgent(agent)" class="edit-button">
              Edit
            </button>
            <button (click)="deleteAgent(agent.id)" class="delete-button">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Add/Edit Agent Form -->
      <div class="add-agent-form">
        <h3>{{ editingAgent ? 'Edit Agent' : 'Add New Agent' }}</h3>
        
        <div class="form-group">
          <label class="form-label">Name:</label>
          <input type="text" [(ngModel)]="newAgent.name" placeholder="Agent Name" class="form-input">
        </div>

        <div class="form-group">
          <label class="form-label">Description:</label>
          <input type="text" [(ngModel)]="newAgent.description" placeholder="Brief description of the agent" class="form-input">
        </div>

        <div class="form-group">
          <label class="form-label">System Prompt:</label>
          <textarea [(ngModel)]="newAgent.systemPrompt" 
                    placeholder="You are a helpful assistant that..."
                    class="form-textarea" rows="6"></textarea>
          <small class="form-help">Define the agent's role, behavior, and capabilities</small>
        </div>

        <div class="form-group">
          <label class="form-label">LLM Model:</label>
          <select [(ngModel)]="newAgent.llmModelId" class="form-select">
            <option value="">Select a model...</option>
            <option *ngFor="let model of llmModels" [value]="model.id">
              {{ model.name }} ({{ model.provider }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">MCP Servers:</label>
          <div class="mcp-servers-list">
            <div *ngFor="let server of mcpServers" class="server-checkbox">
              <label class="checkbox-label">
                <input type="checkbox" 
                       [checked]="newAgent.mcpServers.includes(server.id)"
                       (change)="toggleMCPServer(server.id)"
                       class="form-checkbox">
                <span class="checkbox-text">{{ server.name }}</span>
              </label>
            </div>
            <div *ngIf="mcpServers.length === 0" class="no-servers-note">
              No MCP servers available. Configure some in the MCP Servers section.
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="newAgent.enabled" class="form-checkbox">
            <span class="checkbox-text">Enable immediately</span>
          </label>
        </div>

        <div class="form-actions">
          <button (click)="saveAgent()" [disabled]="!isFormValid()" class="btn btn-primary" [class.disabled]="!isFormValid()">
            {{ editingAgent ? 'Update Agent' : 'Add Agent' }}
          </button>
          <button *ngIf="editingAgent" (click)="cancelEdit()" class="btn btn-secondary">
            Cancel
          </button>
          <button (click)="testAgent()" [disabled]="!isFormValid()" class="btn btn-test" [class.disabled]="!isFormValid()">
            Test Agent
          </button>
        </div>

        <div *ngIf="statusMessage" class="status-message" [class.error]="statusMessage.includes('Error')" [class.success]="!statusMessage.includes('Error')">
          {{ statusMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .agents-container {
      padding: 20px;
      max-width: 900px;
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

    .existing-agents-section {
      margin-bottom: 40px;
    }

    .no-agents-message {
      color: #666;
      padding: 30px;
      border: 2px dashed #ddd;
      border-radius: 8px;
      text-align: center;
      background: #fafafa;
      font-style: italic;
    }

    .agent-card {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 12px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s ease;
    }

    .agent-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .agent-info {
      flex: 1;
      margin-right: 20px;
    }

    .agent-name {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #333;
    }

    .agent-description {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }

    .agent-details {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .llm-badge, .mcp-badge, .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .llm-badge {
      background: #e3f2fd;
      color: #1976d2;
    }

    .mcp-badge {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .status-enabled {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .status-disabled {
      background: #ffebee;
      color: #c62828;
    }

    .agent-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 120px;
    }

    .btn-toggle {
      background: #ff9800;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    .btn-toggle.enabled {
      background: #4caf50;
    }

    .edit-button {
      background: #2196f3;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    .edit-button:hover {
      background: #1976d2;
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

    .add-agent-form {
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

    .form-input, .form-textarea, .form-select {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
      font-family: inherit;
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
      line-height: 1.4;
    }

    .form-input:focus, .form-textarea:focus, .form-select:focus {
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

    .mcp-servers-list {
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      padding: 15px;
      background: #f9f9f9;
      max-height: 200px;
      overflow-y: auto;
    }

    .server-checkbox {
      margin-bottom: 8px;
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

    .no-servers-note {
      color: #666;
      font-style: italic;
      text-align: center;
      padding: 10px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 30px;
      flex-wrap: wrap;
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

    .btn-test {
      background: #4caf50;
      color: white;
    }

    .btn-test:hover:not(.disabled) {
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
export class AgentsComponent implements OnInit {
  agents: Agent[] = [];
  llmModels: LLMModel[] = [];
  mcpServers: MCPServer[] = [];
  statusMessage = '';
  editingAgent: Agent | null = null;

  newAgent: any = {
    name: '',
    description: '',
    systemPrompt: '',
    llmModelId: '',
    mcpServers: [],
    enabled: true
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAgents();
    this.loadLLMModels();
    this.loadMCPServers();
  }

  loadAgents() {
    this.http.get<Agent[]>('/api/agents').subscribe({
      next: (agents) => {
        this.agents = agents;
      },
      error: (error) => {
        console.error('Error loading agents:', error);
        this.statusMessage = 'Error loading agents. Make sure backend is running.';
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

  loadMCPServers() {
    this.http.get<MCPServer[]>('/api/mcp').subscribe({
      next: (servers) => {
        this.mcpServers = servers.filter(s => s.enabled);
      },
      error: (error) => {
        console.error('Error loading MCP servers:', error);
      }
    });
  }

  getLLMName(llmModelId?: string): string {
    if (!llmModelId) return '';
    const model = this.llmModels.find(m => m.id === llmModelId);
    return model ? model.name : 'Unknown';
  }

  toggleMCPServer(serverId: string) {
    const index = this.newAgent.mcpServers.indexOf(serverId);
    if (index === -1) {
      this.newAgent.mcpServers.push(serverId);
    } else {
      this.newAgent.mcpServers.splice(index, 1);
    }
  }

  isFormValid(): boolean {
    return !!(this.newAgent.name && this.newAgent.systemPrompt);
  }

  saveAgent() {
    if (!this.isFormValid()) return;

    const request = this.editingAgent 
      ? this.http.put<{success: boolean, data: Agent}>(`/api/agents/${this.editingAgent.id}`, this.newAgent)
      : this.http.post<{success: boolean, data: Agent}>('/api/agents', this.newAgent);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          if (this.editingAgent) {
            const index = this.agents.findIndex(a => a.id === this.editingAgent!.id);
            if (index !== -1) {
              this.agents[index] = response.data;
            }
            this.statusMessage = 'Agent updated successfully!';
          } else {
            this.agents.push(response.data);
            this.statusMessage = 'Agent added successfully!';
          }
          this.resetForm();
        }
      },
      error: (error) => {
        console.error('Error saving agent:', error);
        this.statusMessage = 'Error saving agent: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  editAgent(agent: Agent) {
    this.editingAgent = agent;
    this.newAgent = {
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      llmModelId: agent.llmModelId || '',
      mcpServers: [...agent.mcpServers],
      enabled: agent.enabled
    };
  }

  cancelEdit() {
    this.resetForm();
  }

  testAgent() {
    if (!this.isFormValid()) return;

    this.statusMessage = 'Testing agent...';
    this.http.post<{success: boolean, message?: string}>('/api/agents/test', this.newAgent).subscribe({
      next: (response) => {
        this.statusMessage = response.success 
          ? 'Agent test successful!' 
          : 'Agent test failed: ' + (response.message || 'Unknown error');
      },
      error: (error) => {
        console.error('Error testing agent:', error);
        this.statusMessage = 'Agent test failed: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  toggleAgent(agent: Agent) {
    this.http.patch<{success: boolean, data: Agent}>(`/api/agents/${agent.id}`, { enabled: !agent.enabled }).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.agents.findIndex(a => a.id === agent.id);
          if (index !== -1) {
            this.agents[index] = response.data;
          }
          this.statusMessage = `Agent ${response.data.enabled ? 'enabled' : 'disabled'} successfully!`;
        }
      },
      error: (error) => {
        console.error('Error toggling agent:', error);
        this.statusMessage = 'Error toggling agent: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  deleteAgent(id: string) {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    this.http.delete<{success: boolean}>(`/api/agents/${id}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.agents = this.agents.filter(a => a.id !== id);
          this.statusMessage = 'Agent deleted successfully!';
        }
      },
      error: (error) => {
        console.error('Error deleting agent:', error);
        this.statusMessage = 'Error deleting agent: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  resetForm() {
    this.editingAgent = null;
    this.newAgent = {
      name: '',
      description: '',
      systemPrompt: '',
      llmModelId: '',
      mcpServers: [],
      enabled: true
    };
  }
}
