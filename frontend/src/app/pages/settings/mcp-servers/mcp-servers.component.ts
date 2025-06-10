import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface MCPServer {
  id: string;
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
  status?: 'connected' | 'disconnected' | 'error';
  createdAt?: Date;
}

@Component({
  selector: 'app-mcp-servers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mcp-servers-container">
      <h2>MCP Servers</h2>
      
      <!-- Existing Servers -->
      <div class="existing-servers-section">
        <h3>Existing Servers</h3>
        <div *ngIf="servers.length === 0" class="no-servers-message">
          No MCP servers configured yet. Add one below.
        </div>
        <div *ngFor="let server of servers" class="server-card">
          <div class="server-info">
            <h4 class="server-name">{{ server.name }}</h4>
            <p class="server-details">
              <code class="command-badge">{{ server.command }}</code>
              <span class="status-badge" [class]="'status-' + (server.status || 'disconnected')">
                {{ server.status || 'disconnected' }}
              </span>
            </p>
          </div>
          <div class="server-actions">
            <button (click)="toggleServer(server)" class="btn-toggle" [class.enabled]="server.enabled">
              {{ server.enabled ? 'Disable' : 'Enable' }}
            </button>
            <button (click)="deleteServer(server.id)" class="delete-button">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Add New Server Form -->
      <div class="add-server-form">
        <h3>Add New MCP Server</h3>
        
        <div class="form-group">
          <label class="form-label">Name:</label>
          <input type="text" [(ngModel)]="newServer.name" placeholder="Server Name" class="form-input">
        </div>

        <div class="form-group">
          <label class="form-label">Command:</label>
          <input type="text" [(ngModel)]="newServer.command" placeholder="node server.js" class="form-input">
          <small class="form-help">Full command to start the MCP server</small>
        </div>

        <div class="form-group">
          <label class="form-label">Arguments (one per line):</label>
          <textarea [(ngModel)]="argsText" placeholder="--config&#10;config.json&#10;--verbose" 
                    class="form-textarea" rows="4"></textarea>
          <small class="form-help">Optional command line arguments, one per line</small>
        </div>

        <div class="form-group">
          <label class="form-label">Environment Variables:</label>
          <div class="env-vars">
            <div *ngFor="let env of envVars; let i = index" class="env-var-row">
              <input type="text" [(ngModel)]="env.key" placeholder="Variable name" class="env-input">
              <input type="text" [(ngModel)]="env.value" placeholder="Value" class="env-input">
              <button (click)="removeEnvVar(i)" class="remove-btn">×</button>
            </div>
            <button (click)="addEnvVar()" class="add-env-btn">+ Add Environment Variable</button>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="newServer.enabled" class="form-checkbox">
            <span class="checkbox-text">Enable immediately</span>
          </label>
        </div>

        <div class="form-actions">
          <button (click)="addServer()" [disabled]="!isFormValid()" class="btn btn-primary" [class.disabled]="!isFormValid()">
            Add Server
          </button>
          <button (click)="testServer()" [disabled]="!isFormValid()" class="btn btn-secondary" [class.disabled]="!isFormValid()">
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
    .mcp-servers-container {
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

    .existing-servers-section {
      margin-bottom: 40px;
    }

    .no-servers-message {
      color: #666;
      padding: 30px;
      border: 2px dashed #ddd;
      border-radius: 8px;
      text-align: center;
      background: #fafafa;
      font-style: italic;
    }

    .server-card {
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

    .server-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .server-info {
      flex: 1;
    }

    .server-name {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #333;
    }

    .server-details {
      margin: 0;
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }

    .command-badge {
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #333;
      border: 1px solid #ddd;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-connected {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .status-disconnected {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-error {
      background: #ffebee;
      color: #c62828;
    }

    .server-actions {
      display: flex;
      gap: 8px;
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

    .btn-toggle:hover {
      opacity: 0.9;
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

    .add-server-form {
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

    .form-input, .form-textarea {
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
      min-height: 100px;
      font-family: 'Courier New', monospace;
    }

    .form-input:focus, .form-textarea:focus {
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

    .env-vars {
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      padding: 15px;
      background: #f9f9f9;
    }

    .env-var-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      align-items: center;
    }

    .env-input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .remove-btn {
      background: #f44336;
      color: white;
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .add-env-btn {
      background: #2196f3;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
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
export class MCPServersComponent implements OnInit {
  servers: MCPServer[] = [];
  statusMessage = '';
  argsText = '';
  envVars: { key: string; value: string }[] = [];

  newServer: any = {
    name: '',
    command: '',
    args: [],
    env: {},
    enabled: true
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadServers();
  }

  loadServers() {
    this.http.get<{success: boolean, data: MCPServer[]}>('/api/mcp').subscribe({
      next: (response) => {
        this.servers = response.data || [];
      },
      error: (error) => {
        console.error('Error loading servers:', error);
        this.statusMessage = 'Error loading servers. Make sure backend is running.';
      }
    });
  }

  addEnvVar() {
    this.envVars.push({ key: '', value: '' });
  }

  removeEnvVar(index: number) {
    this.envVars.splice(index, 1);
  }

  isFormValid(): boolean {
    return !!(this.newServer.name && this.newServer.command);
  }

  addServer() {
    if (!this.isFormValid()) return;

    // Prepare the server data
    const serverData = {
      ...this.newServer,
      args: this.argsText.split('\n').filter(arg => arg.trim()).map(arg => arg.trim()),
      env: this.envVars.reduce((acc, env) => {
        if (env.key && env.value) {
          acc[env.key] = env.value;
        }
        return acc;
      }, {} as Record<string, string>)
    };

    this.http.post<{success: boolean, data: MCPServer}>('/api/mcp', serverData).subscribe({
      next: (response) => {
        if (response.success) {
          this.servers.push(response.data);
          this.statusMessage = 'Server added successfully!';
          this.resetForm();
        }
      },
      error: (error) => {
        console.error('Error adding server:', error);
        this.statusMessage = 'Error adding server: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  testServer() {
    if (!this.isFormValid()) return;

    const serverData = {
      ...this.newServer,
      args: this.argsText.split('\n').filter(arg => arg.trim()).map(arg => arg.trim()),
      env: this.envVars.reduce((acc, env) => {
        if (env.key && env.value) {
          acc[env.key] = env.value;
        }
        return acc;
      }, {} as Record<string, string>)
    };

    this.statusMessage = 'Testing server connection...';
    this.http.post<{success: boolean, message?: string}>('/api/mcp/test', serverData).subscribe({
      next: (response) => {
        this.statusMessage = response.success ? 'Server test successful!' : 'Server test failed: ' + (response.message || 'Unknown error');
      },
      error: (error) => {
        console.error('Error testing server:', error);
        this.statusMessage = 'Server test failed: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  toggleServer(server: MCPServer) {
    this.http.patch<{success: boolean, data: MCPServer}>(`/api/mcp/${server.id}`, { enabled: !server.enabled }).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.servers.findIndex(s => s.id === server.id);
          if (index !== -1) {
            this.servers[index] = response.data;
          }
          this.statusMessage = `Server ${response.data.enabled ? 'enabled' : 'disabled'} successfully!`;
        }
      },
      error: (error) => {
        console.error('Error toggling server:', error);
        this.statusMessage = 'Error toggling server: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  deleteServer(id: string) {
    if (!confirm('Are you sure you want to delete this server?')) return;

    this.http.delete<{success: boolean}>(`/api/mcp/${id}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.servers = this.servers.filter(s => s.id !== id);
          this.statusMessage = 'Server deleted successfully!';
        }
      },
      error: (error) => {
        console.error('Error deleting server:', error);
        this.statusMessage = 'Error deleting server: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  resetForm() {
    this.newServer = {
      name: '',
      command: '',
      args: [],
      env: {},
      enabled: true
    };
    this.argsText = '';
    this.envVars = [];
  }
}
