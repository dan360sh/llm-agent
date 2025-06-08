import { LLMConfig, Message, OpenAIConfig, OllamaConfig } from '../models/types';
import { LLMProvider } from '../providers/llm-provider';
import { OpenAIProvider } from '../providers/openai-provider';
import { OllamaProvider } from '../providers/ollama-provider';
import { StorageService } from '../storage/storage.service';

export class LLMService {
  private storageService: StorageService;
  private providers: Map<string, LLMProvider> = new Map();

  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.initializeProviders();
  }

  private initializeProviders() {
    const configs = this.storageService.getLLMModels();
    
    for (const config of configs) {
      if (config.enabled) {
        this.createProvider(config);
      }
    }
  }

  private createProvider(config: LLMConfig): LLMProvider {
    let provider: LLMProvider;

    switch (config.provider) {
      case 'openai':
        provider = new OpenAIProvider(config.config as OpenAIConfig);
        break;
      case 'ollama':
        provider = new OllamaProvider(config.config as OllamaConfig);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    this.providers.set(config.id, provider);
    return provider;
  }

  async addLLMModel(config: LLMConfig): Promise<void> {
    config.createdAt = new Date();
    this.storageService.saveLLMModel(config);
    
    if (config.enabled) {
      this.createProvider(config);
    }
  }

  async updateLLMModel(config: LLMConfig): Promise<void> {
    this.storageService.saveLLMModel(config);
    
    // Пересоздаем провайдер
    this.providers.delete(config.id);
    if (config.enabled) {
      this.createProvider(config);
    }
  }

  async deleteLLMModel(id: string): Promise<void> {
    this.storageService.deleteLLMModel(id);
    this.providers.delete(id);
  }

  getLLMModels(): LLMConfig[] {
    return this.storageService.getLLMModels();
  }

  getLLMModel(id: string): LLMConfig | undefined {
    return this.storageService.getLLMModels().find((model: LLMConfig) => model.id === id);
  }

  async testConnection(id: string): Promise<boolean> {
    const config = this.getLLMModel(id);
    if (!config) {
      throw new Error(`LLM model not found: ${id}`);
    }

    try {
      const provider = this.providers.get(id) || this.createProvider(config);
      return await provider.testConnection();
    } catch (error) {
      console.error(`Connection test failed for ${id}:`, error);
      return false;
    }
  }

  async generateResponse(
    modelId: string,
    messages: Message[],
    onStream?: (chunk: string) => void
  ): Promise<string> {
    const provider = this.providers.get(modelId);
    if (!provider) {
      throw new Error(`Provider not found for model: ${modelId}`);
    }

    return await provider.generateResponse(messages, onStream);
  }

  supportsImages(modelId: string): boolean {
    const provider = this.providers.get(modelId);
    return provider?.supportsImages() || false;
  }

  getProvider(modelId: string): LLMProvider | undefined {
    return this.providers.get(modelId);
  }
}
