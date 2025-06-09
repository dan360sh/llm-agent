import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px;">
      <h1>LLM Agent Test Page</h1>
      <p>If you see this, Angular is working!</p>
    </div>
  `
})
export class TestComponent {
}
