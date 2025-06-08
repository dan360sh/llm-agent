import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>Настройки</h1>
        <p>Управление моделями, MCP серверами и агентами</p>
      </div>

      <mat-tab-group class="settings-tabs" animationDuration="300ms">
        <!-- LLM Models Tab -->
        <mat-tab label="LLM Модели">
          <div class="tab-content">
            <app-llm-models></app-llm-models>
          </div>
        </mat-tab>

        <!-- MCP Servers Tab -->
        <mat-tab label="MCP Серверы">
          <div class="tab-content">
            <app-mcp-servers></app-mcp-servers>
          </div>
        </mat-tab>

        <!-- Agents Tab -->
        <mat-tab label="Агенты">
          <div class="tab-content">
            <app-agents></app-agents>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
      height: 100vh;
      overflow-y: auto;
      background: var(--background-color, #121212);
    }

    .settings-header {
      margin-bottom: 32px;
    }

    .settings-header h1 {
      margin: 0 0 8px 0;
      color: var(--text-primary, #fff);
      font-size: 2rem;
      font-weight: 600;
    }

    .settings-header p {
      margin: 0;
      color: var(--text-secondary, #aaa);
      font-size: 1rem;
    }

    .settings-tabs {
      height: calc(100vh - 150px);
    }

    .tab-content {
      padding: 24px 0;
      height: calc(100% - 48px);
      overflow-y: auto;
    }

    ::ng-deep .mat-mdc-tab-group {
      --mdc-tab-indicator-active-indicator-color: var(--primary-color, #2196f3);
    }

    ::ng-deep .mat-mdc-tab .mdc-tab__text-label {
      color: var(--text-secondary, #aaa);
    }

    ::ng-deep .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
      color: var(--primary-color, #2196f3);
    }
  `]
})
export class SettingsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
