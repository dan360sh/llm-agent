import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-edit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-container">
      <h2>Edit Agent</h2>
      <p>Agent editing functionality will be implemented here.</p>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
      background: white;
      margin: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class AgentEditComponent {
}