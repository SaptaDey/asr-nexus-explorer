import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock Gemini API responses
const mockGeminiResponse = {
  candidates: [{
    content: {
      parts: [{
        text: JSON.stringify({
          stage_number: 1,
          content: "Mock Gemini response for testing",
          nodes: [{
            id: "test-node-1",
            label: "Test Node",
            confidence: [0.8, 0.7, 0.9, 0.6],
            metadata: { source: "test" }
          }],
          edges: [{
            source: "test-node-1",
            target: "test-node-2", 
            type: "supportive",
            weight: 0.8
          }],
          hyperedges: [],
          status: "completed"
        })
      }]
    }
  }],
  usageMetadata: {
    promptTokenCount: 100,
    candidatesTokenCount: 200,
    totalTokenCount: 300
  }
};

// Mock Perplexity Sonar API responses
const mockPerplexityResponse = {
  id: "test-request-id",
  model: "llama-3.1-sonar-small-128k-online",
  created: Date.now(),
  usage: {
    prompt_tokens: 50,
    completion_tokens: 150,
    total_tokens: 200
  },
  object: "chat.completion",
  choices: [{
    index: 0,
    finish_reason: "stop",
    message: {
      role: "assistant",
      content: JSON.stringify({
        evidence: "Mock evidence from Perplexity search",
        sources: ["https://example.com/source1", "https://example.com/source2"],
        confidence: 0.85,
        citations: ["Smith et al. 2024", "Jones et al. 2023"]
      }),
    },
    delta: {
      role: "assistant",
      content: ""
    }
  }]
};

// Mock Supabase responses
const mockSupabaseUser = {
  id: "test-user-id",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00.000Z",
  user_metadata: {}
};

const mockSupabaseSession = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: mockSupabaseUser
};

export const handlers = [
  // Gemini API mocks
  http.post('https://generativelanguage.googleapis.com/v1beta/models/*', async ({ request }) => {
    const body = await request.json() as any;
    
    // Simulate different responses based on request content
    if (body.contents?.[0]?.parts?.[0]?.text?.includes('ERROR_TEST')) {
      return HttpResponse.json({ error: 'Mock API error' }, { status: 500 });
    }
    
    // Simulate rate limiting
    if (body.contents?.[0]?.parts?.[0]?.text?.includes('RATE_LIMIT_TEST')) {
      return HttpResponse.json({ 
        error: { message: 'Rate limit exceeded', code: 429 } 
      }, { status: 429 });
    }
    
    return HttpResponse.json(mockGeminiResponse);
  }),

  // Perplexity API mocks
  http.post('https://api.perplexity.ai/chat/completions', async ({ request }) => {
    const body = await request.json() as any;
    
    // Simulate different responses based on request content
    if (body.messages?.[0]?.content?.includes('ERROR_TEST')) {
      return HttpResponse.json({ error: 'Mock Perplexity error' }, { status: 500 });
    }
    
    if (body.messages?.[0]?.content?.includes('RATE_LIMIT_TEST')) {
      return HttpResponse.json({ 
        error: { message: 'Rate limit exceeded', type: 'rate_limit' } 
      }, { status: 429 });
    }
    
    return HttpResponse.json(mockPerplexityResponse);
  }),

  // Supabase Auth mocks
  http.post('https://*.supabase.co/auth/v1/token', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.email === 'invalid@test.com') {
      return HttpResponse.json({ 
        error: 'Invalid login credentials' 
      }, { status: 400 });
    }
    
    return HttpResponse.json(mockSupabaseSession);
  }),

  http.get('https://*.supabase.co/auth/v1/user', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return HttpResponse.json(mockSupabaseUser);
  }),

  // Supabase Database mocks
  http.get('https://*.supabase.co/rest/v1/research_sessions', () => {
    return HttpResponse.json([{
      id: "test-session-1",
      user_id: "test-user-id",
      session_name: "Test Session",
      created_at: "2024-01-01T00:00:00.000Z",
      graph_data: { nodes: [], edges: [] },
      stage_results: {}
    }]);
  }),

  http.post('https://*.supabase.co/rest/v1/research_sessions', async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      id: "new-session-id",
      ...body,
      created_at: new Date().toISOString()
    });
  }),

  http.patch('https://*.supabase.co/rest/v1/research_sessions', async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      id: "test-session-1",
      ...body,
      updated_at: new Date().toISOString()
    });
  }),

  http.delete('https://*.supabase.co/rest/v1/research_sessions', () => {
    return HttpResponse.json({ message: 'Session deleted successfully' });
  }),

  // Query history mocks
  http.get('https://*.supabase.co/rest/v1/query_history', () => {
    return HttpResponse.json([{
      id: "query-1",
      user_id: "test-user-id",
      query_text: "Test query",
      results: { mock: "results" },
      created_at: "2024-01-01T00:00:00.000Z"
    }]);
  }),

  // Error handling for unmatched requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json({ error: 'Unhandled request in mock server' }, { status: 404 });
  }),
];

export const server = setupServer(...handlers);