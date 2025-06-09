import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LLMModelsComponent } from './llm-models/llm-models.component';
import { MCPServersComponent } from './mcp-servers/mcp-servers.component';
import { AgentsComponent } from './agents/agents.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    LLMModelsComponent,
    MCPServersComponent,
    AgentsComponent
  ],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h2>Settings</h2>
        <p class="settings-description">Configure your LLM models, MCP servers, and agents</p>
      </div>
      
      <nav class="settings-nav">
        <button (click)="setActiveTab('llm')" 
                [class.active]="activeTab === 'llm'"
                class="nav-button">
          LLM Models
        </button>
        <button (click)="setActiveTab('mcp')" 
                [class.active]="activeTab === 'mcp'"
                class="nav-button">
          MCP Servers
        </button>
        <button (click)="setActiveTab('agents')" 
                [class.active]="activeTab === 'agents'"
                class="nav-button">
          Agents
        </button>
      </nav>
      
      <div class="settings-content">
        <app-llm-models *ngIf="activeTab === 'llm'"></app-llm-models>
        <app-mcp-servers *ngIf="activeTab === 'mcp'"></app-mcp-servers>
        <app-agents *ngIf="activeTab === 'agents'"></app-agents>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 0;
      max-width: 1000px;
      margin: 0 auto;
    }

    .settings-header {
      padding: 30px 20px 20px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-bottom: 0;
    }

    .settings-header h2 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 300;
    }

    .settings-description {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .settings-nav {
      display: flex;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .nav-button {
      flex: 1;
      padding: 18px 24px;
      border: none;
      background: white;
      color: #666;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 3px solid transparent;
    }

    .nav-button:hover {
      background: #f5f5f5;
      color: #333;
    }

    .nav-button.active {
      color: #2196f3;
      border-bottom-color: #2196f3;
      background: #fafafa;
    }

    .settings-content {
      background: #fafafa;
      min-height: calc(100vh - 180px);
    }

    /* Override child component containers */
    .settings-content :host ::ng-deep .llm-models-container,
    .settings-content :host ::ng-deep .mcp-servers-container,
    .settings-content :host ::ng-deep .agents-container {
      max-width: none;
      margin: 0;
    }

    .settings-content :host ::ng-deep h2 {
      display: none;
    }
  `]
})
export class SettingsComponent {
  activeTab: 'llm' | 'mcp' | 'agents' = 'llm';

  setActiveTab(tab: 'llm' | 'mcp' | 'agents') {
    this.activeTab = tab;
  }
}
