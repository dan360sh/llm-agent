import { Message, StreamResponse } from '../models/types';

export abstract class LLMProvider {
  abstract testConnection(): Promise<boolean>;
  abstract generateResponse(
    messages: Message[], 
    onStream?: (chunk: string) => void
  ): Promise<string>;
  abstract supportsImages(): boolean;
}

export interface LLMProviderConfig {
  id: string;
  name: string;
  provider: string;
  config: any;
}
