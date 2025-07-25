
/**
 * CSRF Protection Utilities
 * Provides Cross-Site Request Forgery protection for API calls
 */

// Simple CSRF token management
let csrfToken: string | null = null;

export function generateCSRFToken(): string {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  csrfToken = token;
  return token;
}

export function getCSRFToken(): string | null {
  return csrfToken;
}

export function setupCSRFInterceptor(): void {
  if (typeof window === 'undefined') return;

  // Generate initial token
  generateCSRFToken();

  // Store in meta tag for server-side rendering compatibility
  const existingToken = document.querySelector('meta[name="csrf-token"]');
  if (existingToken) {
    existingToken.setAttribute('content', csrfToken || '');
  } else {
    const meta = document.createElement('meta');
    meta.name = 'csrf-token';
    meta.content = csrfToken || '';
    document.head.appendChild(meta);
  }

  console.log('🔒 CSRF protection initialized');
}

export function addCSRFHeader(headers: Record<string, string> = {}): Record<string, string> {
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  return headers;
}
