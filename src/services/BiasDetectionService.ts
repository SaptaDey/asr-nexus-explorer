/**
 * Bias Detection and Knowledge Gap Monitoring for ASR-GoT
 * Identifies cognitive biases and research gaps in scientific analysis
 */

import { ResearchContext, GraphData } from '@/types/asrGotTypes';
import { callGeminiAPI } from './apiService';

export interface BiasDetectionResult {
  biases_detected: DetectedBias[];
  knowledge_gaps: KnowledgeGap[];
  confidence_score: number;
  recommendations: string[];
}

export interface DetectedBias {
  type: BiasType;
  description: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string[];
  mitigation_suggestions: string[];
}

export interface KnowledgeGap {
  area: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggested_research: string[];
  data_requirements: string[];
}

export type BiasType = 
  | 'confirmation_bias'
  | 'selection_bias'
  | 'publication_bias'
  | 'availability_heuristic'
  | 'anchoring_bias'
  | 'survivorship_bias'
  | 'cherry_picking'
  | 'correlation_causation'
  | 'sample_size_bias'
  | 'temporal_bias';

export class BiasDetectionService {
  private geminiApiKey: string;

  constructor(geminiApiKey: string) {
    this.geminiApiKey = geminiApiKey;
  }

  async analyzeResearchBiases(
    researchContext: ResearchContext,
    stageResults: string[],
    graphData: GraphData
  ): Promise<BiasDetectionResult> {
    
    const analysisPrompt = `
You are an expert in research methodology and cognitive bias detection. Analyze this scientific research for potential biases and knowledge gaps.

Research Context:
- Field: ${researchContext.field}
- Topic: ${researchContext.topic}
- Objectives: ${researchContext.objectives.join(', ')}
- Hypotheses: ${researchContext.hypotheses.join(', ')}

Analysis Results:
${stageResults.join('\n\n---\n\n')}

Graph Metrics:
- Total nodes: ${graphData.nodes.length}
- Total edges: ${graphData.edges.length}
- Node types: ${Array.from(new Set(graphData.nodes.map(n => n.type))).join(', ')}

Please identify:

1. COGNITIVE BIASES:
- Confirmation bias (selective evidence)
- Selection bias (sample representation)
- Publication bias (positive results preference)
- Availability heuristic (recent/memorable information)
- Anchoring bias (first information influence)
- Survivorship bias (success-only analysis)
- Cherry picking (favorable data selection)
- Correlation-causation confusion
- Sample size bias (inadequate samples)
- Temporal bias (time-period limitations)

2. KNOWLEDGE GAPS:
- Missing research areas
- Unexplored connections
- Data limitations
- Methodological gaps
- Interdisciplinary opportunities

3. RECOMMENDATIONS:
- Bias mitigation strategies
- Additional research directions
- Methodological improvements
- Data collection suggestions

Format your response as structured analysis with specific examples and actionable recommendations.
`;

    try {
      const response = await callGeminiAPI(analysisPrompt, this.geminiApiKey);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Bias detection analysis failed:', error);
      return {
        biases_detected: [],
        knowledge_gaps: [],
        confidence_score: 0,
        recommendations: ['Analysis failed - manual review recommended']
      };
    }
  }

  private parseAnalysisResponse(response: string): BiasDetectionResult {
    // Parse the AI response into structured format
    const biases_detected: DetectedBias[] = [];
    const knowledge_gaps: KnowledgeGap[] = [];
    const recommendations: string[] = [];

    // Extract biases using pattern matching
    const biasPatterns = {
      confirmation_bias: /confirmation bias|selective evidence|cherry.*pick/i,
      selection_bias: /selection bias|sample.*bias|representative/i,
      publication_bias: /publication bias|positive.*result/i,
      availability_heuristic: /availability|recent.*information|memorable/i,
      anchoring_bias: /anchoring|first.*information|initial/i,
      survivorship_bias: /survivorship|success.*only|survivor/i,
      cherry_picking: /cherry.*pick|favorable.*data|selective/i,
      correlation_causation: /correlation.*causation|cause.*effect/i,
      sample_size_bias: /sample.*size|inadequate.*sample/i,
      temporal_bias: /temporal|time.*period|historical/i
    };

    Object.entries(biasPatterns).forEach(([biasType, pattern]) => {
      if (pattern.test(response)) {
        biases_detected.push({
          type: biasType as BiasType,
          description: this.getBiasDescription(biasType as BiasType),
          severity: this.determineSeverity(response, biasType),
          evidence: this.extractEvidence(response, biasType),
          mitigation_suggestions: this.getBiasMitigation(biasType as BiasType)
        });
      }
    });

    // Extract knowledge gaps
    const gapIndicators = [
      'missing', 'unexplored', 'limitation', 'gap', 'unclear', 
      'insufficient', 'inadequate', 'unknown', 'further research'
    ];

    gapIndicators.forEach(indicator => {
      const regex = new RegExp(`${indicator}[^.]*`, 'gi');
      const matches = response.match(regex);
      if (matches) {
        matches.forEach(match => {
          knowledge_gaps.push({
            area: indicator,
            description: match.trim(),
            impact: 'medium',
            suggested_research: [`Investigate ${match.trim()}`],
            data_requirements: ['Additional data collection needed']
          });
        });
      }
    });

    // Extract recommendations
    const recLines = response.split('\n').filter(line => 
      line.toLowerCase().includes('recommend') || 
      line.toLowerCase().includes('suggest') ||
      line.toLowerCase().includes('should')
    );
    
    recommendations.push(...recLines.map(line => line.trim()).filter(line => line.length > 0));

    return {
      biases_detected: biases_detected.slice(0, 10), // Limit to top 10
      knowledge_gaps: knowledge_gaps.slice(0, 8), // Limit to top 8
      confidence_score: this.calculateConfidenceScore(biases_detected, knowledge_gaps),
      recommendations: recommendations.slice(0, 5) // Top 5 recommendations
    };
  }

  private getBiasDescription(biasType: BiasType): string {
    const descriptions = {
      confirmation_bias: 'Tendency to search for, interpret, and recall information that confirms pre-existing beliefs',
      selection_bias: 'Systematic error in selecting participants or data that is not representative',
      publication_bias: 'Tendency to publish research with positive or significant results over negative results',
      availability_heuristic: 'Overestimating likelihood based on easily recalled examples',
      anchoring_bias: 'Heavy reliance on first piece of information encountered',
      survivorship_bias: 'Focusing on successful outcomes while overlooking failures',
      cherry_picking: 'Selectively presenting data that supports a particular conclusion',
      correlation_causation: 'Assuming correlation implies causation without proper evidence',
      sample_size_bias: 'Drawing conclusions from inadequately sized samples',
      temporal_bias: 'Conclusions limited by specific time periods or historical contexts'
    };
    
    return descriptions[biasType] || 'Unknown bias type';
  }

  private determineSeverity(response: string, biasType: string): 'low' | 'medium' | 'high' {
    const highIndicators = ['significant', 'major', 'critical', 'severe'];
    const lowIndicators = ['minor', 'slight', 'minimal', 'small'];
    
    const contextWindow = this.extractContextWindow(response, biasType, 50);
    
    if (highIndicators.some(indicator => contextWindow.toLowerCase().includes(indicator))) {
      return 'high';
    } else if (lowIndicators.some(indicator => contextWindow.toLowerCase().includes(indicator))) {
      return 'low';
    }
    
    return 'medium';
  }

  private extractEvidence(response: string, biasType: string): string[] {
    const contextWindow = this.extractContextWindow(response, biasType, 100);
    return [contextWindow.substring(0, 200) + '...']; // Truncate for brevity
  }

  private extractContextWindow(text: string, keyword: string, windowSize: number): string {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - windowSize);
    const end = Math.min(text.length, index + keyword.length + windowSize);
    
    return text.substring(start, end);
  }

  private getBiasMitigation(biasType: BiasType): string[] {
    const mitigations = {
      confirmation_bias: ['Actively seek disconfirming evidence', 'Use blind data analysis', 'Employ independent reviewers'],
      selection_bias: ['Use random sampling', 'Clearly define inclusion criteria', 'Report selection process'],
      publication_bias: ['Include negative results', 'Pre-register studies', 'Use comprehensive databases'],
      availability_heuristic: ['Use systematic reviews', 'Employ statistical analysis', 'Consider base rates'],
      anchoring_bias: ['Use multiple starting points', 'Delay initial judgments', 'Seek diverse perspectives'],
      survivorship_bias: ['Include failed cases', 'Use complete datasets', 'Account for dropouts'],
      cherry_picking: ['Report all data', 'Use pre-specified analyses', 'Employ systematic methods'],
      correlation_causation: ['Use experimental design', 'Apply causal inference methods', 'Consider confounders'],
      sample_size_bias: ['Conduct power analysis', 'Use appropriate sample sizes', 'Report confidence intervals'],
      temporal_bias: ['Use multiple time periods', 'Consider historical context', 'Update analyses regularly']
    };
    
    return mitigations[biasType] || ['Conduct peer review', 'Use systematic methodology'];
  }

  private calculateConfidenceScore(biases: DetectedBias[], gaps: KnowledgeGap[]): number {
    // Higher confidence with more detected issues (paradoxically, better detection = higher confidence in analysis)
    const biasScore = biases.length * 0.1;
    const gapScore = gaps.length * 0.08;
    const severityScore = biases.reduce((acc, bias) => {
      return acc + (bias.severity === 'high' ? 0.15 : bias.severity === 'medium' ? 0.1 : 0.05);
    }, 0);
    
    return Math.min(0.95, Math.max(0.1, biasScore + gapScore + severityScore));
  }

  // Generate bias monitoring report
  generateBiasReport(result: BiasDetectionResult): string {
    let report = `# Bias Detection and Knowledge Gap Analysis\n\n`;
    
    report += `**Analysis Confidence:** ${Math.round(result.confidence_score * 100)}%\n\n`;
    
    if (result.biases_detected.length > 0) {
      report += `## 🚨 Detected Biases\n\n`;
      result.biases_detected.forEach((bias, index) => {
        report += `### ${index + 1}. ${bias.type.replace('_', ' ').toUpperCase()}\n`;
        report += `**Severity:** ${bias.severity.toUpperCase()}\n`;
        report += `**Description:** ${bias.description}\n`;
        report += `**Mitigation:**\n`;
        bias.mitigation_suggestions.forEach(suggestion => {
          report += `- ${suggestion}\n`;
        });
        report += `\n`;
      });
    }
    
    if (result.knowledge_gaps.length > 0) {
      report += `## 🔍 Knowledge Gaps\n\n`;
      result.knowledge_gaps.forEach((gap, index) => {
        report += `### ${index + 1}. ${gap.area.toUpperCase()}\n`;
        report += `**Impact:** ${gap.impact.toUpperCase()}\n`;
        report += `**Description:** ${gap.description}\n`;
        report += `**Suggested Research:**\n`;
        gap.suggested_research.forEach(research => {
          report += `- ${research}\n`;
        });
        report += `\n`;
      });
    }
    
    if (result.recommendations.length > 0) {
      report += `## 💡 Recommendations\n\n`;
      result.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
    }
    
    return report;
  }
}