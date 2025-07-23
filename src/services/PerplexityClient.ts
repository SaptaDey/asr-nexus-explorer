// Disabled stub service
import { PerplexityRequest, PerplexityResponse } from '@/types/perplexityTypes';

export class PerplexityClient {
  constructor() {}
  
  async send(request: PerplexityRequest): Promise<PerplexityResponse> {
    throw new Error('PerplexityClient is disabled');
  }
  
  async sendBatch(requests: PerplexityRequest[]): Promise<PerplexityResponse[]> {
    throw new Error('PerplexityClient is disabled');
  }
}