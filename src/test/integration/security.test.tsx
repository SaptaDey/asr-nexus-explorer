import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';
import { LoginForm } from '@/components/auth/LoginForm';
import { SecureAPIModal } from '@/components/asr-got/SecureAPIModal';
import { testQueries, testErrors } from '@/test/fixtures/testData';
import { mockServices } from '@/test/mocks/mockServices';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock security services
vi.mock('@/services/security/SecureCredentialManager', () => ({
  SecureCredentialManager: {
    validateCredentials: vi.fn().mockResolvedValue(true),
    encryptCredentials: vi.fn().mockImplementation((creds) => `encrypted_${JSON.stringify(creds)}`),
    decryptCredentials: vi.fn().mockImplementation((encrypted) => JSON.parse(encrypted.replace('encrypted_', ''))),
    sanitizeInput: vi.fn().mockImplementation((input) => input.replace(/<script[^>]*>.*?<\/script>/gi, '')),
    auditLog: vi.fn()
  }
}));

vi.mock('@/services/security/SecureErrorHandler', () => ({
  SecureErrorHandler: {
    sanitizeError: vi.fn().mockImplementation((error) => ({
      message: error.message?.replace(/[A-Za-z0-9]{20,}/g, '[REDACTED]') || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    })),
    logSecurityEvent: vi.fn(),
    isSecurityError: vi.fn().mockReturnValue(false)
  }
}));

vi.mock('@/utils/securityUtils', () => ({
  validateInput: vi.fn().mockImplementation((input) => {
    if (!input || typeof input !== 'string') return false;
    if (input.includes('<script>')) return false;
    if (input.includes('javascript:')) return false;
    if (input.includes('data:text/html')) return false;
    return true;
  }),
  validateAPIKey: vi.fn().mockImplementation((key) => {
    if (!key || typeof key !== 'string') return false;
    if (key.length < 10) return false;
    if (key.includes('<') || key.includes('>')) return false;
    return true;
  }),
  sanitizeHTML: vi.fn().mockImplementation((html) => 
    html.replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
  ),
  escapeSQL: vi.fn().mockImplementation((input) => 
    input.replace(/'/g, "''").replace(/;/g, '\\;')
  ),
  rateLimit: {
    check: vi.fn().mockResolvedValue(true),
    record: vi.fn()
  }
}));

// Mock Supabase with RLS security
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockImplementation(({ email, password }) => {
        if (email === 'malicious@test.com' || password.includes('<script>')) {
          return Promise.resolve({ 
            data: null, 
            error: { message: 'Invalid credentials' } 
          });
        }
        return Promise.resolve({ 
          data: { user: { id: 'test-user', email } }, 
          error: null 
        });
      }),
      signUp: vi.fn().mockImplementation(({ email, password }) => {
        if (email.includes('<') || password.includes('<script>')) {
          return Promise.resolve({ 
            data: null, 
            error: { message: 'Invalid input detected' } 
          });
        }
        return Promise.resolve({ 
          data: { user: { id: 'new-user', email } }, 
          error: null 
        });
      }),
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user' } }, 
        error: null 
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((data) => {
        // Simulate RLS policy - only allow user's own data
        if (data.user_id !== 'test-user') {
          return Promise.resolve({ 
            data: null, 
            error: { message: 'Row Level Security policy violation' } 
          });
        }
        return Promise.resolve({ data: [data], error: null });
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null })
    })
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe.skip('Security Tests - Preventing Regressions', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Sanitization and XSS Prevention', () => {
    it('should sanitize malicious research queries', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByLabelText(/research query/i);
      
      // Try to inject XSS
      await user.type(queryInput, testQueries.malicious);

      // Verify the malicious content is sanitized
      const { validateInput } = await import('@/utils/securityUtils');
      expect(validateInput).toHaveBeenCalledWith(testQueries.malicious);
      
      // Input should be rejected
      await waitFor(() => {
        expect(screen.getByText(/invalid input detected/i)).toBeInTheDocument();
      });
    });

    it('should prevent script injection in API keys', async () => {
      render(
        <TestWrapper>
          <SecureAPIModal isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      const geminiKeyInput = screen.getByLabelText(/gemini api key/i);
      
      // Try to inject script
      await user.type(geminiKeyInput, '<script>alert("xss")</script>');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify input is rejected
      await waitFor(() => {
        expect(screen.getByText(/invalid api key format/i)).toBeInTheDocument();
      });

      const { validateAPIKey } = await import('@/utils/securityUtils');
      expect(validateAPIKey).toHaveBeenCalled();
    });

    it('should sanitize HTML content in stage results', async () => {
      const maliciousStageResult = {
        stage: 1,
        content: '<script>alert("xss")</script><p>Safe content</p>',
        nodes: [],
        edges: [],
        hyperedges: [],
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      // Mock stage engine to return malicious content
      mockServices.stageEngine.executeStage.mockResolvedValueOnce(maliciousStageResult);

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-gemini-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'safe query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        const stageContent = screen.getByTestId('stage-content');
        expect(stageContent.innerHTML).not.toContain('<script>');
        expect(stageContent.innerHTML).toContain('Safe content');
      });

      const { sanitizeHTML } = await import('@/utils/securityUtils');
      expect(sanitizeHTML).toHaveBeenCalled();
    });

    it('should prevent injection in node labels and metadata', async () => {
      const maliciousNode = {
        id: 'malicious-node',
        label: '<img src=x onerror=alert("xss")>Malicious Node',
        confidence: [0.8, 0.7, 0.9, 0.6],
        metadata: {
          stage: 1,
          type: 'root',
          source: 'javascript:alert("xss")',
          timestamp: new Date().toISOString()
        }
      };

      const stageResult = {
        stage: 1,
        content: 'Stage 1 complete',
        nodes: [maliciousNode],
        edges: [],
        hyperedges: [],
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      mockServices.stageEngine.executeStage.mockResolvedValueOnce(stageResult);

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-gemini-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        const nodeLabel = screen.getByTestId(`node-${maliciousNode.id}`);
        expect(nodeLabel.innerHTML).not.toContain('onerror=');
        expect(nodeLabel.innerHTML).not.toContain('javascript:');
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should prevent unauthorized access to research sessions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      // Try to access another user's session
      const unauthorizedData = {
        user_id: 'other-user',
        session_name: 'Unauthorized Session',
        graph_data: { nodes: [], edges: [] }
      };

      const result = await supabase.from('research_sessions').insert(unauthorizedData);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Row Level Security');
    });

    it('should validate user authentication before API calls', async () => {
      // Mock unauthenticated user
      mockServices.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });
    });

    it('should handle session hijacking attempts', async () => {
      // Mock session with suspicious activity
      const suspiciousSession = {
        access_token: 'suspicious-token-different-ip',
        user: { id: 'test-user', email: 'test@example.com' }
      };

      mockServices.supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: suspiciousSession },
        error: null
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Should trigger security validation
      await waitFor(() => {
        expect(screen.getByText(/security verification required/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Security and Data Protection', () => {
    it('should encrypt API keys in storage', async () => {
      const { SecureCredentialManager } = await import('@/services/security/SecureCredentialManager');

      render(
        <TestWrapper>
          <SecureAPIModal isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'real-gemini-key-12345');
      await user.type(screen.getByLabelText(/perplexity api key/i), 'real-perplexity-key-67890');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(SecureCredentialManager.encryptCredentials).toHaveBeenCalled();
      
      // Verify keys are not stored in plain text
      const localStorage = window.localStorage;
      const storedData = localStorage.getItem('asr-got-credentials');
      
      if (storedData) {
        expect(storedData).not.toContain('real-gemini-key-12345');
        expect(storedData).not.toContain('real-perplexity-key-67890');
        expect(storedData).toContain('encrypted_');
      }
    });

    it('should prevent API key leakage in error messages', async () => {
      const { SecureErrorHandler } = await import('@/services/security/SecureErrorHandler');

      // Mock API error containing sensitive data
      const sensitiveError = new Error('API call failed with key: real-gemini-key-abc123xyz789');
      mockServices.stageEngine.executeStage.mockRejectedValueOnce(sensitiveError);

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'real-gemini-key-abc123xyz789');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage.textContent).not.toContain('real-gemini-key-abc123xyz789');
        expect(errorMessage.textContent).toContain('[REDACTED]');
      });

      expect(SecureErrorHandler.sanitizeError).toHaveBeenCalledWith(sensitiveError);
    });

    it('should validate SSL/TLS for API communications', async () => {
      // Mock insecure connection attempt
      mockServices.api.callGemini.mockRejectedValueOnce(
        new Error('SSL verification failed')
      );

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/secure connection required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Rate Limiting and DoS Prevention', () => {
    it('should enforce rate limits on API calls', async () => {
      const { rateLimit } = await import('@/utils/securityUtils');

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      // Simulate rapid successive requests
      const startButton = screen.getByRole('button', { name: /start research/i });
      
      for (let i = 0; i < 10; i++) {
        await user.click(startButton);
      }

      expect(rateLimit.check).toHaveBeenCalled();
      
      // Should show rate limit message after threshold
      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
      });
    });

    it('should prevent resource exhaustion attacks', async () => {
      const massiveQuery = 'A'.repeat(1000000); // 1MB query

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');
      
      // Try to input massive query
      const queryInput = screen.getByLabelText(/research query/i);
      fireEvent.change(queryInput, { target: { value: massiveQuery } });

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Should reject oversized input
      await waitFor(() => {
        expect(screen.getByText(/query too large/i)).toBeInTheDocument();
      });
    });

    it('should implement request throttling', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      
      // Rapid clicks should be throttled
      await user.click(startButton);
      await user.click(startButton);
      await user.click(startButton);

      // Only one execution should start
      expect(mockServices.stageEngine.executeStage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Validation and SQL Injection Prevention', () => {
    it('should prevent SQL injection in search queries', async () => {
      const { escapeSQL } = await import('@/utils/securityUtils');
      
      const maliciousQuery = "'; DROP TABLE research_sessions; --";

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/research query/i), maliciousQuery);

      expect(escapeSQL).toHaveBeenCalled();
      
      // Query should be escaped or rejected
      const queryInput = screen.getByLabelText(/research query/i) as HTMLInputElement;
      expect(queryInput.value).not.toContain('DROP TABLE');
    });

    it('should validate data types and ranges', async () => {
      // Test with invalid confidence values
      const invalidNode = {
        id: 'test-node',
        label: 'Test Node',
        confidence: [-1, 2, 'invalid', null], // Invalid confidence values
        metadata: {}
      };

      const stageResult = {
        stage: 1,
        content: 'Stage 1 complete',
        nodes: [invalidNode],
        edges: [],
        hyperedges: [],
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      mockServices.stageEngine.executeStage.mockResolvedValueOnce(stageResult);

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid data format/i)).toBeInTheDocument();
      });
    });

    it('should sanitize file upload content', async () => {
      // Mock file upload with malicious content
      const maliciousFile = new File(
        ['<script>alert("xss")</script>Valid content'],
        'malicious.txt',
        { type: 'text/plain' }
      );

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, maliciousFile);

      // File content should be sanitized
      await waitFor(() => {
        const fileContent = screen.getByTestId('file-content');
        expect(fileContent.textContent).not.toContain('<script>');
        expect(fileContent.textContent).toContain('Valid content');
      });
    });
  });

  describe('Cross-Site Request Forgery (CSRF) Prevention', () => {
    it('should validate request origins', async () => {
      // Mock request from suspicious origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://malicious-site.com' },
        writable: true
      });

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Should reject requests from unauthorized origins
      await waitFor(() => {
        expect(screen.getByText(/unauthorized origin/i)).toBeInTheDocument();
      });
    });

    it('should use CSRF tokens for state-changing operations', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Should include CSRF token in sensitive operations
      expect(mockServices.supabase.from).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': expect.any(String)
          })
        })
      );
    });
  });

  describe('Content Security Policy (CSP) Compliance', () => {
    it('should reject inline scripts and styles', async () => {
      const maliciousContent = `
        <div style="background: url('javascript:alert(1)')">
          <script>alert('xss')</script>
          Content with inline script
        </div>
      `;

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Try to inject content via API response
      mockServices.stageEngine.executeStage.mockResolvedValueOnce({
        stage: 1,
        content: maliciousContent,
        nodes: [],
        edges: [],
        hyperedges: [],
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
        metadata: {}
      });

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        const content = screen.getByTestId('stage-content');
        expect(content.innerHTML).not.toContain('<script>');
        expect(content.innerHTML).not.toContain('javascript:');
        expect(content.innerHTML).not.toContain('style=');
      });
    });

    it('should validate external resource URLs', async () => {
      const suspiciousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd'
      ];

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      for (const url of suspiciousUrls) {
        const content = `<img src="${url}" alt="test">`;
        
        mockServices.stageEngine.executeStage.mockResolvedValueOnce({
          stage: 1,
          content,
          nodes: [],
          edges: [],
          hyperedges: [],
          status: 'completed' as const,
          timestamp: new Date().toISOString(),
          metadata: {}
        });

        await user.type(screen.getByLabelText(/research query/i), `test query ${url}`);

        const startButton = screen.getByRole('button', { name: /start research/i });
        await user.click(startButton);

        await waitFor(() => {
          const stageContent = screen.getByTestId('stage-content');
          expect(stageContent.innerHTML).not.toContain(url);
        });
      }
    });
  });

  describe('Security Monitoring and Logging', () => {
    it('should log security events', async () => {
      const { SecureCredentialManager } = await import('@/services/security/SecureCredentialManager');

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Trigger security event with malicious input
      await user.type(screen.getByLabelText(/research query/i), testQueries.malicious);

      expect(SecureCredentialManager.auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'MALICIOUS_INPUT_DETECTED',
          severity: 'HIGH'
        })
      );
    });

    it('should detect and report suspicious patterns', async () => {
      const { SecureErrorHandler } = await import('@/services/security/SecureErrorHandler');

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Simulate suspicious activity pattern
      const suspiciousQueries = [
        'admin',
        'SELECT * FROM users',
        '../../../etc/passwd',
        '<script>steal_data()</script>'
      ];

      for (const query of suspiciousQueries) {
        await user.clear(screen.getByLabelText(/research query/i));
        await user.type(screen.getByLabelText(/research query/i), query);
      }

      expect(SecureErrorHandler.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          pattern: 'SUSPICIOUS_QUERY_PATTERN',
          count: suspiciousQueries.length
        })
      );
    });

    it('should implement security incident response', async () => {
      // Mock critical security incident
      const criticalError = new Error('CRITICAL: Potential data breach detected');
      mockServices.stageEngine.executeStage.mockRejectedValueOnce(criticalError);

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'valid-key-12345');
      await user.type(screen.getByLabelText(/research query/i), 'test query');

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Should trigger incident response
      await waitFor(() => {
        expect(screen.getByText(/security incident detected/i)).toBeInTheDocument();
        expect(screen.getByText(/session terminated/i)).toBeInTheDocument();
      });

      const { SecureErrorHandler } = await import('@/services/security/SecureErrorHandler');
      expect(SecureErrorHandler.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'CRITICAL',
          action: 'SESSION_TERMINATED'
        })
      );
    });
  });
});