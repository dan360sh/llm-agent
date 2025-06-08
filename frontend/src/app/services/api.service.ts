import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  LLMConfig, 
  Agent, 
  Chat, 
  MCPServer, 
  CreateChatRequest, 
  SendMessageRequest,
  MCPConfig,
  ApiResponse 
} from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Health check
  health(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // LLM Models
  getLLMModels(): Observable<LLMConfig[]> {
    return this.http.get<LLMConfig[]>(`${this.baseUrl}/llm`);
  }

  getLLMModel(id: string): Observable<LLMConfig> {
    return this.http.get<LLMConfig>(`${this.baseUrl}/llm/${id}`);
  }

  addLLMModel(model: Partial<LLMConfig>): Observable<LLMConfig> {
    return this.http.post<LLMConfig>(`${this.baseUrl}/llm`, model, { headers: this.getHeaders() });
  }

  updateLLMModel(id: string, model: Partial<LLMConfig>): Observable<LLMConfig> {
    return this.http.put<LLMConfig>(`${this.baseUrl}/llm/${id}`, model, { headers: this.getHeaders() });
  }

  deleteLLMModel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/llm/${id}`);
  }

  testLLMConnection(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/llm/${id}/test`, {}, { headers: this.getHeaders() });
  }

  // Agents
  getAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.baseUrl}/agents`);
  }

  getAgent(id: string): Observable<Agent> {
    return this.http.get<Agent>(`${this.baseUrl}/agents/${id}`);
  }

  createAgent(agent: Partial<Agent>): Observable<Agent> {
    return this.http.post<Agent>(`${this.baseUrl}/agents`, agent, { headers: this.getHeaders() });
  }

  updateAgent(id: string, agent: Partial<Agent>): Observable<Agent> {
    return this.http.put<Agent>(`${this.baseUrl}/agents/${id}`, agent, { headers: this.getHeaders() });
  }

  deleteAgent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/agents/${id}`);
  }

  duplicateAgent(id: string): Observable<Agent> {
    return this.http.post<Agent>(`${this.baseUrl}/agents/${id}/duplicate`, {}, { headers: this.getHeaders() });
  }

  // Chats
  getChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.baseUrl}/chats`);
  }

  getChat(id: string): Observable<Chat> {
    return this.http.get<Chat>(`${this.baseUrl}/chats/${id}`);
  }

  createChat(request: CreateChatRequest): Observable<Chat> {
    return this.http.post<Chat>(`${this.baseUrl}/chats`, request, { headers: this.getHeaders() });
  }

  updateChat(id: string, updates: Partial<Chat>): Observable<Chat> {
    return this.http.put<Chat>(`${this.baseUrl}/chats/${id}`, updates, { headers: this.getHeaders() });
  }

  deleteChat(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/chats/${id}`);
  }

  duplicateChat(id: string): Observable<Chat> {
    return this.http.post<Chat>(`${this.baseUrl}/chats/${id}/duplicate`, {}, { headers: this.getHeaders() });
  }

  clearChat(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/chats/${id}/clear`, {}, { headers: this.getHeaders() });
  }

  searchChats(query: string): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.baseUrl}/chats/search?q=${encodeURIComponent(query)}`);
  }

  sendMessage(chatId: string, request: SendMessageRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/chats/${chatId}/messages`, request, { headers: this.getHeaders() });
  }

  updateMessage(chatId: string, messageId: string, content: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/chats/${chatId}/messages/${messageId}`, 
      { content }, { headers: this.getHeaders() });
  }

  deleteMessage(chatId: string, messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/chats/${chatId}/messages/${messageId}`);
  }

  // MCP Servers
  getMCPServers(): Observable<MCPServer[]> {
    return this.http.get<MCPServer[]>(`${this.baseUrl}/mcp`);
  }

  getMCPServer(id: string): Observable<MCPServer> {
    return this.http.get<MCPServer>(`${this.baseUrl}/mcp/${id}`);
  }

  addMCPServer(server: Partial<MCPServer>): Observable<MCPServer> {
    return this.http.post<MCPServer>(`${this.baseUrl}/mcp`, server, { headers: this.getHeaders() });
  }

  updateMCPServer(id: string, server: Partial<MCPServer>): Observable<MCPServer> {
    return this.http.put<MCPServer>(`${this.baseUrl}/mcp/${id}`, server, { headers: this.getHeaders() });
  }

  deleteMCPServer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/mcp/${id}`);
  }

  toggleMCPServer(id: string): Observable<MCPServer> {
    return this.http.post<MCPServer>(`${this.baseUrl}/mcp/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  startMCPServer(id: string): Observable<ApiResponse<MCPServer>> {
    return this.http.post<ApiResponse<MCPServer>>(`${this.baseUrl}/mcp/${id}/start`, {}, { headers: this.getHeaders() });
  }

  stopMCPServer(id: string): Observable<ApiResponse<MCPServer>> {
    return this.http.post<ApiResponse<MCPServer>>(`${this.baseUrl}/mcp/${id}/stop`, {}, { headers: this.getHeaders() });
  }

  getMCPServerTools(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/mcp/${id}/tools`);
  }

  getMCPServerResources(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/mcp/${id}/resources`);
  }

  callMCPTool(serverId: string, toolName: string, args: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/mcp/${serverId}/call-tool`, 
      { toolName, arguments: args }, { headers: this.getHeaders() });
  }

  importMCPConfig(config: MCPConfig): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/mcp/import-config`, config, { headers: this.getHeaders() });
  }

  // File upload
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }
}
