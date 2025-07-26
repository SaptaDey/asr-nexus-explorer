# ASR-GoT Framework Deployment Guide

## Overview

Complete deployment guide for the ASR-GoT (Automatic Scientific Research - Graph of Thoughts) framework. This guide covers everything from local development setup to production deployment at https://scientific-research.online/.

## Table of Contents

1. [Prerequisites & System Requirements](#prerequisites--system-requirements)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup (Supabase)](#database-setup-supabase)
5. [API Keys & External Services](#api-keys--external-services)
6. [Build Process](#build-process)
7. [Production Deployment](#production-deployment)
8. [Domain & SSL Configuration](#domain--ssl-configuration)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup & Recovery](#backup--recovery)
11. [Scaling & Performance](#scaling--performance)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites & System Requirements

### Development Environment

```bash
# Node.js (v18.17.0 or higher)
node --version
# v18.17.0

# npm (v9.6.7 or higher)
npm --version
# 9.6.7

# Git (v2.34.0 or higher)
git --version
# git version 2.34.0
```

### System Specifications

**Minimum Requirements**:
- CPU: 2 cores, 2.4 GHz
- RAM: 4 GB
- Storage: 10 GB available space
- Network: Stable internet connection

**Recommended for Production**:
- CPU: 4+ cores, 3.0+ GHz
- RAM: 8+ GB
- Storage: 50+ GB SSD
- Network: High-speed connection with low latency

### Operating System Support

✅ **Supported Platforms**:
- Linux (Ubuntu 20.04+, CentOS 8+, Debian 11+)
- macOS (10.15+)
- Windows 10/11 with WSL2

⚠️ **Limited Support**:
- Windows without WSL2 (some features may not work)

### Browser Compatibility

**Supported Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Browser Features**:
- ES2020 support
- WebGL 2.0 (for 3D visualizations)
- Web Workers
- IndexedDB
- WebAssembly (optional, for performance)

---

## Local Development Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/SaptaDey/asr-nexus-explorer.git
cd asr-nexus-explorer

# Verify you're on the main branch
git branch
# * main

# Check repository status
git status
# On branch main
# Your branch is up to date with 'origin/main'.
```

### 2. Dependency Installation

```bash
# Install dependencies using npm
npm install

# Verify installation
npm list --depth=0

# Expected key dependencies:
# ├── react@18.2.0
# ├── typescript@5.2.2
# ├── vite@4.4.5
# ├── @supabase/supabase-js@2.38.4
# └── cytoscape@3.26.0

# Install development tools globally (optional)
npm install -g typescript vite
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

**Required Environment Variables**:
```env
# Application Configuration
VITE_APP_NAME="ASR-GoT Framework"
VITE_APP_VERSION="1.0.0"
VITE_APP_DESCRIPTION="Automatic Scientific Research - Graph of Thoughts"

# Environment
NODE_ENV=development
VITE_DEBUG_MODE=true
VITE_VERBOSE_LOGGING=true

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
VITE_API_BASE_URL=http://localhost:5173
VITE_ENABLE_API_MOCKING=false

# Security
VITE_ENABLE_SECURITY_HEADERS=true
VITE_ENABLE_CSP=true
VITE_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Performance
VITE_ENABLE_BUNDLE_ANALYZER=false
VITE_ENABLE_SOURCE_MAPS=true
VITE_CHUNK_SIZE_WARNING_LIMIT=1000

# Features
VITE_ENABLE_PWA=true
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_ANALYTICS=false

# External Services (Development - use test keys)
VITE_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta
VITE_PERPLEXITY_API_ENDPOINT=https://api.perplexity.ai
VITE_RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

### 4. Development Server

```bash
# Start development server
npm run dev

# Server will start on http://localhost:5173
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose

# Start with custom port
npm run dev -- --port 3000

# Start with host binding (for network access)
npm run dev -- --host

# Start with debug flags
VITE_DEBUG_MODE=true VITE_VERBOSE_LOGGING=true npm run dev
```

### 5. Verify Setup

**Health Check Script** (`scripts/health-check.js`):
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 ASR-GoT Health Check');
console.log('='.repeat(50));

// Check Node.js version
const nodeVersion = process.version;
const requiredNode = '18.17.0';
console.log(`Node.js: ${nodeVersion} (required: ${requiredNode}+)`);

// Check npm version
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`npm: ${npmVersion}`);
} catch (error) {
  console.error('❌ npm not found');
}

// Check dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`\n📦 Dependencies:`);
console.log(`- Total: ${Object.keys(packageJson.dependencies || {}).length}`);
console.log(`- Dev: ${Object.keys(packageJson.devDependencies || {}).length}`);

// Check environment file
const envExists = fs.existsSync('.env.local');
console.log(`\n🔧 Environment: ${envExists ? '✅ .env.local found' : '❌ .env.local missing'}`);

// Check key directories
const keyDirs = ['src', 'public', 'docs', 'supabase'];
console.log(`\n📁 Project Structure:`);
keyDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`- ${dir}: ${exists ? '✅' : '❌'}`);
});

// Check build capability
console.log(`\n🔨 Build Check:`);
try {
  execSync('npm run lint', { stdio: 'pipe' });
  console.log('- Linting: ✅');
} catch (error) {
  console.log('- Linting: ❌');
}

try {
  execSync('npm run type-check', { stdio: 'pipe' });
  console.log('- Type Check: ✅');
} catch (error) {
  console.log('- Type Check: ❌');
}

console.log('\n✅ Health check complete!');
```

**Run Health Check**:
```bash
# Make script executable
chmod +x scripts/health-check.js

# Run health check
node scripts/health-check.js
```

---

## Environment Configuration

### Development Environment

**`.env.development`**:
```env
# Development-specific configuration
NODE_ENV=development
VITE_DEBUG_MODE=true
VITE_VERBOSE_LOGGING=true
VITE_ENABLE_HOT_RELOAD=true
VITE_ENABLE_DEV_TOOLS=true

# Development URLs
VITE_API_BASE_URL=http://localhost:5173
VITE_SUPABASE_URL=https://dev-project.supabase.co

# Development security (relaxed)
VITE_ENABLE_CSP=false
VITE_ALLOWED_ORIGINS=*

# Development performance
VITE_ENABLE_SOURCE_MAPS=true
VITE_CHUNK_SIZE_WARNING_LIMIT=2000
VITE_BUNDLE_ANALYZER=false

# Mock data for development
VITE_USE_MOCK_DATA=true
VITE_MOCK_API_DELAY=500
```

### Staging Environment

**`.env.staging`**:
```env
# Staging-specific configuration
NODE_ENV=production
VITE_DEBUG_MODE=false
VITE_VERBOSE_LOGGING=false
VITE_ENABLE_HOT_RELOAD=false

# Staging URLs
VITE_API_BASE_URL=https://staging.scientific-research.online
VITE_SUPABASE_URL=https://staging-project.supabase.co

# Staging security (moderate)
VITE_ENABLE_CSP=true
VITE_ALLOWED_ORIGINS=https://staging.scientific-research.online

# Staging performance
VITE_ENABLE_SOURCE_MAPS=false
VITE_CHUNK_SIZE_WARNING_LIMIT=1000
VITE_BUNDLE_ANALYZER=true

# Real data for staging
VITE_USE_MOCK_DATA=false
```

### Production Environment

**`.env.production`**:
```env
# Production configuration
NODE_ENV=production
VITE_DEBUG_MODE=false
VITE_VERBOSE_LOGGING=false
VITE_ENABLE_DEV_TOOLS=false

# Production URLs
VITE_API_BASE_URL=https://scientific-research.online
VITE_SUPABASE_URL=https://aogeenqytwrpjvrfwvjw.supabase.co

# Production security (strict)
VITE_ENABLE_CSP=true
VITE_ENABLE_SECURITY_HEADERS=true
VITE_ALLOWED_ORIGINS=https://scientific-research.online
VITE_ENABLE_HSTS=true
VITE_ENABLE_CSRF_PROTECTION=true

# Production performance (optimized)
VITE_ENABLE_SOURCE_MAPS=false
VITE_CHUNK_SIZE_WARNING_LIMIT=500
VITE_ENABLE_COMPRESSION=true
VITE_ENABLE_CACHING=true
VITE_BUNDLE_ANALYZER=false

# Production features
VITE_ENABLE_PWA=true
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# Real data only
VITE_USE_MOCK_DATA=false
```

### Environment Validation

**Environment Validator** (`scripts/validate-env.js`):
```javascript
#!/usr/bin/env node

const requiredVars = {
  development: [
    'NODE_ENV',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ],
  production: [
    'NODE_ENV',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_BASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
};

const env = process.env.NODE_ENV || 'development';
const required = requiredVars[env] || requiredVars.development;

console.log(`🔍 Validating ${env} environment...`);

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Validate URLs
const urls = [
  'VITE_SUPABASE_URL',
  'VITE_API_BASE_URL'
].filter(key => process.env[key]);

urls.forEach(key => {
  const url = process.env[key];
  try {
    new URL(url);
    console.log(`✅ ${key}: Valid URL`);
  } catch (error) {
    console.error(`❌ ${key}: Invalid URL - ${url}`);
    process.exit(1);
  }
});
```

**Run Validation**:
```bash
# Validate current environment
node scripts/validate-env.js

# Validate specific environment
NODE_ENV=production node scripts/validate-env.js
```

---

## Database Setup (Supabase)

### 1. Supabase Project Creation

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to existing project
supabase link --project-ref aogeenqytwrpjvrfwvjw

# Or create new project
supabase projects create asr-got-framework
```

### 2. Database Schema Migration

**Run Migrations**:
```bash
# Apply all migrations
supabase db push

# Check migration status
supabase migration list

# Create new migration (if needed)
supabase migration new add_new_feature
```

**Key Database Tables**:

```sql
-- ASR-GoT Sessions
CREATE TABLE asr_got_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  research_query TEXT NOT NULL,
  graph_data JSONB,
  stage_results JSONB[],
  current_stage INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research Queries History
CREATE TABLE research_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  field TEXT,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Graph Snapshots
CREATE TABLE graph_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES asr_got_sessions(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,
  graph_data JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export History
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES asr_got_sessions(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  file_size INTEGER,
  export_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query History
CREATE TABLE query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  field TEXT,
  stage INTEGER,
  results JSONB,
  api_calls_used INTEGER DEFAULT 0,
  tokens_consumed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE asr_got_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;

-- ASR-GoT Sessions Policies
CREATE POLICY "Users can view own sessions" ON asr_got_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON asr_got_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON asr_got_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON asr_got_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Research Queries Policies
CREATE POLICY "Users can view own queries" ON research_queries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queries" ON research_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Similar policies for other tables...
```

### 4. Database Functions

```sql
-- Function to update session timestamp
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_asr_got_sessions_timestamp
  BEFORE UPDATE ON asr_got_sessions
  FOR EACH ROW EXECUTE FUNCTION update_session_timestamp();

-- Function to cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM asr_got_sessions 
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND completed = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get user session stats
CREATE OR REPLACE FUNCTION get_user_session_stats(user_uuid UUID)
RETURNS TABLE(
  total_sessions INTEGER,
  completed_sessions INTEGER,
  total_queries INTEGER,
  avg_completion_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_sessions,
    COUNT(CASE WHEN completed THEN 1 END)::INTEGER as completed_sessions,
    COUNT(DISTINCT research_query)::INTEGER as total_queries,
    AVG(updated_at - created_at) as avg_completion_time
  FROM asr_got_sessions 
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;
```

### 5. Database Indexing

```sql
-- Performance indexes
CREATE INDEX idx_asr_got_sessions_user_id ON asr_got_sessions(user_id);
CREATE INDEX idx_asr_got_sessions_created_at ON asr_got_sessions(created_at);
CREATE INDEX idx_asr_got_sessions_completed ON asr_got_sessions(completed);

CREATE INDEX idx_research_queries_user_id ON research_queries(user_id);
CREATE INDEX idx_research_queries_created_at ON research_queries(created_at);

CREATE INDEX idx_graph_snapshots_session_id ON graph_snapshots(session_id);
CREATE INDEX idx_graph_snapshots_stage ON graph_snapshots(stage);

CREATE INDEX idx_export_history_user_id ON export_history(user_id);
CREATE INDEX idx_export_history_session_id ON export_history(session_id);

CREATE INDEX idx_query_history_user_id ON query_history(user_id);
CREATE INDEX idx_query_history_created_at ON query_history(created_at);

-- GIN indexes for JSONB columns
CREATE INDEX idx_asr_got_sessions_graph_data_gin ON asr_got_sessions USING gin(graph_data);
CREATE INDEX idx_research_queries_results_gin ON research_queries USING gin(results);
CREATE INDEX idx_graph_snapshots_metadata_gin ON graph_snapshots USING gin(metadata);
```

### 6. Database Backup Configuration

```bash
# Manual backup
supabase db dump --file backup.sql

# Automated backup script
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

echo "Creating database backup: $BACKUP_FILE"
supabase db dump --file $BACKUP_FILE

# Upload to cloud storage (example with AWS S3)
aws s3 cp $BACKUP_FILE s3://asr-got-backups/database/

# Keep only last 30 backups locally
ls -t backup_*.sql | tail -n +31 | xargs rm -f

echo "Backup completed: $BACKUP_FILE"
```

**Automated Backup with Cron**:
```bash
# Add to crontab (daily backup at 2 AM)
crontab -e

# Add this line:
0 2 * * * /path/to/backup-database.sh >> /var/log/asr-got-backup.log 2>&1
```

---

## API Keys & External Services

### 1. Required API Services

#### Google Gemini 2.5 Pro

**Setup Steps**:
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create new project or select existing
3. Enable Generative AI API
4. Create API key
5. Set usage limits and restrictions

**Configuration**:
```env
# Gemini API Configuration
VITE_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta
GEMINI_API_KEY=AIza... # Store securely, never in client

# Gemini Usage Limits
VITE_GEMINI_MAX_TOKENS_INPUT=1048576
VITE_GEMINI_MAX_TOKENS_OUTPUT=65536
VITE_GEMINI_RATE_LIMIT_PER_MINUTE=60
```

**Testing Gemini Connection**:
```bash
# Test script
curl -H "x-goog-api-key: $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models

# Should return list of available models
```

#### Perplexity Sonar API

**Setup Steps**:
1. Visit [Perplexity Developer Portal](https://docs.perplexity.ai/)
2. Create account and get API key
3. Set up billing and usage limits

**Configuration**:
```env
# Perplexity API Configuration
VITE_PERPLEXITY_API_ENDPOINT=https://api.perplexity.ai
PERPLEXITY_API_KEY=pplx-... # Store securely

# Perplexity Usage Limits
VITE_PERPLEXITY_MAX_TOKENS=4096
VITE_PERPLEXITY_RATE_LIMIT_PER_MINUTE=20
```

**Testing Perplexity Connection**:
```bash
# Test script
curl -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-medium-online",
    "messages": [{"role": "user", "content": "Test query"}]
  }'
```

### 2. API Key Management

**Secure Storage Options**:

#### Option 1: Environment Variables (Recommended for Development)
```bash
# Add to .env.local (never commit to git)
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
OPENAI_API_KEY=sk-...
```

#### Option 2: Secret Management Service (Production)
```bash
# Using AWS Secrets Manager
aws secretsmanager create-secret \
  --name "asr-got/api-keys" \
  --secret-string '{
    "gemini": "AIza...",
    "perplexity": "pplx-...",
    "openai": "sk-..."
  }'

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id "asr-got/api-keys" \
  --query SecretString --output text
```

#### Option 3: HashiCorp Vault (Enterprise)
```bash
# Store secrets in Vault
vault kv put secret/asr-got \
  gemini_api_key="AIza..." \
  perplexity_api_key="pplx-..." \
  openai_api_key="sk-..."

# Retrieve in application
vault kv get -field=gemini_api_key secret/asr-got
```

### 3. API Key Validation Script

**API Key Validator** (`scripts/validate-api-keys.js`):
```javascript
#!/usr/bin/env node

const https = require('https');
const { promisify } = require('util');

class APIKeyValidator {
  async validateGemini(apiKey) {
    if (!apiKey.startsWith('AIza') || apiKey.length !== 39) {
      return { valid: false, error: 'Invalid format' };
    }

    try {
      const response = await this.makeRequest(
        'generativelanguage.googleapis.com',
        '/v1beta/models',
        { 'x-goog-api-key': apiKey }
      );
      return { valid: true, models: response.models?.length || 0 };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async validatePerplexity(apiKey) {
    if (!apiKey.startsWith('pplx-') || apiKey.length < 40) {
      return { valid: false, error: 'Invalid format' };
    }

    try {
      const response = await this.makeRequest(
        'api.perplexity.ai',
        '/chat/completions',
        { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        'POST',
        JSON.stringify({
          model: 'sonar-medium-online',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      );
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  makeRequest(hostname, path, headers, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        path,
        method,
        headers,
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.error?.message || body}`));
            }
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));

      if (data) {
        req.write(data);
      }
      req.end();
    });
  }
}

async function main() {
  const validator = new APIKeyValidator();
  
  console.log('🔑 API Key Validation');
  console.log('='.repeat(50));

  // Validate Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log('Validating Gemini API key...');
    const geminiResult = await validator.validateGemini(geminiKey);
    console.log(`Gemini: ${geminiResult.valid ? '✅' : '❌'} ${geminiResult.error || `${geminiResult.models} models available`}`);
  } else {
    console.log('Gemini: ⚠️ No API key found');
  }

  // Validate Perplexity
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (perplexityKey) {
    console.log('Validating Perplexity API key...');
    const perplexityResult = await validator.validatePerplexity(perplexityKey);
    console.log(`Perplexity: ${perplexityResult.valid ? '✅' : '❌'} ${perplexityResult.error || 'Valid'}`);
  } else {
    console.log('Perplexity: ⚠️ No API key found');
  }

  console.log('\n✅ API key validation complete');
}

main().catch(console.error);
```

**Run API Key Validation**:
```bash
# Set API keys in environment
export GEMINI_API_KEY="AIza..."
export PERPLEXITY_API_KEY="pplx-..."

# Run validation
node scripts/validate-api-keys.js
```

### 4. Rate Limiting & Cost Management

**Cost Monitoring Script** (`scripts/monitor-api-costs.js`):
```javascript
#!/usr/bin/env node

class CostMonitor {
  constructor() {
    this.costs = {
      gemini: {
        input: 0.00000125,  // per token
        output: 0.00000375  // per token
      },
      perplexity: {
        request: 0.001  // per request
      }
    };
  }

  calculateMonthlyCost(usage) {
    let total = 0;
    
    // Gemini costs
    if (usage.gemini) {
      total += usage.gemini.inputTokens * this.costs.gemini.input;
      total += usage.gemini.outputTokens * this.costs.gemini.output;
    }

    // Perplexity costs
    if (usage.perplexity) {
      total += usage.perplexity.requests * this.costs.perplexity.request;
    }

    return total;
  }

  generateReport(usage) {
    const cost = this.calculateMonthlyCost(usage);
    
    console.log('💰 API Cost Report');
    console.log('='.repeat(30));
    console.log(`Gemini Input Tokens: ${usage.gemini?.inputTokens || 0}`);
    console.log(`Gemini Output Tokens: ${usage.gemini?.outputTokens || 0}`);
    console.log(`Perplexity Requests: ${usage.perplexity?.requests || 0}`);
    console.log(`\nEstimated Monthly Cost: $${cost.toFixed(4)}`);
    
    // Alerts
    if (cost > 100) {
      console.log('🚨 HIGH COST ALERT: Monthly cost exceeds $100');
    } else if (cost > 50) {
      console.log('⚠️ MEDIUM COST ALERT: Monthly cost exceeds $50');
    }
  }
}

// Example usage
const monitor = new CostMonitor();
const exampleUsage = {
  gemini: {
    inputTokens: 50000,
    outputTokens: 25000
  },
  perplexity: {
    requests: 1000
  }
};

monitor.generateReport(exampleUsage);
```

---

## Build Process

### 1. Development Build

```bash
# Development build with source maps and debugging
npm run build:dev

# Expected output:
# vite v4.4.5 building for development...
# ✓ 1243 modules transformed.
# dist/index.html                   2.15 kB
# dist/assets/index-abc123.js      1,234.56 kB │ gzip: 345.67 kB
# dist/assets/index-def456.css       123.45 kB │ gzip:  23.45 kB
```

### 2. Production Build

```bash
# Production build with optimizations
npm run build

# With environment
NODE_ENV=production npm run build

# With analytics
ANALYZE=true npm run build
```

**Build Configuration** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react(),
      // Bundle analyzer for production
      isProduction && process.env.ANALYZE && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true
      })
    ].filter(Boolean),
    
    build: {
      target: 'es2020',
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      
      rollupOptions: {
        output: {
          // Chunk splitting for better caching
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'graph-vendor': ['cytoscape', 'd3'],
            'utils': ['lodash-es', 'date-fns']
          }
        }
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: isProduction ? 500 : 1000
    },
    
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    
    // Development server
    server: {
      port: 5173,
      host: true,
      open: true
    },
    
    // Preview server
    preview: {
      port: 4173,
      host: true
    }
  };
});
```

### 3. Build Optimization

**Bundle Size Analysis**:
```bash
# Generate bundle analysis
npm run build -- --analyze

# Open analysis report
open dist/stats.html

# Check bundle sizes
npm run build && ls -lh dist/assets/
```

**Performance Budget** (`scripts/check-bundle-size.js`):
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const budgets = {
  'index.js': 500 * 1024,      // 500 KB
  'index.css': 50 * 1024,      // 50 KB
  'vendor.js': 1000 * 1024,    // 1 MB
  total: 2000 * 1024           // 2 MB
};

function checkBundleSize() {
  const distPath = path.join(__dirname, '..', 'dist', 'assets');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Dist folder not found. Run npm run build first.');
    process.exit(1);
  }

  const files = fs.readdirSync(distPath);
  let totalSize = 0;
  let violations = [];

  console.log('📦 Bundle Size Analysis');
  console.log('='.repeat(50));

  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalSize += size;

    console.log(`${file}: ${(size / 1024).toFixed(2)} KB`);

    // Check against budgets
    Object.keys(budgets).forEach(pattern => {
      if (file.includes(pattern) && size > budgets[pattern]) {
        violations.push({
          file,
          size,
          budget: budgets[pattern],
          overage: size - budgets[pattern]
        });
      }
    });
  });

  console.log(`\nTotal: ${(totalSize / 1024).toFixed(2)} KB`);

  // Check total budget
  if (totalSize > budgets.total) {
    violations.push({
      file: 'Total bundle',
      size: totalSize,
      budget: budgets.total,
      overage: totalSize - budgets.total
    });
  }

  if (violations.length > 0) {
    console.log('\n🚨 Bundle Size Violations:');
    violations.forEach(v => {
      console.log(`❌ ${v.file}: ${(v.size / 1024).toFixed(2)} KB (budget: ${(v.budget / 1024).toFixed(2)} KB, over by ${(v.overage / 1024).toFixed(2)} KB)`);
    });
    process.exit(1);
  }

  console.log('\n✅ All bundle sizes within budget');
}

checkBundleSize();
```

### 4. Build Pipeline

**GitHub Actions Workflow** (`.github/workflows/build.yml`):
```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18.17.0'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Validate environment
      run: node scripts/validate-env.js
      env:
        NODE_ENV: production
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        
    - name: Run linting
      run: npm run lint
      
    - name: Run type checking
      run: npm run type-check
      
    - name: Run tests
      run: npm run test:unit
      
    - name: Build application
      run: npm run build
      env:
        NODE_ENV: production
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        
    - name: Check bundle size
      run: node scripts/check-bundle-size.js
      
    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-files
        path: dist/
        retention-days: 7
        
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: build-files
        path: dist/
        
    - name: Deploy to production
      run: |
        # Deployment commands here
        echo "Deploying to production..."
```

---

## Production Deployment

### 1. Deployment Options

#### Option A: Static Site Hosting (Recommended)

**Vercel Deployment**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod

# Configure environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

**Netlify Deployment**:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Configure environment variables
netlify env:set VITE_SUPABASE_URL "your-value"
netlify env:set VITE_SUPABASE_ANON_KEY "your-value"
```

#### Option B: Docker Deployment

**Dockerfile**:
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose** (`docker-compose.prod.yml`):
```yaml
version: '3.8'

services:
  asr-got-web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - asr-got-web
    restart: unless-stopped
```

#### Option C: Traditional Server Deployment

**Server Setup Script** (`scripts/deploy-server.sh`):
```bash
#!/bin/bash

# Production server deployment script
set -e

echo "🚀 Starting ASR-GoT production deployment..."

# Configuration
SERVER_USER="ubuntu"
SERVER_HOST="scientific-research.online"
DEPLOY_PATH="/var/www/asr-got"
BACKUP_PATH="/var/backups/asr-got"

# Create backup of current deployment
echo "📦 Creating backup..."
ssh $SERVER_USER@$SERVER_HOST "
  sudo mkdir -p $BACKUP_PATH
  sudo cp -r $DEPLOY_PATH $BACKUP_PATH/backup-$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
"

# Build application locally
echo "🔨 Building application..."
npm run build

# Upload build files
echo "📤 Uploading files..."
rsync -avz --delete dist/ $SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/

# Update server configuration
echo "⚙️  Updating server configuration..."
ssh $SERVER_USER@$SERVER_HOST "
  # Update nginx configuration
  sudo cp $DEPLOY_PATH/nginx.conf /etc/nginx/sites-available/asr-got
  sudo ln -sf /etc/nginx/sites-available/asr-got /etc/nginx/sites-enabled/
  
  # Test nginx configuration
  sudo nginx -t
  
  # Reload nginx
  sudo systemctl reload nginx
  
  # Set correct permissions
  sudo chown -R www-data:www-data $DEPLOY_PATH
  sudo chmod -R 755 $DEPLOY_PATH
"

echo "✅ Deployment completed successfully!"
echo "🌐 Site available at: https://scientific-research.online"
```

### 2. Server Configuration

**Nginx Configuration** (`nginx.conf`):
```nginx
server {
    listen 80;
    server_name scientific-research.online www.scientific-research.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name scientific-research.online www.scientific-research.online;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/scientific-research.online.crt;
    ssl_certificate_key /etc/ssl/private/scientific-research.online.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://aogeenqytwrpjvrfwvjw.supabase.co https://generativelanguage.googleapis.com https://api.perplexity.ai;" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Document root
    root /var/www/asr-got;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (if needed)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 3. SSL Certificate Setup

**Let's Encrypt with Certbot**:
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d scientific-research.online -d www.scientific-research.online

# Verify auto-renewal
sudo certbot renew --dry-run

# Set up auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 4. Performance Optimization

**Performance Checklist**:
- ✅ Enable Gzip compression
- ✅ Set appropriate cache headers
- ✅ Optimize images and assets
- ✅ Enable HTTP/2
- ✅ Minimize JavaScript and CSS
- ✅ Use CDN for static assets
- ✅ Implement service worker for caching

**Service Worker** (`public/sw.js`):
```javascript
const CACHE_NAME = 'asr-got-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/static/media/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
```

---

## Domain & SSL Configuration

### 1. Domain Setup

**DNS Configuration**:
```dns
# A Records
scientific-research.online.        300    IN    A       104.21.32.45
www.scientific-research.online.    300    IN    A       104.21.32.45

# CNAME Records
api.scientific-research.online.    300    IN    CNAME   scientific-research.online.
staging.scientific-research.online. 300   IN    CNAME   scientific-research.online.

# MX Records (if email needed)
scientific-research.online.        300    IN    MX      10 mail.scientific-research.online.

# TXT Records
scientific-research.online.        300    IN    TXT     "v=spf1 include:_spf.google.com ~all"
_dmarc.scientific-research.online. 300    IN    TXT     "v=DMARC1; p=quarantine; rua=mailto:dmarc@scientific-research.online"
```

### 2. SSL Certificate Management

**Manual Certificate Installation**:
```bash
# Generate private key
openssl genrsa -out scientific-research.online.key 2048

# Generate certificate signing request
openssl req -new -key scientific-research.online.key -out scientific-research.online.csr

# Install certificate files
sudo cp scientific-research.online.crt /etc/ssl/certs/
sudo cp scientific-research.online.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/scientific-research.online.key
sudo chmod 644 /etc/ssl/certs/scientific-research.online.crt
```

**Certificate Monitoring Script** (`scripts/monitor-ssl.sh`):
```bash
#!/bin/bash

DOMAIN="scientific-research.online"
DAYS_WARNING=30

# Check certificate expiration
EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_REMAINING=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

echo "SSL Certificate Status for $DOMAIN"
echo "Expiry Date: $EXPIRY_DATE"
echo "Days Remaining: $DAYS_REMAINING"

if [ $DAYS_REMAINING -lt $DAYS_WARNING ]; then
    echo "⚠️ WARNING: Certificate expires in $DAYS_REMAINING days"
    # Send alert (email, slack, etc.)
else
    echo "✅ Certificate is valid"
fi
```

### 3. Security Headers

**Security Headers Configuration**:
```nginx
# Additional security headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# Content Security Policy
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' 
        https://aogeenqytwrpjvrfwvjw.supabase.co 
        https://generativelanguage.googleapis.com 
        https://api.perplexity.ai
        wss://aogeenqytwrpjvrfwvjw.supabase.co;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
" always;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

## Monitoring & Logging

### 1. Application Monitoring

**Health Check Endpoint** (`public/health.json`):
```json
{
  "status": "healthy",
  "timestamp": "2024-07-24T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "operational",
    "api": "operational",
    "storage": "operational"
  },
  "metrics": {
    "uptime": "99.9%",
    "response_time": "150ms",
    "memory_usage": "45%"
  }
}
```

**Monitoring Script** (`scripts/monitor.js`):
```javascript
#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

class MonitoringService {
  constructor() {
    this.endpoints = [
      'https://scientific-research.online',
      'https://scientific-research.online/health',
      'https://aogeenqytwrpjvrfwvjw.supabase.co/rest/v1/'
    ];
    this.logFile = 'monitoring.log';
  }

  async checkEndpoint(url) {
    return new Promise((resolve) => {
      const start = Date.now();
      
      const req = https.get(url, (res) => {
        const duration = Date.now() - start;
        resolve({
          url,
          status: res.statusCode,
          duration,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });

      req.on('error', (error) => {
        resolve({
          url,
          status: 0,
          duration: Date.now() - start,
          success: false,
          error: error.message
        });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          url,
          status: 0,
          duration: 10000,
          success: false,
          error: 'Timeout'
        });
      });
    });
  }

  async runChecks() {
    const results = await Promise.all(
      this.endpoints.map(url => this.checkEndpoint(url))
    );

    const report = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        avgResponseTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length
      }
    };

    // Log results
    fs.appendFileSync(this.logFile, JSON.stringify(report) + '\n');

    // Console output
    console.log(`🔍 Health Check - ${report.timestamp}`);
    console.log(`✅ Successful: ${report.summary.successful}/${report.summary.total}`);
    console.log(`⏱️  Avg Response: ${report.summary.avgResponseTime.toFixed(0)}ms`);

    if (report.summary.failed > 0) {
      console.log('❌ Failed endpoints:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.url}: ${r.error || `Status ${r.status}`}`);
      });
    }

    return report;
  }
}

// Run monitoring
const monitor = new MonitoringService();
monitor.runChecks().catch(console.error);
```

### 2. Error Tracking

**Error Reporting Service**:
```javascript
// Error reporting configuration
class ErrorReporter {
  constructor() {
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        type: 'javascript_error'
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        type: 'promise_rejection'
      });
    });

    // API errors
    this.interceptFetch();
  }

  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.reportError({
            message: `API Error: ${response.status} ${response.statusText}`,
            url: args[0],
            status: response.status,
            type: 'api_error'
          });
        }
        
        return response;
      } catch (error) {
        this.reportError({
          message: `Network Error: ${error.message}`,
          url: args[0],
          type: 'network_error'
        });
        throw error;
      }
    };
  }

  reportError(errorData) {
    const report = {
      ...errorData,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };

    // Send to monitoring service
    this.sendToMonitoring(report);
    
    // Store locally for debugging
    this.storeLocally(report);
  }

  sendToMonitoring(report) {
    // Send to external monitoring service (e.g., Sentry, LogRocket)
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      }).catch(console.error);
    }
  }

  storeLocally(report) {
    try {
      const errors = JSON.parse(localStorage.getItem('error_reports') || '[]');
      errors.push(report);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('error_reports', JSON.stringify(errors));
    } catch (error) {
      console.error('Failed to store error report locally:', error);
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }
}

// Initialize error reporting
new ErrorReporter();
```

### 3. Performance Monitoring

**Performance Metrics Collection**:
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      cumulativeLayoutShift: null,
      firstInputDelay: null
    };
    
    this.collectMetrics();
  }

  collectMetrics() {
    // Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    
    // Page load metrics
    window.addEventListener('load', () => {
      this.collectPageLoadMetrics();
    });
  }

  observeLCP() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.largestContentfulPaint = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }

  observeFID() {
    new PerformanceObserver((list) => {
      const firstInput = list.getEntries()[0];
      this.metrics.firstInputDelay = firstInput.processingStart - firstInput.startTime;
    }).observe({ entryTypes: ['first-input'] });
  }

  observeCLS() {
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.cumulativeLayoutShift = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });
  }

  collectPageLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    this.metrics.pageLoad = navigation.loadEventEnd - navigation.startTime;
    this.metrics.firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime;
    
    this.reportMetrics();
  }

  reportMetrics() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metrics: this.metrics,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };

    // Send to analytics
    if (typeof gtag !== 'undefined') {
      Object.entries(this.metrics).forEach(([name, value]) => {
        if (value !== null) {
          gtag('event', 'page_performance', {
            metric_name: name,
            metric_value: Math.round(value),
            custom_parameter: window.location.pathname
          });
        }
      });
    }

    console.log('📊 Performance Metrics:', report);
  }
}

// Initialize performance monitoring
new PerformanceMonitor();
```

---

## Backup & Recovery

### 1. Database Backup Strategy

**Automated Backup Script** (`scripts/backup-database.sh`):
```bash
#!/bin/bash

set -e

# Configuration
PROJECT_REF="aogeenqytwrpjvrfwvjw"
BACKUP_DIR="/var/backups/asr-got"
S3_BUCKET="asr-got-backups"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

echo "🗄️  Starting database backup..."
echo "Backup file: $BACKUP_FILE"

# Create database dump
supabase db dump --project-ref $PROJECT_REF --file $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Upload to cloud storage
if command -v aws &> /dev/null; then
    echo "☁️  Uploading to S3..."
    aws s3 cp $COMPRESSED_FILE s3://$S3_BUCKET/database/
    echo "✅ Uploaded to S3: s3://$S3_BUCKET/database/$(basename $COMPRESSED_FILE)"
fi

# Calculate backup size
BACKUP_SIZE=$(du -h $COMPRESSED_FILE | cut -f1)
echo "📦 Backup size: $BACKUP_SIZE"

# Cleanup old backups (keep last 30 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
echo "🔍 Verifying backup integrity..."
if gunzip -t $COMPRESSED_FILE; then
    echo "✅ Backup integrity verified"
else
    echo "❌ Backup integrity check failed"
    exit 1
fi

echo "✅ Database backup completed successfully"
echo "Backup file: $COMPRESSED_FILE"
```

### 2. Application Backup

**Code and Configuration Backup** (`scripts/backup-application.sh`):
```bash
#!/bin/bash

set -e

# Configuration
BACKUP_DIR="/var/backups/asr-got"
APP_DIR="/var/www/asr-got"
S3_BUCKET="asr-got-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/app_backup_${TIMESTAMP}.tar.gz"

echo "📦 Starting application backup..."

# Create application backup
tar -czf $BACKUP_FILE \
    -C / \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='*.log' \
    var/www/asr-got \
    etc/nginx/sites-available/asr-got \
    etc/ssl/certs/scientific-research.online.crt \
    etc/ssl/private/scientific-research.online.key

# Upload to cloud storage
if command -v aws &> /dev/null; then
    echo "☁️  Uploading to S3..."
    aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/application/
fi

# Calculate backup size
BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
echo "📦 Application backup size: $BACKUP_SIZE"

echo "✅ Application backup completed: $BACKUP_FILE"
```

### 3. Recovery Procedures

**Database Recovery Script** (`scripts/restore-database.sh`):
```bash
#!/bin/bash

set -e

# Usage: ./restore-database.sh backup_20240724_120000.sql.gz

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE=$1
PROJECT_REF="aogeenqytwrpjvrfwvjw"

echo "🔄 Starting database restore..."
echo "Backup file: $BACKUP_FILE"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Working directory: $TEMP_DIR"

# Extract backup
echo "📦 Extracting backup..."
gunzip -c $BACKUP_FILE > $TEMP_DIR/restore.sql

# Confirm restore operation
echo "⚠️  WARNING: This will replace all data in the database!"
echo "Project: $PROJECT_REF"
echo "Backup: $BACKUP_FILE"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Create database snapshot before restore
echo "📸 Creating pre-restore snapshot..."
supabase db dump --project-ref $PROJECT_REF --file $TEMP_DIR/pre_restore_snapshot.sql

# Restore database
echo "🔄 Restoring database..."
supabase db reset --project-ref $PROJECT_REF
psql -h db.supabase.co -p 5432 -U postgres -d postgres < $TEMP_DIR/restore.sql

# Verify restore
echo "🔍 Verifying restore..."
RESTORED_TABLES=$(psql -h db.supabase.co -p 5432 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "✅ Restored tables: $RESTORED_TABLES"

# Cleanup
rm -rf $TEMP_DIR
echo "✅ Database restore completed successfully"
```

### 4. Disaster Recovery Plan

**Disaster Recovery Checklist**:

1. **Assess the Situation**
   - [ ] Identify the scope of the outage
   - [ ] Determine if it's a partial or complete failure
   - [ ] Check external service status (Supabase, etc.)

2. **Immediate Response**
   - [ ] Activate maintenance mode
   - [ ] Notify stakeholders
   - [ ] Begin recovery procedures

3. **Data Recovery**
   - [ ] Restore from latest database backup
   - [ ] Verify data integrity
   - [ ] Test critical functionality

4. **Application Recovery**
   - [ ] Deploy from backup or rebuild
   - [ ] Restore configuration files
   - [ ] Update DNS if necessary

5. **Verification**
   - [ ] Test all critical paths
   - [ ] Verify SSL certificates
   - [ ] Check monitoring systems

6. **Post-Recovery**
   - [ ] Analyze root cause
   - [ ] Update procedures
   - [ ] Conduct post-mortem

**Recovery Time Objectives**:
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Database Recovery**: 1 hour
- **Application Recovery**: 2 hours
- **Full Service Restoration**: 4 hours

---

## Scaling & Performance

### 1. Performance Optimization

**Frontend Optimization Checklist**:
- ✅ Code splitting and lazy loading
- ✅ Bundle size optimization
- ✅ Image optimization and WebP support
- ✅ Service worker for caching
- ✅ CDN for static assets
- ✅ Database query optimization
- ✅ API response caching

**Lazy Loading Implementation**:
```typescript
// Component lazy loading
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

const ResearchInterface = lazy(() => import('@/components/asr-got/ResearchInterface'));
const GraphVisualization = lazy(() => import('@/components/asr-got/EnhancedGraphVisualization'));

function App() {
  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        <ResearchInterface />
      </Suspense>
    </div>
  );
}
```

**Performance Monitoring Script** (`scripts/performance-audit.js`):
```javascript
#!/usr/bin/env node

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

class PerformanceAuditor {
  async runAudit(url) {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);
    await chrome.kill();

    return runnerResult.lhr;
  }

  generateReport(results) {
    const performance = results.categories.performance.score * 100;
    const accessibility = results.categories.accessibility.score * 100;

    console.log('🚀 Performance Audit Results');
    console.log('='.repeat(40));
    console.log(`Performance Score: ${performance.toFixed(0)}/100`);
    console.log(`Accessibility Score: ${accessibility.toFixed(0)}/100`);

    // Core Web Vitals
    const metrics = results.audits;
    console.log('\n📊 Core Web Vitals:');
    console.log(`LCP: ${metrics['largest-contentful-paint'].displayValue}`);
    console.log(`FID: ${metrics['max-potential-fid'].displayValue}`);
    console.log(`CLS: ${metrics['cumulative-layout-shift'].displayValue}`);

    // Recommendations
    const failedAudits = Object.values(metrics).filter(audit => 
      audit.score < 0.9 && audit.scoreDisplayMode === 'numeric'
    );

    if (failedAudits.length > 0) {
      console.log('\n⚠️ Recommendations:');
      failedAudits.slice(0, 5).forEach(audit => {
        console.log(`- ${audit.title}: ${audit.displayValue}`);
      });
    }

    return { performance, accessibility };
  }
}

async function main() {
  const auditor = new PerformanceAuditor();
  const results = await auditor.runAudit('https://scientific-research.online');
  auditor.generateReport(results);
}

main().catch(console.error);
```

### 2. Horizontal Scaling

**Load Balancer Configuration** (`nginx-lb.conf`):
```nginx
upstream asr_got_backend {
    server 10.0.1.10:80 weight=3;
    server 10.0.1.11:80 weight=3;
    server 10.0.1.12:80 weight=2;
    server 10.0.1.13:80 backup;
    
    # Health checks
    keepalive 32;
}

server {
    listen 80;
    server_name scientific-research.online;
    
    location / {
        proxy_pass http://asr_got_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Load balancing method
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_connect_timeout 2s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://asr_got_backend/health;
    }
}
```

### 3. CDN Configuration

**CloudFlare Configuration**:
```javascript
// CloudFlare Workers script for advanced caching
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Cache static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let response = await cache.match(cacheKey);
    
    if (!response) {
      response = await fetch(request);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000');
      
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      event.waitUntil(cache.put(cacheKey, response.clone()));
    }
    
    return response;
  }
  
  // Pass through other requests
  return fetch(request);
}
```

### 4. Database Scaling

**Read Replicas Configuration**:
```sql
-- Read replica connection strings
-- Primary (writes): postgresql://postgres:password@db.supabase.co:5432/postgres
-- Replica 1 (reads): postgresql://postgres:password@db-read-1.supabase.co:5432/postgres
-- Replica 2 (reads): postgresql://postgres:password@db-read-2.supabase.co:5432/postgres

-- Connection pooling configuration
-- Max connections per pool: 25
-- Pool timeout: 30s
-- Idle timeout: 600s
```

**Database Connection Manager**:
```typescript
class DatabaseConnectionManager {
  private writePool: Pool;
  private readPools: Pool[];
  private currentReadIndex = 0;

  constructor() {
    this.writePool = new Pool({
      connectionString: process.env.DATABASE_WRITE_URL,
      max: 25,
      idleTimeoutMillis: 600000,
      connectionTimeoutMillis: 30000,
    });

    this.readPools = [
      new Pool({
        connectionString: process.env.DATABASE_READ_1_URL,
        max: 25,
        idleTimeoutMillis: 600000,
        connectionTimeoutMillis: 30000,
      }),
      new Pool({
        connectionString: process.env.DATABASE_READ_2_URL,
        max: 25,
        idleTimeoutMillis: 600000,
        connectionTimeoutMillis: 30000,
      })
    ];
  }

  getWriteConnection() {
    return this.writePool;
  }

  getReadConnection() {
    // Round-robin load balancing
    const pool = this.readPools[this.currentReadIndex];
    this.currentReadIndex = (this.currentReadIndex + 1) % this.readPools.length;
    return pool;
  }
}
```

---

## Troubleshooting

### 1. Common Issues and Solutions

#### Issue: Application Won't Start

**Symptoms**:
- Blank page or loading screen
- Console errors about missing modules
- Build fails

**Diagnosis**:
```bash
# Check Node.js version
node --version
# Should be 18.17.0 or higher

# Check npm version  
npm --version
# Should be 9.6.7 or higher

# Verify dependencies
npm list --depth=0

# Check for missing environment variables
node scripts/validate-env.js
```

**Solutions**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force

# Rebuild node modules
npm rebuild

# Check environment variables
cp .env.example .env.local
# Edit .env.local with correct values
```

#### Issue: Database Connection Failures

**Symptoms**:
- "Connection refused" errors
- Authentication failures
- Timeout errors

**Diagnosis**:
```bash
# Test database connection
curl -I "https://aogeenqytwrpjvrfwvjw.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY"

# Check RLS policies
supabase db inspect --project-ref aogeenqytwrpjvrfwvjw
```

**Solutions**:
```bash
# Reset database connection
supabase db reset --project-ref aogeenqytwrpjvrfwvjw

# Update connection strings
# Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Verify network connectivity
ping aogeenqytwrpjvrfwvjw.supabase.co
```

#### Issue: API Rate Limiting

**Symptoms**:
- "Rate limit exceeded" errors
- 429 HTTP status codes
- Delayed responses

**Diagnosis**:
```javascript
// Check current rate limit status
console.log('API rate limits:', {
  gemini: localStorage.getItem('gemini_rate_limit'),
  perplexity: localStorage.getItem('perplexity_rate_limit')
});
```

**Solutions**:
```javascript
// Implement exponential backoff
async function callAPIWithBackoff(apiFunction, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiFunction();
    } catch (error) {
      if (error.message.includes('rate limit') && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### 2. Debug Mode and Logging

**Enable Debug Mode**:
```bash
# Set debug environment variables
export VITE_DEBUG_MODE=true
export VITE_VERBOSE_LOGGING=true

# Start with debug flags
npm run dev -- --debug
```

**Debug Information Collection**:
```javascript
// Add to browser console for debugging
window.collectDebugInfo = function() {
  const debugInfo = {
    // System information
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    
    // Application state
    route: window.location.pathname,
    localStorage: Object.keys(localStorage),
    sessionStorage: Object.keys(sessionStorage),
    
    // Performance
    memory: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB'
    } : 'Not available',
    
    // Network
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink + ' Mbps'
    } : 'Not available',
    
    // Errors
    errors: JSON.parse(localStorage.getItem('error_reports') || '[]').slice(-5)
  };
  
  console.log('🔍 Debug Information:', debugInfo);
  
  // Copy to clipboard
  navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
  console.log('📋 Debug info copied to clipboard');
  
  return debugInfo;
};
```

### 3. Performance Debugging

**Performance Analysis Script**:
```javascript
// Performance debugging utilities
window.performanceDebug = {
  // Measure component render time
  measureRender: (componentName, renderFunction) => {
    const start = performance.now();
    const result = renderFunction();
    const end = performance.now();
    console.log(`🎭 ${componentName} render: ${(end - start).toFixed(2)}ms`);
    return result;
  },
  
  // Memory usage tracking
  trackMemory: () => {
    if (performance.memory) {
      const memory = {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
      console.log(`💾 Memory: ${memory.used}MB used / ${memory.total}MB total (limit: ${memory.limit}MB)`);
      return memory;
    }
    return null;
  },
  
  // Network request monitoring
  monitorRequests: () => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      console.log(`🌐 Request started: ${args[0]}`);
      
      try {
        const response = await originalFetch(...args);
        const end = performance.now();
        console.log(`✅ Request completed: ${args[0]} (${(end - start).toFixed(2)}ms)`);
        return response;
      } catch (error) {
        const end = performance.now();
        console.log(`❌ Request failed: ${args[0]} (${(end - start).toFixed(2)}ms)`, error);
        throw error;
      }
    };
  }
};
```

### 4. Production Debugging

**Production Debug Script** (for emergencies only):
```javascript
// Emergency production debugging (use sparingly)
window.emergencyDebug = {
  // Get application state
  getAppState: () => {
    const state = {
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
      errors: localStorage.getItem('error_reports'),
      performance: window.performanceDebug?.trackMemory(),
      api_status: 'checking...'
    };
    
    // Test API connectivity
    fetch('/health')
      .then(r => r.ok ? 'healthy' : 'degraded')
      .then(status => {
        state.api_status = status;
        console.log('🚨 Emergency Debug State:', state);
      })
      .catch(() => {
        state.api_status = 'failed';
        console.log('🚨 Emergency Debug State:', state);
      });
    
    return state;
  },
  
  // Force clear all cache
  clearAllCache: () => {
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    console.log('🧹 All cache cleared');
  },
  
  // Export debug bundle
  exportDebugBundle: () => {
    const bundle = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      state: window.emergencyDebug.getAppState(),
      console: console.history || [],
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    };
    
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-bundle-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📁 Debug bundle exported');
  }
};
```

### 5. Getting Help

**Support Channels**:
1. **Documentation**: Check this guide and API documentation
2. **Issues**: Create GitHub issue with debug information
3. **Community**: Join discussions in project repository

**When Reporting Issues**:
1. Include debug bundle (`window.emergencyDebug.exportDebugBundle()`)
2. Describe expected vs. actual behavior
3. Provide steps to reproduce
4. Include browser and system information
5. Mention environment (development/staging/production)

**Emergency Contacts**:
- **Technical Issues**: Create GitHub issue
- **Security Issues**: Follow responsible disclosure
- **Production Outages**: Use monitoring alerts

---

This comprehensive deployment guide provides everything needed to successfully deploy and maintain the ASR-GoT framework in production. Follow the steps carefully and refer to the troubleshooting section for common issues.