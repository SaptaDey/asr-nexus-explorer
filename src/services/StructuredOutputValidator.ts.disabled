/**
 * StructuredOutputValidator.ts - JSON schema validators for Structured Output payloads
 * Implements validation for all schemas referenced in High-level_Principles.md
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Schema definitions for each Structured Output type
export const STRUCTURED_OUTPUT_SCHEMAS = {
  RootNode: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      type: { type: 'string', enum: ['task', 'root'] },
      confidence: {
        type: 'array',
        items: { type: 'number', minimum: 0, maximum: 1 },
        minItems: 4,
        maxItems: 4
      },
      metadata: {
        type: 'object',
        properties: {
          layer_id: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          task_description: { type: 'string' },
          research_domain: { type: 'string' },
          complexity_score: { type: 'number', minimum: 0, maximum: 1 },
          bias_flags: { type: 'array', items: { type: 'string' } },
          quality_metrics: {
            type: 'object',
            properties: {
              completeness: { type: 'number', minimum: 0, maximum: 1 },
              clarity: { type: 'number', minimum: 0, maximum: 1 },
              scope_alignment: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['completeness', 'clarity', 'scope_alignment']
          }
        },
        required: ['layer_id', 'timestamp', 'task_description']
      }
    },
    required: ['id', 'label', 'type', 'confidence', 'metadata'],
    additionalProperties: false
  },

  DimensionArray: {
    type: 'object',
    properties: {
      dimensions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string', enum: ['dimension'] },
            dimension_type: { 
              type: 'string', 
              enum: ['scope', 'objectives', 'constraints', 'biases', 'gaps', 'methodology'] 
            },
            confidence: {
              type: 'array',
              items: { type: 'number', minimum: 0, maximum: 1 },
              minItems: 4,
              maxItems: 4
            },
            metadata: {
              type: 'object',
              properties: {
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                complexity: { type: 'number', minimum: 0, maximum: 1 },
                bias_flags: { type: 'array', items: { type: 'string' } },
                dependencies: { type: 'array', items: { type: 'string' } }
              },
              required: ['priority', 'complexity']
            }
          },
          required: ['id', 'label', 'type', 'dimension_type', 'confidence', 'metadata']
        },
        minItems: 3,
        maxItems: 8
      },
      summary: {
        type: 'object',
        properties: {
          total_dimensions: { type: 'number' },
          avg_confidence: { type: 'number', minimum: 0, maximum: 1 },
          high_priority_count: { type: 'number' },
          bias_flags_total: { type: 'number' }
        },
        required: ['total_dimensions', 'avg_confidence']
      }
    },
    required: ['dimensions', 'summary'],
    additionalProperties: false
  },

  HypothesisBatch: {
    type: 'object',
    properties: {
      hypotheses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string', enum: ['hypothesis'] },
            parent_dimension: { type: 'string' },
            confidence: {
              type: 'array',
              items: { type: 'number', minimum: 0, maximum: 1 },
              minItems: 4,
              maxItems: 4
            },
            metadata: {
              type: 'object',
              properties: {
                falsifiability_criteria: { type: 'string' },
                impact_score: { type: 'number', minimum: 0, maximum: 1 },
                testability: { type: 'string', enum: ['high', 'medium', 'low'] },
                novelty: { type: 'number', minimum: 0, maximum: 1 },
                disciplinary_tags: { type: 'array', items: { type: 'string' } },
                statistical_power: { type: 'number', minimum: 0, maximum: 1 }
              },
              required: ['falsifiability_criteria', 'impact_score', 'testability']
            }
          },
          required: ['id', 'label', 'type', 'parent_dimension', 'confidence', 'metadata']
        },
        minItems: 3,
        maxItems: 40
      },
      summary: {
        type: 'object',
        properties: {
          total_hypotheses: { type: 'number' },
          avg_impact_score: { type: 'number', minimum: 0, maximum: 1 },
          high_testability_count: { type: 'number' },
          disciplinary_distribution: {
            type: 'object',
            patternProperties: {
              "^[a-zA-Z_]+$": { type: 'number' }
            }
          }
        },
        required: ['total_hypotheses', 'avg_impact_score']
      }
    },
    required: ['hypotheses', 'summary'],
    additionalProperties: false
  },

  EvidenceBatch: {
    type: 'object',
    properties: {
      evidence_nodes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string', enum: ['evidence'] },
            target_hypothesis: { type: 'string' },
            confidence: {
              type: 'array',
              items: { type: 'number', minimum: 0, maximum: 1 },
              minItems: 4,
              maxItems: 4
            },
            metadata: {
              type: 'object',
              properties: {
                source_type: { type: 'string', enum: ['paper', 'database', 'expert', 'experiment'] },
                url: { type: 'string', format: 'uri' },
                doi: { type: 'string' },
                attribution: { type: 'string' },
                effect_size: { type: 'number' },
                confidence_interval: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
                statistical_power: { type: 'number', minimum: 0, maximum: 1 },
                sample_size: { type: 'number', minimum: 0 },
                quality_score: { type: 'number', minimum: 0, maximum: 1 }
              },
              required: ['source_type', 'attribution', 'quality_score']
            }
          },
          required: ['id', 'label', 'type', 'target_hypothesis', 'confidence', 'metadata']
        }
      },
      typed_edges: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            source: { type: 'string' },
            target: { type: 'string' },
            relationship: { 
              type: 'string', 
              enum: ['supportive', 'contradictory', 'causal', 'temporal', 'correlative'] 
            },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            metadata: {
              type: 'object',
              properties: {
                strength: { type: 'number', minimum: 0, maximum: 1 },
                temporal_order: { type: 'string', enum: ['before', 'after', 'concurrent'] },
                causal_mechanism: { type: 'string' },
                confounders: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          required: ['id', 'source', 'target', 'relationship', 'confidence']
        }
      }
    },
    required: ['evidence_nodes', 'typed_edges'],
    additionalProperties: false
  },

  PruneMergeSet: {
    type: 'object',
    properties: {
      prune_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Node IDs to be removed from graph'
      },
      merge_map: {
        type: 'object',
        patternProperties: {
          "^[a-zA-Z0-9_-]+$": {
            type: 'object',
            properties: {
              target_id: { type: 'string' },
              merge_confidence: { type: 'number', minimum: 0, maximum: 1 },
              semantic_similarity: { type: 'number', minimum: 0, maximum: 1 },
              merge_strategy: { type: 'string', enum: ['average', 'max', 'weighted'] }
            },
            required: ['target_id', 'merge_confidence', 'semantic_similarity']
          }
        }
      },
      rationale: {
        type: 'object',
        properties: {
          pruning_threshold: { type: 'number', minimum: 0, maximum: 1 },
          merge_threshold: { type: 'number', minimum: 0, maximum: 1 },
          nodes_pruned: { type: 'number' },
          nodes_merged: { type: 'number' },
          quality_improvement: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['pruning_threshold', 'merge_threshold', 'nodes_pruned', 'nodes_merged']
      }
    },
    required: ['prune_ids', 'merge_map', 'rationale'],
    additionalProperties: false
  },

  SubgraphSet: {
    type: 'object',
    properties: {
      subgraphs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            node_ids: { type: 'array', items: { type: 'string' } },
            edge_ids: { type: 'array', items: { type: 'string' } },
            centrality_score: { type: 'number', minimum: 0, maximum: 1 },
            impact_score: { type: 'number', minimum: 0, maximum: 1 },
            mutual_information: { type: 'number', minimum: 0 },
            complexity: { type: 'number', minimum: 0, maximum: 1 },
            cohesion: { type: 'number', minimum: 0, maximum: 1 },
            metadata: {
              type: 'object',
              properties: {
                theme: { type: 'string' },
                disciplinary_focus: { type: 'string' },
                confidence_range: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
                export_priority: { type: 'string', enum: ['high', 'medium', 'low'] }
              }
            }
          },
          required: ['id', 'node_ids', 'edge_ids', 'centrality_score', 'impact_score']
        }
      },
      ranking: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subgraph_id: { type: 'string' },
            rank: { type: 'number', minimum: 1 },
            composite_score: { type: 'number', minimum: 0, maximum: 1 },
            ranking_factors: {
              type: 'object',
              properties: {
                centrality_weight: { type: 'number' },
                impact_weight: { type: 'number' },
                mi_weight: { type: 'number' },
                cohesion_weight: { type: 'number' }
              }
            }
          },
          required: ['subgraph_id', 'rank', 'composite_score']
        }
      }
    },
    required: ['subgraphs', 'ranking'],
    additionalProperties: false
  },

  ReportChunks: {
    type: 'object',
    properties: {
      chunks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            html_block: { type: 'string' },
            section_type: { 
              type: 'string', 
              enum: ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion', 'references'] 
            },
            word_count: { type: 'number', minimum: 0 },
            citations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  vancouver_format: { type: 'string' },
                  doi: { type: 'string' },
                  url: { type: 'string', format: 'uri' },
                  citation_type: { type: 'string', enum: ['primary', 'secondary', 'review'] }
                },
                required: ['id', 'vancouver_format']
              }
            },
            figures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  caption: { type: 'string' },
                  figure_type: { type: 'string', enum: ['plot', 'table', 'diagram', 'image'] },
                  data_source: { type: 'string' },
                  svg_content: { type: 'string' }
                },
                required: ['id', 'caption', 'figure_type']
              }
            }
          },
          required: ['id', 'title', 'html_block', 'section_type', 'word_count']
        }
      },
      metadata: {
        type: 'object',
        properties: {
          total_word_count: { type: 'number', minimum: 0 },
          total_citations: { type: 'number', minimum: 0 },
          total_figures: { type: 'number', minimum: 0 },
          vancouver_compliant: { type: 'boolean' },
          readability_score: { type: 'number', minimum: 0, maximum: 100 },
          academic_level: { type: 'string', enum: ['undergraduate', 'graduate', 'professional'] }
        },
        required: ['total_word_count', 'total_citations', 'vancouver_compliant']
      }
    },
    required: ['chunks', 'metadata'],
    additionalProperties: false
  },

  AuditReport: {
    type: 'object',
    properties: {
      audit_results: {
        type: 'object',
        properties: {
          coverage_score: { type: 'number', minimum: 0, maximum: 1 },
          bias_detection: {
            type: 'object',
            properties: {
              selection_bias: { type: 'number', minimum: 0, maximum: 1 },
              confirmation_bias: { type: 'number', minimum: 0, maximum: 1 },
              publication_bias: { type: 'number', minimum: 0, maximum: 1 },
              temporal_bias: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['selection_bias', 'confirmation_bias', 'publication_bias', 'temporal_bias']
          },
          statistical_power: {
            type: 'object',
            properties: {
              overall_power: { type: 'number', minimum: 0, maximum: 1 },
              sample_size_adequacy: { type: 'number', minimum: 0, maximum: 1 },
              effect_size_sensitivity: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['overall_power', 'sample_size_adequacy']
          },
          causality_assessment: {
            type: 'object',
            properties: {
              causal_clarity: { type: 'number', minimum: 0, maximum: 1 },
              confounding_control: { type: 'number', minimum: 0, maximum: 1 },
              temporal_ordering: { type: 'number', minimum: 0, maximum: 1 },
              mechanism_identification: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['causal_clarity', 'confounding_control', 'temporal_ordering']
          }
        },
        required: ['coverage_score', 'bias_detection', 'statistical_power', 'causality_assessment']
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            category: { type: 'string', enum: ['bias', 'power', 'coverage', 'causality', 'methodology'] },
            description: { type: 'string' },
            action_items: { type: 'array', items: { type: 'string' } },
            estimated_impact: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['id', 'priority', 'category', 'description', 'action_items']
        }
      },
      next_actions: {
        type: 'object',
        properties: {
          immediate_actions: { type: 'array', items: { type: 'string' } },
          short_term_goals: { type: 'array', items: { type: 'string' } },
          long_term_objectives: { type: 'array', items: { type: 'string' } },
          resource_requirements: { type: 'array', items: { type: 'string' } }
        },
        required: ['immediate_actions', 'short_term_goals']
      }
    },
    required: ['audit_results', 'recommendations', 'next_actions'],
    additionalProperties: false
  }
};

// Compile all schemas
const compiledSchemas = new Map<string, any>();
Object.entries(STRUCTURED_OUTPUT_SCHEMAS).forEach(([name, schema]) => {
  compiledSchemas.set(name, ajv.compile(schema));
});

/**
 * Validate structured output against schema
 */
export async function validateStructuredOutput(
  data: any, 
  schemaName: string
): Promise<boolean> {
  const validator = compiledSchemas.get(schemaName);
  if (!validator) {
    throw new Error(`Schema ${schemaName} not found`);
  }

  const isValid = validator(data);
  
  if (!isValid) {
    console.error(`Validation failed for schema ${schemaName}:`, validator.errors);
    return false;
  }

  console.log(`✅ Validation passed for schema ${schemaName}`);
  return true;
}

/**
 * Get validation errors for debugging
 */
export function getValidationErrors(data: any, schemaName: string): any[] {
  const validator = compiledSchemas.get(schemaName);
  if (!validator) {
    throw new Error(`Schema ${schemaName} not found`);
  }

  validator(data);
  return validator.errors || [];
}

/**
 * Validate multiple outputs in batch
 */
export async function validateBatchOutputs(
  outputs: Array<{ data: any; schema: string }>
): Promise<{ valid: boolean; errors: any[] }> {
  const errors: any[] = [];
  let allValid = true;

  for (const output of outputs) {
    const isValid = await validateStructuredOutput(output.data, output.schema);
    if (!isValid) {
      allValid = false;
      errors.push({
        schema: output.schema,
        errors: getValidationErrors(output.data, output.schema)
      });
    }
  }

  return { valid: allValid, errors };
}

/**
 * Export schema for external use
 */
export function getSchema(schemaName: string): any {
  return STRUCTURED_OUTPUT_SCHEMAS[schemaName as keyof typeof STRUCTURED_OUTPUT_SCHEMAS];
}

/**
 * List all available schemas
 */
export function listSchemas(): string[] {
  return Object.keys(STRUCTURED_OUTPUT_SCHEMAS);
}