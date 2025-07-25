
/**
 * Mock Service Worker (MSW) Server Setup
 * Provides API mocking for tests
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Define mock handlers
const handlers = [
  rest.get('/api/sessions', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [],
        error: null
      })
    );
  }),
  
  rest.post('/api/sessions', (req, res, ctx) => {
    return res(
      ctx.json({
        data: { id: 'test-session-id' },
        error: null
      })
    );
  }),
];

// Create and export the server
export const server = setupServer(...handlers);
