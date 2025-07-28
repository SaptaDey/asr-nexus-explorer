/**
 * RAG (Retrieval-Augmented Generation) Reanalysis Service
 * Provides intelligent query reanalysis using stored research sessions
 */

import { queryHistoryService } from './QueryHistoryService';
import { callGeminiAPI } from './apiService';
import { GraphData, ResearchContext } from '@/types/asrGotTypes';

export interface RAGContext {
  sessionId: string;
  query: string;
  researchField: string;
  stageResults: string[];
  graphData?: GraphData;
  figures: any[];
  tables: any[];
  createdAt: string;
  completedStages: number;
}

export interface RAGInsight {
  type: 'similar_research' | 'complementary_findings' | 'methodological_improvement' | 'knowledge_gap';
  relevanceScore: number;
  sourceSession: string;
  title: string;
  description: string;
  evidence: string[];
  actionableRecommendations: string[];
}

export interface RAGReanalysisResult {
  enhancedQuery: string;
  crossSessionInsights: RAGInsight[];
  recommendedApproaches: string[];
  relatedSessions: RAGContext[];
  synthesizedFindings: string;
  methodologicalImprovements: string[];
}

export class RAGReanalysisService {
  private static instance: RAGReanalysisService;
  private embeddingsCache = new Map<string, number[]>();
  private sessionContextCache = new Map<string, RAGContext>();

  public static getInstance(): RAGReanalysisService {
    if (!RAGReanalysisService.instance) {
      RAGReanalysisService.instance = new RAGReanalysisService();
    }
    return RAGReanalysisService.instance;
  }

  /**
   * Generate embeddings for text content using OpenAI-compatible API
   */
  private async generateEmbeddings(text: string): Promise<number[]> {
    const cacheKey = this.hashText(text);
    
    if (this.embeddingsCache.has(cacheKey)) {
      return this.embeddingsCache.get(cacheKey)!;
    }

    try {
      // Use Gemini for embeddings (simulated via text analysis)
      const response = await callGeminiAPI(
        `Generate a semantic analysis vector for this text. Provide 10 numerical values (0-1) representing: research_depth, methodological_rigor, empirical_evidence, theoretical_foundation, innovation_level, complexity, interdisciplinary_scope, practical_application, statistical_strength, citation_quality.

Text: ${text.substring(0, 2000)}

Return only the 10 numbers separated by commas.`,
        { temperature: 0.1, maxTokens: 100 }
      );

      // Parse the response to extract numerical values
      const embeddings = this.parseEmbeddingsResponse(response);
      this.embeddingsCache.set(cacheKey, embeddings);
      return embeddings;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      // Fallback: generate basic embeddings based on text features
      return this.generateFallbackEmbeddings(text);
    }
  }

  /**
   * Parse embeddings response from Gemini
   */
  private parseEmbeddingsResponse(response: string): number[] {
    try {
      const matches = response.match(/[\d.]+/g);
      if (matches && matches.length >= 10) {
        return matches.slice(0, 10).map(n => Math.min(1, Math.max(0, parseFloat(n))));
      }
    } catch (error) {
      console.warn('Failed to parse embeddings response:', error);
    }
    
    // Return default embeddings if parsing fails
    return Array(10).fill(0.5);
  }

  /**
   * Generate fallback embeddings based on text analysis
   */
  private generateFallbackEmbeddings(text: string): number[] {
    const length = text.length;
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const scientificTerms = (text.match(/\b(analysis|research|study|method|result|conclusion|hypothesis|evidence|data|statistical|significant|correlation|p-value|confidence)\b/gi) || []).length;
    const citations = (text.match(/\[\d+\]|\(\d{4}\)|et al\./g) || []).length;
    const figures = (text.match(/figure|chart|graph|plot|visualization/gi) || []).length;
    const tables = (text.match(/table|data.*set|results.*table/gi) || []).length;
    
    return [
      Math.min(1, length / 5000), // research_depth
      Math.min(1, scientificTerms / 50), // methodological_rigor
      Math.min(1, citations / 20), // empirical_evidence
      Math.min(1, words / 1000), // theoretical_foundation
      Math.min(1, (text.match(/novel|innovative|new|breakthrough/gi) || []).length / 10), // innovation_level
      Math.min(1, sentences / 100), // complexity
      Math.min(1, (text.match(/interdisciplinary|cross.*field|multi.*discipline/gi) || []).length / 5), // interdisciplinary_scope
      Math.min(1, (text.match(/application|clinical|practical|implementation/gi) || []).length / 10), // practical_application
      Math.min(1, (text.match(/p.*<|confidence.*interval|statistical.*significance/gi) || []).length / 5), // statistical_strength
      Math.min(1, citations / 30) // citation_quality
    ];
  }

  /**
   * Calculate similarity between two embedding vectors
   */
  private calculateSimilarity(embeddings1: number[], embeddings2: number[]): number {
    if (embeddings1.length !== embeddings2.length) return 0;
    
    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embeddings1.length; i++) {
      dotProduct += embeddings1[i] * embeddings2[i];
      norm1 += embeddings1[i] * embeddings1[i];
      norm2 += embeddings2[i] * embeddings2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Retrieve and process all stored sessions for RAG context
   */
  async buildRAGContext(): Promise<RAGContext[]> {
    try {
      const { sessions } = await queryHistoryService.getQueryHistory(100, 0); // Get up to 100 recent sessions
      
      const ragContexts: RAGContext[] = [];
      
      for (const session of sessions) {
        if (session.status === 'completed' && session.stage_results) {
          // Get session details including figures and tables
          const sessionDetails = await queryHistoryService.getSessionDetails(session.id);
          
          const ragContext: RAGContext = {
            sessionId: session.id,
            query: session.query,
            researchField: session.research_context?.field || 'General',
            stageResults: session.stage_results as string[],
            graphData: session.graph_data as GraphData,
            figures: sessionDetails.figures || [],
            tables: sessionDetails.tables || [],
            createdAt: session.created_at,
            completedStages: (session.stage_results as string[]).filter(r => r && r.trim()).length
          };
          
          ragContexts.push(ragContext);
          this.sessionContextCache.set(session.id, ragContext);
        }
      }
      
      console.log(`✅ Built RAG context with ${ragContexts.length} completed sessions`);
      return ragContexts;
    } catch (error) {
      console.error('Failed to build RAG context:', error);
      return [];
    }
  }

  /**
   * Find similar research sessions based on query and content
   */
  async findSimilarSessions(
    targetQuery: string, 
    targetContext: ResearchContext,
    ragContexts: RAGContext[],
    limit = 5
  ): Promise<{ session: RAGContext; similarity: number }[]> {
    try {
      // Generate embeddings for target query
      const targetEmbeddings = await this.generateEmbeddings(
        `${targetQuery} ${targetContext.topic} ${targetContext.field}`
      );
      
      const similarities: { session: RAGContext; similarity: number }[] = [];
      
      for (const context of ragContexts) {
        // Generate embeddings for session content
        const sessionContent = `${context.query} ${context.stageResults.join(' ')}`;
        const sessionEmbeddings = await this.generateEmbeddings(sessionContent);
        
        const similarity = this.calculateSimilarity(targetEmbeddings, sessionEmbeddings);
        
        // Apply additional relevance factors
        const fieldMatch = context.researchField.toLowerCase() === targetContext.field?.toLowerCase() ? 1.2 : 1.0;
        const completenessBonus = context.completedStages >= 8 ? 1.1 : 1.0;
        const finalSimilarity = similarity * fieldMatch * completenessBonus;
        
        similarities.push({ session: context, similarity: finalSimilarity });
      }
      
      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to find similar sessions:', error);
      return [];
    }
  }

  /**
   * Generate cross-session insights using Gemini
   */
  async generateCrossSessionInsights(
    targetQuery: string,
    similarSessions: { session: RAGContext; similarity: number }[]
  ): Promise<RAGInsight[]> {
    if (similarSessions.length === 0) return [];

    try {
      const sessionSummaries = similarSessions.map(({ session, similarity }) => ({
        id: session.sessionId.substring(0, 8),
        query: session.query,
        field: session.researchField,
        similarity: Math.round(similarity * 100),
        keyFindings: session.stageResults.slice(6, 9).join(' ').substring(0, 500)
      }));

      const prompt = `As an AI research analyst, analyze the following research sessions to generate insights for a new query.

TARGET QUERY: "${targetQuery}"

RELATED SESSIONS:
${sessionSummaries.map(s => `
Session ${s.id} (${s.similarity}% similar):
Query: ${s.query}
Field: ${s.field}
Key Findings: ${s.keyFindings}
`).join('\n')}

Generate 3-5 actionable insights in this JSON format:
[{
  "type": "similar_research" | "complementary_findings" | "methodological_improvement" | "knowledge_gap",
  "relevanceScore": 0.0-1.0,
  "sourceSession": "session_id",
  "title": "Brief insight title",
  "description": "Detailed description",
  "evidence": ["key evidence point 1", "key evidence point 2"],
  "actionableRecommendations": ["specific recommendation 1", "specific recommendation 2"]
}]

Focus on:
1. Similar research patterns and methodological approaches
2. Complementary findings that could enhance the analysis
3. Methodological improvements based on past sessions
4. Knowledge gaps that previous research identified`;

      const response = await callGeminiAPI(prompt, {
        temperature: 0.3,
        maxTokens: 2000
      });

      return this.parseInsightsResponse(response, similarSessions);
    } catch (error) {
      console.error('Failed to generate cross-session insights:', error);
      return this.generateFallbackInsights(similarSessions);
    }
  }

  /**
   * Parse insights response from Gemini
   */
  private parseInsightsResponse(
    response: string, 
    similarSessions: { session: RAGContext; similarity: number }[]
  ): RAGInsight[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]) as RAGInsight[];
        return insights.map(insight => ({
          ...insight,
          sourceSession: similarSessions[0]?.session.sessionId || insight.sourceSession
        }));
      }
    } catch (error) {
      console.warn('Failed to parse insights response:', error);
    }
    
    return this.generateFallbackInsights(similarSessions);
  }

  /**
   * Generate fallback insights when AI parsing fails
   */
  private generateFallbackInsights(
    similarSessions: { session: RAGContext; similarity: number }[]
  ): RAGInsight[] {
    return similarSessions.slice(0, 3).map((item, index) => ({
      type: ['similar_research', 'complementary_findings', 'methodological_improvement'][index] as any,
      relevanceScore: item.similarity,
      sourceSession: item.session.sessionId,
      title: `Related Research Pattern ${index + 1}`,
      description: `This session explored similar themes and may provide valuable methodological insights.`,
      evidence: [`Query similarity: ${Math.round(item.similarity * 100)}%`, `Research field: ${item.session.researchField}`],
      actionableRecommendations: [
        'Review methodology from this session',
        'Consider integrating similar analytical approaches'
      ]
    }));
  }

  /**
   * Perform comprehensive RAG reanalysis
   */
  async performReanalysis(
    sessionId: string,
    enhancementQuery?: string
  ): Promise<RAGReanalysisResult> {
    try {
      console.log(`🔍 Starting RAG reanalysis for session: ${sessionId}`);
      
      // Load target session
      const sessionDetails = await queryHistoryService.getSessionDetails(sessionId);
      const targetContext: ResearchContext = sessionDetails.session.research_context || {};
      const targetQuery = enhancementQuery || sessionDetails.session.query;
      
      // Build RAG context from all sessions
      const ragContexts = await this.buildRAGContext();
      
      // Find similar sessions
      const similarSessions = await this.findSimilarSessions(
        targetQuery,
        targetContext,
        ragContexts.filter(ctx => ctx.sessionId !== sessionId)
      );
      
      // Generate cross-session insights
      const crossSessionInsights = await this.generateCrossSessionInsights(
        targetQuery,
        similarSessions
      );
      
      // Generate enhanced query and recommendations
      const enhancedAnalysis = await this.generateEnhancedAnalysis(
        sessionDetails,
        similarSessions,
        crossSessionInsights
      );
      
      console.log(`✅ RAG reanalysis completed with ${crossSessionInsights.length} insights`);
      
      return {
        enhancedQuery: enhancedAnalysis.enhancedQuery,
        crossSessionInsights,
        recommendedApproaches: enhancedAnalysis.recommendedApproaches,
        relatedSessions: similarSessions.map(s => s.session),
        synthesizedFindings: enhancedAnalysis.synthesizedFindings,
        methodologicalImprovements: enhancedAnalysis.methodologicalImprovements
      };
      
    } catch (error) {
      console.error('RAG reanalysis failed:', error);
      throw new Error(`Failed to perform reanalysis: ${error.message}`);
    }
  }

  /**
   * Generate enhanced analysis using Gemini
   */
  private async generateEnhancedAnalysis(
    sessionDetails: any,
    similarSessions: { session: RAGContext; similarity: number }[],
    insights: RAGInsight[]
  ): Promise<{
    enhancedQuery: string;
    recommendedApproaches: string[];
    synthesizedFindings: string;
    methodologicalImprovements: string[];
  }> {
    try {
      const prompt = `As a research analyst, enhance this research based on related sessions and insights.

ORIGINAL SESSION:
Query: ${sessionDetails.session.query}
Field: ${sessionDetails.session.research_context?.field}
Key Results: ${sessionDetails.session.stage_results?.slice(6, 9)?.join(' ')?.substring(0, 800)}

INSIGHTS FROM RELATED SESSIONS:
${insights.map(i => `- ${i.title}: ${i.description}`).join('\n')}

RELATED RESEARCH:
${similarSessions.slice(0, 3).map(s => `- ${s.session.query} (${Math.round(s.similarity * 100)}% similar)`).join('\n')}

Provide enhanced analysis in this format:

ENHANCED_QUERY: [Refined research question incorporating insights]

RECOMMENDED_APPROACHES:
- [Specific methodological recommendation 1]
- [Specific methodological recommendation 2]
- [Specific methodological recommendation 3]

SYNTHESIZED_FINDINGS: [2-3 sentences synthesizing key findings across sessions]

METHODOLOGICAL_IMPROVEMENTS:
- [Improvement based on related research 1]
- [Improvement based on related research 2]
- [Improvement based on related research 3]`;

      const response = await callGeminiAPI(prompt, {
        temperature: 0.4,
        maxTokens: 1500
      });

      return this.parseEnhancedAnalysis(response);
    } catch (error) {
      console.error('Failed to generate enhanced analysis:', error);
      return this.generateFallbackEnhancedAnalysis(sessionDetails);
    }
  }

  /**
   * Parse enhanced analysis response
   */
  private parseEnhancedAnalysis(response: string): {
    enhancedQuery: string;
    recommendedApproaches: string[];
    synthesizedFindings: string;
    methodologicalImprovements: string[];
  } {
    const enhancedQuery = this.extractSection(response, 'ENHANCED_QUERY:') || 'Enhanced research query with RAG insights';
    const synthesizedFindings = this.extractSection(response, 'SYNTHESIZED_FINDINGS:') || 'Synthesized findings from multiple research sessions';
    
    const approaches = this.extractListSection(response, 'RECOMMENDED_APPROACHES:');
    const improvements = this.extractListSection(response, 'METHODOLOGICAL_IMPROVEMENTS:');
    
    return {
      enhancedQuery,
      recommendedApproaches: approaches.length > 0 ? approaches : ['Review related methodologies', 'Consider cross-session patterns'],
      synthesizedFindings,
      methodologicalImprovements: improvements.length > 0 ? improvements : ['Integrate successful approaches from similar research']
    };
  }

  /**
   * Generate fallback enhanced analysis
   */
  private generateFallbackEnhancedAnalysis(sessionDetails: any): {
    enhancedQuery: string;
    recommendedApproaches: string[];
    synthesizedFindings: string;
    methodologicalImprovements: string[];
  } {
    return {
      enhancedQuery: `Enhanced analysis of: ${sessionDetails.session.query}`,
      recommendedApproaches: [
        'Cross-reference with similar research patterns',
        'Apply successful methodologies from related sessions',
        'Incorporate complementary analytical approaches'
      ],
      synthesizedFindings: 'Analysis enhanced through cross-session knowledge integration and pattern recognition.',
      methodologicalImprovements: [
        'Leverage proven analytical frameworks',
        'Integrate multi-session insights',
        'Apply refined research methodologies'
      ]
    };
  }

  /**
   * Utility methods
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private extractSection(text: string, marker: string): string | null {
    const lines = text.split('\n');
    const startIndex = lines.findIndex(line => line.includes(marker));
    if (startIndex === -1) return null;
    
    let result = lines[startIndex].replace(marker, '').trim();
    
    // Look for content on subsequent lines if the marker line is empty
    if (!result && startIndex < lines.length - 1) {
      result = lines[startIndex + 1]?.trim() || '';
    }
    
    return result || null;
  }

  private extractListSection(text: string, marker: string): string[] {
    const lines = text.split('\n');
    const startIndex = lines.findIndex(line => line.includes(marker));
    if (startIndex === -1) return [];
    
    const items: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.includes(':') && !line.startsWith('-')) break; // Next section
      if (line.startsWith('-')) {
        items.push(line.substring(1).trim());
      }
    }
    
    return items;
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.embeddingsCache.clear();
    this.sessionContextCache.clear();
    console.log('🧹 RAG caches cleared');
  }
}

// Export singleton instance
export const ragReanalysisService = RAGReanalysisService.getInstance();