import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  { path: '', redirectTo: 'llm-models', pathMatch: 'full' },
  { 
    path: 'llm-models', 
    loadComponent: () => import('./llm-models/llm-models.component').then(m => m.LLMModelsComponent)
  },
  { 
    path: 'mcp-servers', 
    loadComponent: () => import('./mcp-servers/mcp-servers.component').then(m => m.MCPServersComponent)
  },
  { 
    path: 'agents', 
    loadComponent: () => import('./agents/agents.component').then(m => m.AgentsComponent)
  },
  { 
    path: 'agents/:id', 
    loadComponent: () => import('./agents/agent-edit/agent-edit.component').then(m => m.AgentEditComponent)
  }
];
