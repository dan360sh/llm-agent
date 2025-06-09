import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Agent, 
  Chat, 
  LLMModel, 
  MCPServer, 
  ApiResponse, 
  CreateChatRequest,
  SendMessageRequest 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // Chat API
  getChats(): Observable<ApiResponse<Chat[]>> {
    return this.http.get<ApiResponse<Chat[]>>(`${this.baseUrl}/chats`);
  }

  getChat(id: string): Observable<ApiResponse<Chat>> {
    return this.http.get<ApiResponse<Chat>>(`${this.baseUrl}/chats/${id}`);
  }

  createChat(request: CreateChatRequest): Observable<ApiResponse<Chat>> {
    return this.http.post<ApiResponse<Chat>>(`${this.baseUrl}/chats`, request);
  }

  deleteChat(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/chats/${id}`);
  }

  updateChatLLM(chatId: string, llmModelId: string): Observable<ApiResponse<Chat>> {
    return this.http.patch<ApiResponse<Chat>>(`${this.baseUrl}/chats/${chatId}/llm`, {
      llmModelId
    });
  }

  updateChatMCP(chatId: string, mcpServers: string[]): Observable<ApiResponse<Chat>> {
    return this.http.patch<ApiResponse<Chat>>(`${this.baseUrl}/chats/${chatId}/mcp`, {
      mcpServers
    });
  }

  // Message API
  sendMessage(request: SendMessageRequest): Observable<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('chatId', request.chatId);
    formData.append('content', request.content);
    
    if (request.images) {
      request.images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }

    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/chats/message`, formData);
  }

  // Agent API
  getAgents(): Observable<ApiResponse<Agent[]>> {
    return this.http.get<ApiResponse<Agent[]>>(`${this.baseUrl}/agents`);
  }

  getAgent(id: string): Observable<ApiResponse<Agent>> {
    return this.http.get<ApiResponse<Agent>>(`${this.baseUrl}/agents/${id}`);
  }

  createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Observable<ApiResponse<Agent>> {
    return this.http.post<ApiResponse<Agent>>(`${this.baseUrl}/agents`, agent);
  }

  updateAgent(id: string, agent: Partial<Agent>): Observable<ApiResponse<Agent>> {
    return this.http.patch<ApiResponse<Agent>>(`${this.baseUrl}/agents/${id}`, agent);
  }

  deleteAgent(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/agents/${id}`);
  }

  // LLM API
  getLLMModels(): Observable<ApiResponse<LLMModel[]>> {
    return this.http.get<ApiResponse<LLMModel[]>>(`${this.baseUrl}/llm`);
  }

  getLLMModel(id: string): Observable<ApiResponse<LLMModel>> {
    return this.http.get<ApiResponse<LLMModel>>(`${this.baseUrl}/llm/${id}`);
  }

  createLLMModel(model: Omit<LLMModel, 'id'>): Observable<ApiResponse<LLMModel>> {
    return this.http.post<ApiResponse<LLMModel>>(`${this.baseUrl}/llm`, model);
  }

  updateLLMModel(id: string, model: Partial<LLMModel>): Observable<ApiResponse<LLMModel>> {
    return this.http.patch<ApiResponse<LLMModel>>(`${this.baseUrl}/llm/${id}`, model);
  }

  deleteLLMModel(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/llm/${id}`);
  }

  testLLMConnection(id: string): Observable<ApiResponse<{ status: string }>> {
    return this.http.post<ApiResponse<{ status: string }>>(`${this.baseUrl}/llm/${id}/test`, {});
  }

  // MCP API
  getMCPServers(): Observable<ApiResponse<MCPServer[]>> {
    return this.http.get<ApiResponse<MCPServer[]>>(`${this.baseUrl}/mcp`);
  }

  getMCPServer(id: string): Observable<ApiResponse<MCPServer>> {
    return this.http.get<ApiResponse<MCPServer>>(`${this.baseUrl}/mcp/${id}`);
  }

  createMCPServer(server: Omit<MCPServer, 'id' | 'status'>): Observable<ApiResponse<MCPServer>> {
    return this.http.post<ApiResponse<MCPServer>>(`${this.baseUrl}/mcp`, server);
  }

  updateMCPServer(id: string, server: Partial<MCPServer>): Observable<ApiResponse<MCPServer>> {
    return this.http.patch<ApiResponse<MCPServer>>(`${this.baseUrl}/mcp/${id}`, server);
  }

  deleteMCPServer(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/mcp/${id}`);
  }

  toggleMCPServer(id: string, enabled: boolean): Observable<ApiResponse<MCPServer>> {
    return this.http.patch<ApiResponse<MCPServer>>(`${this.baseUrl}/mcp/${id}/toggle`, {
      enabled
    });
  }
}
