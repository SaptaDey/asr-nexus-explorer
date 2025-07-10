/**
 * P1.21 Cost Guardrails and Budget Management
 * Implements compute cost management with fallback heuristics
 */

interface APIUsage {
  geminiCalls: number;
  sonarCalls: number;
  geminiTokens: number;
  sonarTokens: number;
  totalCost: number;
  lastReset: string;
}

interface CostLimits {
  maxDailyCost: number;
  maxHourlyCost: number;
  maxGeminiCalls: number;
  maxSonarCalls: number;
  maxGeminiTokens: number;
  maxSonarTokens: number;
  warningThreshold: number; // Percentage of limit
}

class CostGuardrails {
  private usage: APIUsage;
  private limits: CostLimits;
  private fallbackMode: boolean = false;
  private listeners: Set<(usage: APIUsage, limits: CostLimits) => void> = new Set();

  // Pricing constants (as of 2025)
  private readonly GEMINI_COST_PER_TOKEN = 0.000002; // $2 per 1M tokens
  private readonly SONAR_COST_PER_CALL = 0.005; // Estimated $5 per 1K calls

  constructor() {
    this.limits = {
      maxDailyCost: 50.0, // $50 per day
      maxHourlyCost: 10.0, // $10 per hour
      maxGeminiCalls: 1000, // Per day
      maxSonarCalls: 500,   // Per day
      maxGeminiTokens: 1000000, // 1M tokens per day
      maxSonarTokens: 100000,   // 100K tokens per day
      warningThreshold: 80 // 80% of limit
    };

    this.usage = this.loadUsage();
    this.resetIfNeeded();
  }

  // Load usage from localStorage
  private loadUsage(): APIUsage {
    try {
      const stored = localStorage.getItem('asr-got-api-usage');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load API usage data:', error);
    }

    return {
      geminiCalls: 0,
      sonarCalls: 0,
      geminiTokens: 0,
      sonarTokens: 0,
      totalCost: 0,
      lastReset: new Date().toISOString()
    };
  }

  // Save usage to localStorage
  private saveUsage(): void {
    try {
      localStorage.setItem('asr-got-api-usage', JSON.stringify(this.usage));
    } catch (error) {
      console.warn('Failed to save API usage data:', error);
    }
  }

  // Reset usage if it's a new day
  private resetIfNeeded(): void {
    const lastReset = new Date(this.usage.lastReset);
    const now = new Date();
    
    // Reset daily if it's been more than 24 hours
    if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
      this.usage = {
        geminiCalls: 0,
        sonarCalls: 0,
        geminiTokens: 0,
        sonarTokens: 0,
        totalCost: 0,
        lastReset: now.toISOString()
      };
      this.saveUsage();
      this.notifyListeners();
    }
  }

  // Check if operation is allowed
  public canMakeCall(type: 'gemini' | 'sonar', estimatedTokens: number = 0): boolean {
    this.resetIfNeeded();

    const estimatedCost = type === 'gemini' 
      ? estimatedTokens * this.GEMINI_COST_PER_TOKEN
      : this.SONAR_COST_PER_CALL;

    // Check cost limits
    if (this.usage.totalCost + estimatedCost > this.limits.maxDailyCost) {
      this.enterFallbackMode('Daily cost limit exceeded');
      return false;
    }

    // Check call limits
    if (type === 'gemini' && this.usage.geminiCalls >= this.limits.maxGeminiCalls) {
      this.enterFallbackMode('Gemini call limit exceeded');
      return false;
    }

    if (type === 'sonar' && this.usage.sonarCalls >= this.limits.maxSonarCalls) {
      this.enterFallbackMode('Sonar call limit exceeded');
      return false;
    }

    // Check token limits
    if (type === 'gemini' && this.usage.geminiTokens + estimatedTokens > this.limits.maxGeminiTokens) {
      this.enterFallbackMode('Gemini token limit exceeded');
      return false;
    }

    if (type === 'sonar' && this.usage.sonarTokens + estimatedTokens > this.limits.maxSonarTokens) {
      this.enterFallbackMode('Sonar token limit exceeded');
      return false;
    }

    return true;
  }

  // Record API usage
  public recordUsage(type: 'gemini' | 'sonar', tokens: number): void {
    const cost = type === 'gemini' 
      ? tokens * this.GEMINI_COST_PER_TOKEN
      : this.SONAR_COST_PER_CALL;

    if (type === 'gemini') {
      this.usage.geminiCalls++;
      this.usage.geminiTokens += tokens;
    } else {
      this.usage.sonarCalls++;
      this.usage.sonarTokens += tokens;
    }

    this.usage.totalCost += cost;
    this.saveUsage();
    this.notifyListeners();

    // Check warning thresholds
    this.checkWarningThresholds();
  }

  // Check if we're approaching limits
  private checkWarningThresholds(): void {
    const costWarning = (this.usage.totalCost / this.limits.maxDailyCost) * 100;
    const geminiCallWarning = (this.usage.geminiCalls / this.limits.maxGeminiCalls) * 100;
    const sonarCallWarning = (this.usage.sonarCalls / this.limits.maxSonarCalls) * 100;
    const geminiTokenWarning = (this.usage.geminiTokens / this.limits.maxGeminiTokens) * 100;
    const sonarTokenWarning = (this.usage.sonarTokens / this.limits.maxSonarTokens) * 100;

    if (costWarning >= this.limits.warningThreshold) {
      this.notifyWarning('Cost', costWarning);
    }
    if (geminiCallWarning >= this.limits.warningThreshold) {
      this.notifyWarning('Gemini calls', geminiCallWarning);
    }
    if (sonarCallWarning >= this.limits.warningThreshold) {
      this.notifyWarning('Sonar calls', sonarCallWarning);
    }
    if (geminiTokenWarning >= this.limits.warningThreshold) {
      this.notifyWarning('Gemini tokens', geminiTokenWarning);
    }
    if (sonarTokenWarning >= this.limits.warningThreshold) {
      this.notifyWarning('Sonar tokens', sonarTokenWarning);
    }
  }

  // Enter fallback mode
  private enterFallbackMode(reason: string): void {
    this.fallbackMode = true;
    console.warn(`Entering fallback mode: ${reason}`);
    
    // Dispatch custom event for UI notification
    window.dispatchEvent(new CustomEvent('cost-limit-exceeded', {
      detail: { reason, usage: this.usage, limits: this.limits }
    }));
  }

  // Exit fallback mode
  public exitFallbackMode(): void {
    this.fallbackMode = false;
    console.info('Exiting fallback mode');
  }

  // Get fallback heuristics
  public getFallbackHeuristics(stage: number): string {
    const heuristics = {
      1: 'Use template-based initialization without API calls',
      2: 'Apply standard decomposition dimensions',
      3: 'Generate hypotheses using predefined patterns',
      4: 'Use cached evidence or simplified analysis',
      5: 'Apply rule-based pruning algorithms',
      6: 'Extract subgraphs using graph algorithms',
      7: 'Generate basic composition using templates',
      8: 'Apply standard reflection checklist',
      9: 'Generate final analysis using accumulated data'
    };

    return heuristics[stage] || 'Continue with local processing';
  }

  // Notify warning
  private notifyWarning(type: string, percentage: number): void {
    console.warn(`${type} usage at ${percentage.toFixed(1)}% of daily limit`);
    
    window.dispatchEvent(new CustomEvent('cost-warning', {
      detail: { type, percentage, usage: this.usage, limits: this.limits }
    }));
  }

  // Subscribe to usage updates
  public subscribe(callback: (usage: APIUsage, limits: CostLimits) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.usage, this.limits));
  }

  // Get current usage
  public getUsage(): APIUsage {
    return { ...this.usage };
  }

  // Get current limits
  public getLimits(): CostLimits {
    return { ...this.limits };
  }

  // Update limits
  public updateLimits(newLimits: Partial<CostLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  // Check if in fallback mode
  public isInFallbackMode(): boolean {
    return this.fallbackMode;
  }

  // Get usage percentage for a specific metric
  public getUsagePercentage(metric: keyof APIUsage): number {
    switch (metric) {
      case 'totalCost':
        return (this.usage.totalCost / this.limits.maxDailyCost) * 100;
      case 'geminiCalls':
        return (this.usage.geminiCalls / this.limits.maxGeminiCalls) * 100;
      case 'sonarCalls':
        return (this.usage.sonarCalls / this.limits.maxSonarCalls) * 100;
      case 'geminiTokens':
        return (this.usage.geminiTokens / this.limits.maxGeminiTokens) * 100;
      case 'sonarTokens':
        return (this.usage.sonarTokens / this.limits.maxSonarTokens) * 100;
      default:
        return 0;
    }
  }

  // Reset usage manually
  public resetUsage(): void {
    this.usage = {
      geminiCalls: 0,
      sonarCalls: 0,
      geminiTokens: 0,
      sonarTokens: 0,
      totalCost: 0,
      lastReset: new Date().toISOString()
    };
    this.saveUsage();
    this.exitFallbackMode();
    this.notifyListeners();
  }
}

// Global instance
export const costGuardrails = new CostGuardrails();

// Export types
export type { APIUsage, CostLimits };