/**
 * Cost Monitor Component
 * Displays P1.21 cost guardrails and usage statistics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  AlertTriangle, 
  Shield, 
  RotateCcw,
  TrendingUp,
  Zap,
  Clock,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { costGuardrails, APIUsage, CostLimits } from '@/services/CostGuardrails';
import { toast } from 'sonner';

interface CostMonitorProps {
  className?: string;
}

export const CostMonitor: React.FC<CostMonitorProps> = ({ className = '' }) => {
  const [usage, setUsage] = useState<APIUsage>(costGuardrails.getUsage());
  const [limits, setLimits] = useState<CostLimits>(costGuardrails.getLimits());
  const [isInFallbackMode, setIsInFallbackMode] = useState(costGuardrails.isInFallbackMode());
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    // Subscribe to usage updates
    const unsubscribe = costGuardrails.subscribe((newUsage, newLimits) => {
      setUsage(newUsage);
      setLimits(newLimits);
      setIsInFallbackMode(costGuardrails.isInFallbackMode());
    });

    // Listen for cost warnings
    const handleCostWarning = (event: any) => {
      const { type, percentage } = event.detail;
      setShowWarning(true);
      setWarningMessage(`${type} usage at ${percentage.toFixed(1)}% of limit`);
      toast.warning(`Cost Warning: ${type} usage at ${percentage.toFixed(1)}%`);
    };

    // Listen for cost limit exceeded
    const handleCostLimitExceeded = (event: any) => {
      const { reason } = event.detail;
      toast.error(`Cost Limit Exceeded: ${reason}`);
      setIsInFallbackMode(true);
    };

    window.addEventListener('cost-warning', handleCostWarning);
    window.addEventListener('cost-limit-exceeded', handleCostLimitExceeded);

    return () => {
      unsubscribe();
      window.removeEventListener('cost-warning', handleCostWarning);
      window.removeEventListener('cost-limit-exceeded', handleCostLimitExceeded);
    };
  }, []);

  const handleResetUsage = () => {
    costGuardrails.resetUsage();
    toast.success('Usage statistics reset');
    setShowWarning(false);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 80) return 'text-yellow-500';
    if (percentage >= 60) return 'text-orange-500';
    return 'text-green-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const costPercentage = costGuardrails.getUsagePercentage('totalCost');
  const geminiCallsPercentage = costGuardrails.getUsagePercentage('geminiCalls');
  const sonarCallsPercentage = costGuardrails.getUsagePercentage('sonarCalls');
  const geminiTokensPercentage = costGuardrails.getUsagePercentage('geminiTokens');
  const sonarTokensPercentage = costGuardrails.getUsagePercentage('sonarTokens');

  const lastResetDate = new Date(usage.lastReset);
  const timeSinceReset = new Date().getTime() - lastResetDate.getTime();
  const hoursSinceReset = Math.floor(timeSinceReset / (1000 * 60 * 60));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <span>Cost Monitor (P1.21)</span>
            {isInFallbackMode && (
              <Badge variant="destructive" className="animate-pulse">
                Fallback Mode
              </Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={handleResetUsage}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fallback Mode Alert */}
        {isInFallbackMode && (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Cost limits exceeded. Using fallback heuristics for processing.
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Alert */}
        {showWarning && !isInFallbackMode && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{warningMessage}</AlertDescription>
          </Alert>
        )}

        {/* Time Since Reset */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Period: {hoursSinceReset}h since reset</span>
          </div>
          <span>Resets daily at midnight</span>
        </div>

        {/* Cost Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Daily Cost</span>
              <span className={`text-sm font-bold ${getStatusColor(costPercentage)}`}>
                ${usage.totalCost.toFixed(2)} / ${limits.maxDailyCost}
              </span>
            </div>
            <Progress 
              value={costPercentage} 
              className="h-2"
              style={{ 
                background: `linear-gradient(to right, ${getProgressColor(costPercentage)} ${costPercentage}%, #e5e5e5 ${costPercentage}%)` 
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Calls</span>
              <span className="text-sm font-bold">
                {usage.geminiCalls + usage.sonarCalls}
              </span>
            </div>
            <div className="flex gap-1">
              <Badge variant="secondary" className="text-xs">
                Gemini: {usage.geminiCalls}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Sonar: {usage.sonarCalls}
              </Badge>
            </div>
          </div>
        </div>

        {/* Detailed Usage Metrics */}
        <div className="space-y-3">
          {/* Gemini Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Gemini API</span>
              </div>
              <span className={`text-xs ${getStatusColor(Math.max(geminiCallsPercentage, geminiTokensPercentage))}`}>
                {Math.max(geminiCallsPercentage, geminiTokensPercentage).toFixed(0)}%
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-xs">
                  <span>Calls</span>
                  <span>{usage.geminiCalls} / {limits.maxGeminiCalls}</span>
                </div>
                <Progress value={geminiCallsPercentage} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <span>Tokens</span>
                  <span>{usage.geminiTokens.toLocaleString()} / {limits.maxGeminiTokens.toLocaleString()}</span>
                </div>
                <Progress value={geminiTokensPercentage} className="h-1" />
              </div>
            </div>
          </div>

          {/* Sonar Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Sonar API</span>
              </div>
              <span className={`text-xs ${getStatusColor(Math.max(sonarCallsPercentage, sonarTokensPercentage))}`}>
                {Math.max(sonarCallsPercentage, sonarTokensPercentage).toFixed(0)}%
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-xs">
                  <span>Calls</span>
                  <span>{usage.sonarCalls} / {limits.maxSonarCalls}</span>
                </div>
                <Progress value={sonarCallsPercentage} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <span>Tokens</span>
                  <span>{usage.sonarTokens.toLocaleString()} / {limits.maxSonarTokens.toLocaleString()}</span>
                </div>
                <Progress value={sonarTokensPercentage} className="h-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Cost Breakdown</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Gemini Cost:</span>
              <span>${(usage.geminiTokens * 0.000002).toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sonar Cost:</span>
              <span>${(usage.sonarCalls * 0.005).toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Projected Daily Cost */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-lg p-3"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Projected Daily Cost:</span>
            <span className="font-bold">
              ${hoursSinceReset > 0 ? ((usage.totalCost / hoursSinceReset) * 24).toFixed(2) : '0.00'}
            </span>
          </div>
          {hoursSinceReset > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Based on current {hoursSinceReset}h usage pattern
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};