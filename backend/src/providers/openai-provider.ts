import OpenAI from 'openai';
import { LLMProvider } from './llm-provider';
import { Message, OpenAIConfig } from '../models/types';

export class OpenAIProvider extends LLMProvider {
  private openai: OpenAI;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    super();
    this.config = config;
    this.openai = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      defaultHeaders: config.headers,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return !!response;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  async generateResponse(
    messages: Message[], 
    onStream?: (chunk: string) => void
  ): Promise<string> {
    try {
      const openaiMessages = this.convertMessages(messages);
      
      if (onStream) {
        return await this.generateStreamingResponse(openaiMessages, onStream);
      } else {
        return await this.generateNonStreamingResponse(openaiMessages);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  private async generateStreamingResponse(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    onStream: (chunk: string) => void
  ): Promise<string> {
    const stream = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: messages,
      max_tokens: this.config.maxTokens || 3000,
      temperature: this.config.temperature || 0.7,
      stream: true,
    });

    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onStream(content);
      }
    }

    return fullResponse;
  }

  private async generateNonStreamingResponse(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: messages,
      max_tokens: this.config.maxTokens || 3000,
      temperature: this.config.temperature || 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }

  private convertMessages(messages: Message[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map(msg => {
      if (msg.images && msg.images.length > 0 && msg.role === 'user') {
        return {
          role: 'user',
          content: [
            { type: 'text', text: msg.content },
            ...msg.images.map(image => ({
              type: 'image_url' as const,
              image_url: { url: image }
            }))
          ]
        };
      } else {
        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        };
      }
    });
  }

  supportsImages(): boolean {
    // Проверяем если модель поддерживает изображения (например, GPT-4V)
    return this.config.model.includes('vision') || 
           this.config.model.includes('gpt-4') ||
           this.config.model.includes('gpt-4o');
  }
}
