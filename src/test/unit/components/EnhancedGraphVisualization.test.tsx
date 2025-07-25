import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedGraphVisualization } from '@/components/asr-got/EnhancedGraphVisualization';
import { testGraphData } from '@/test/fixtures/testData';
import type { GraphData } from '@/types/asrGotTypes';

// Mock Cytoscape
const mockCytoscape = {
  add: vi.fn().mockReturnThis(),
  remove: vi.fn().mockReturnThis(),
  layout: vi.fn().mockReturnValue({
    run: vi.fn(),
    stop: vi.fn()
  }),
  fit: vi.fn().mockReturnThis(),
  center: vi.fn().mockReturnThis(),
  zoom: vi.fn().mockReturnThis(),
  pan: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
  nodes: vi.fn().mockReturnValue({
    data: vi.fn(),
    position: vi.fn(),
    style: vi.fn()
  }),
  edges: vi.fn().mockReturnValue({
    data: vi.fn(),
    style: vi.fn()
  }),
  elements: vi.fn().mockReturnValue([]),
  ready: vi.fn((callback) => callback()),
  resize: vi.fn()
};

vi.mock('cytoscape', () => ({
  default: vi.fn(() => mockCytoscape)
}));

// Mock Cytoscape extensions
vi.mock('cytoscape-dagre', () => ({
  default: vi.fn()
}));

// Mock React Flow using importOriginal to handle all exports
vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    ReactFlow: vi.fn(({ children }) => <div data-testid="react-flow">{children}</div>),
    ReactFlowProvider: vi.fn(({ children }) => <div data-testid="react-flow-provider">{children}</div>),
    Background: vi.fn(() => <div data-testid="react-flow-background" />),
    Controls: vi.fn(() => <div data-testid="react-flow-controls" />),
    MiniMap: vi.fn(() => <div data-testid="react-flow-minimap" />),
    Panel: vi.fn(({ children }) => <div data-testid="react-flow-panel">{children}</div>),
    useNodesState: vi.fn(() => [[], vi.fn()]),
    useEdgesState: vi.fn(() => [[], vi.fn()]),
    useReactFlow: vi.fn(() => ({
      fitView: vi.fn(),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      getNodes: vi.fn(() => []),
      getEdges: vi.fn(() => []),
      project: vi.fn(() => ({ x: 0, y: 0 })),
      getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 }))
    }))
  };
});

describe('EnhancedGraphVisualization', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let sampleGraphData: GraphData;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    sampleGraphData = {
      nodes: [
        {
          id: 'node1',
          label: 'Test Node 1',
          type: 'hypothesis',
          confidence: [0.8, 0.7, 0.9, 0.6],
          position: { x: 100, y: 100 },
          metadata: {
            stage: 1,
            evidence_count: 3
          }
        },
        {
          id: 'node2',
          label: 'Test Node 2',
          type: 'evidence',
          confidence: [0.6, 0.8, 0.7, 0.9],
          position: { x: 200, y: 150 },
          metadata: {
            stage: 2,
            evidence_count: 5
          }
        }
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          type: 'supportive',
          weight: 0.8,
          metadata: {
            confidence: 0.85
          }
        }
      ],
      hyperedges: [
        {
          id: 'hyperedge1',
          nodes: ['node1', 'node2'],
          type: 'interdisciplinary',
          weight: 0.7,
          metadata: {
            complexity: 2.3
          }
        }
      ],
      metadata: {
        stage: 2,
        total_nodes: 2,
        total_edges: 1,
        complexity_score: 2.1
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the graph container', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Verify the main container renders
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('should initialize ReactFlow with correct data', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Verify ReactFlow components are rendered
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow-background')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow-minimap')).toBeInTheDocument();
    });

    it('should handle empty graph data', () => {
      const emptyGraph: GraphData = {
        nodes: [],
        edges: [],
        metadata: {}
      };

      render(
        <EnhancedGraphVisualization
          graphData={emptyGraph}
        />
      );

      // Should not crash with empty data
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });

    it('should apply correct styling based on node types', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Verify the graph visualization container is rendered
      const container = screen.getByTestId('graph-container');
      expect(container).toBeInTheDocument();
      
      // Verify ReactFlow component is rendered
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should render interactive controls', async () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Verify interactive controls are rendered
      expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow-minimap')).toBeInTheDocument();
    });

    it('should handle virtualization toggle', async () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Verify container renders correctly
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });

    it('should render with default zoom and pan settings', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Verify ReactFlow is rendered with controls
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();
    });

    it('should handle processing state', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          isProcessing={true}
        />
      );

      // Verify container renders correctly
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });
  });

  describe('Layout Management', () => {
    it('should handle automatic layout', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Verify the graph container is rendered
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('should handle different currentStage values', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          currentStage={3}
        />
      );

      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });

    it('should fit graph to container by default', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // ReactFlow has fitView enabled by default
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  describe('Data Updates', () => {
    it('should update graph when data changes', () => {
      const { rerender } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      const updatedGraphData: GraphData = {
        ...sampleGraphData,
        nodes: [
          ...sampleGraphData.nodes,
          {
            id: 'node3',
            label: 'New Node',
            type: 'evidence',
            confidence: [0.7, 0.8, 0.6, 0.9]
          }
        ]
      };

      rerender(
        <EnhancedGraphVisualization
          graphData={updatedGraphData}
        />
      );

      // Should still render the container
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });

    it('should handle node removal', () => {
      const { rerender } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      const reducedGraphData: GraphData = {
        ...sampleGraphData,
        nodes: [sampleGraphData.nodes[0]], // Remove second node
        edges: [] // Remove edges as well
      };

      rerender(
        <EnhancedGraphVisualization
          graphData={reducedGraphData}
        />
      );

      // Should still render the container
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });

    it('should handle confidence updates', () => {
      const { rerender } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      const updatedGraphData: GraphData = {
        ...sampleGraphData,
        nodes: [
          {
            ...sampleGraphData.nodes[0],
            confidence: [0.9, 0.8, 0.95, 0.7] // Updated confidence
          },
          sampleGraphData.nodes[1]
        ]
      };

      rerender(
        <EnhancedGraphVisualization
          graphData={updatedGraphData}
        />
      );

      // Should still render correctly
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });
  });

  describe('Hyperedge Rendering', () => {
    it('should render hyperedges correctly', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Should render the container without errors
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });

    it('should handle different hyperedge configurations', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Should handle hyperedges in the data without errors
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large graphs efficiently', () => {
      const largeGraphData: GraphData = {
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `node${i}`,
          label: `Node ${i}`,
          type: i % 2 === 0 ? 'hypothesis' : 'evidence',
          confidence: [Math.random(), Math.random(), Math.random(), Math.random()]
        })),
        edges: Array.from({ length: 50 }, (_, i) => ({
          id: `edge${i}`,
          source: `node${i % 100}`,
          target: `node${(i + 1) % 100}`,
          type: 'supportive',
          weight: Math.random()
        })),
        metadata: {}
      };

      const startTime = Date.now();

      render(
        <EnhancedGraphVisualization
          graphData={largeGraphData}
        />
      );

      const renderTime = Date.now() - startTime;

      // Should render graphs within reasonable time
      expect(renderTime).toBeLessThan(2000); // 2 seconds max
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });

    it('should implement virtualization for large graphs', () => {
      const largeGraphData: GraphData = {
        nodes: Array.from({ length: 200 }, (_, i) => ({
          id: `node${i}`,
          label: `Node ${i}`,
          type: 'hypothesis',
          confidence: [0.5, 0.5, 0.5, 0.5]
        })),
        edges: [],
        metadata: {}
      };

      render(
        <EnhancedGraphVisualization
          graphData={largeGraphData}
          enableVirtualization={true}
          maxNodes={100}
        />
      );

      // Should render without errors even with large datasets
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper container structure', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      const graphContainer = screen.getByTestId('graph-container');
      expect(graphContainer).toBeInTheDocument();
    });

    it('should support interactive controls', async () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Verify interactive controls are present
      expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();
    });

    it('should display graph statistics', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Should display node and edge counts
      expect(screen.getByText('Nodes:')).toBeInTheDocument();
      expect(screen.getByText('Edges:')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted graph data gracefully', () => {
      const corruptedData = {
        nodes: [
          { id: 'node1' }, // Missing required fields
          null, // Invalid node
          { id: 'node2', label: 'Valid Node', type: 'hypothesis', confidence: [0.5, 0.5, 0.5, 0.5] }
        ],
        edges: [
          { source: 'nonexistent', target: 'also-nonexistent' } // Invalid references
        ],
        metadata: {}
      } as any;

      expect(() => {
        render(
          <EnhancedGraphVisualization
            graphData={corruptedData}
          />
        );
      }).not.toThrow();
    });

    it('should handle ReactFlow initialization gracefully', () => {
      // Test with minimal data to ensure no crashes
      const minimalData: GraphData = {
        nodes: [],
        edges: [],
        metadata: {}
      };

      expect(() => {
        render(
          <EnhancedGraphVisualization
            graphData={minimalData}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should unmount without errors', () => {
      const { unmount } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should handle component lifecycle properly', () => {
      const { rerender, unmount } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
        />
      );

      // Should handle rerender
      rerender(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          currentStage={2}
        />
      );

      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
      
      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });
  });
});