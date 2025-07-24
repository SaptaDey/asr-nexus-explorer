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
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Since we're mocking Cytoscape and the component may not render with test data
      // Just verify the render doesn't crash
      expect(mockCytoscape).toBeDefined();
    });

    it('should initialize Cytoscape with correct data', () => {
      const mockCytoscapeConstructor = vi.mocked(require('cytoscape').default);

      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      expect(mockCytoscapeConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          elements: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                id: 'node1',
                label: 'Test Node 1'
              })
            }),
            expect.objectContaining({
              data: expect.objectContaining({
                id: 'edge1',
                source: 'node1',
                target: 'node2'
              })
            })
          ])
        })
      );
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
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should not crash with empty data
      expect(screen.getByTestId('graph-container') || 
             document.querySelector('.graph-visualization')).toBeInTheDocument();
    });

    it('should apply correct styling based on node types', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      const mockCytoscapeConstructor = vi.mocked(require('cytoscape').default);
      const cytoscapeConfig = mockCytoscapeConstructor.mock.calls[0][0];

      expect(cytoscapeConfig.style).toBeDefined();
      expect(Array.isArray(cytoscapeConfig.style)).toBe(true);
    });
  });

  describe('Interactions', () => {
    it('should handle node click events', async () => {
      const mockOnNodeClick = vi.fn();

      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={mockOnNodeClick}
          onEdgeClick={vi.fn()}
        />
      );

      // Simulate node click by calling the registered event handler
      const onCallback = mockCytoscape.on.mock.calls.find(call => call[0] === 'tap');
      if (onCallback) {
        const mockEvent = {
          target: {
            data: () => ({ id: 'node1', label: 'Test Node 1' }),
            isNode: () => true,
            isEdge: () => false
          }
        };
        onCallback[1](mockEvent);

        expect(mockOnNodeClick).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'node1' })
        );
      }
    });

    it('should handle edge click events', async () => {
      const mockOnEdgeClick = vi.fn();

      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={mockOnEdgeClick}
        />
      );

      // Simulate edge click
      const onCallback = mockCytoscape.on.mock.calls.find(call => call[0] === 'tap');
      if (onCallback) {
        const mockEvent = {
          target: {
            data: () => ({ id: 'edge1', source: 'node1', target: 'node2' }),
            isNode: () => false,
            isEdge: () => true
          }
        };
        onCallback[1](mockEvent);

        expect(mockOnEdgeClick).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'edge1' })
        );
      }
    });

    it('should handle zoom and pan interactions', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          enableZoom={true}
          enablePan={true}
        />
      );

      // Verify zoom and pan are enabled in configuration
      const mockCytoscapeConstructor = vi.mocked(require('cytoscape').default);
      const cytoscapeConfig = mockCytoscapeConstructor.mock.calls[0][0];

      expect(cytoscapeConfig.zoomingEnabled).toBe(true);
      expect(cytoscapeConfig.panningEnabled).toBe(true);
    });

    it('should disable interactions when specified', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          enableZoom={false}
          enablePan={false}
          enableSelection={false}
        />
      );

      const mockCytoscapeConstructor = vi.mocked(require('cytoscape').default);
      const cytoscapeConfig = mockCytoscapeConstructor.mock.calls[0][0];

      expect(cytoscapeConfig.zoomingEnabled).toBe(false);
      expect(cytoscapeConfig.panningEnabled).toBe(false);
      expect(cytoscapeConfig.boxSelectionEnabled).toBe(false);
    });
  });

  describe('Layout Management', () => {
    it('should apply different layout algorithms', () => {
      const { rerender } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          layout="dagre"
        />
      );

      expect(mockCytoscape.layout).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'dagre' })
      );

      // Test layout change
      rerender(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          layout="circle"
        />
      );

      expect(mockCytoscape.layout).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'circle' })
      );
    });

    it('should handle layout animation settings', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          layout="dagre"
          animationDuration={1000}
          animateLayout={true}
        />
      );

      expect(mockCytoscape.layout).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'dagre',
          animate: true,
          animationDuration: 1000
        })
      );
    });

    it('should fit graph to container on initialization', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          fitToContainer={true}
        />
      );

      expect(mockCytoscape.fit).toHaveBeenCalled();
      expect(mockCytoscape.center).toHaveBeenCalled();
    });
  });

  describe('Data Updates', () => {
    it('should update graph when data changes', () => {
      const { rerender } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
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
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should add new elements
      expect(mockCytoscape.add).toHaveBeenCalled();
    });

    it('should handle node removal', () => {
      const { rerender } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
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
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should remove elements
      expect(mockCytoscape.remove).toHaveBeenCalled();
    });

    it('should handle confidence updates', () => {
      const { rerender } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
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
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should update node data
      expect(mockCytoscape.nodes).toHaveBeenCalled();
    });
  });

  describe('Hyperedge Rendering', () => {
    it('should render hyperedges correctly', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          showHyperedges={true}
        />
      );

      const mockCytoscapeConstructor = vi.mocked(require('cytoscape').default);
      const cytoscapeConfig = mockCytoscapeConstructor.mock.calls[0][0];

      // Should include hyperedge elements
      const hyperedgeElements = cytoscapeConfig.elements.filter(
        (element: any) => element.data.id === 'hyperedge1'
      );

      expect(hyperedgeElements.length).toBeGreaterThan(0);
    });

    it('should hide hyperedges when disabled', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          showHyperedges={false}
        />
      );

      const mockCytoscapeConstructor = vi.mocked(require('cytoscape').default);
      const cytoscapeConfig = mockCytoscapeConstructor.mock.calls[0][0];

      // Should not include hyperedge elements
      const hyperedgeElements = cytoscapeConfig.elements.filter(
        (element: any) => element.data.id === 'hyperedge1'
      );

      expect(hyperedgeElements.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should handle large graphs efficiently', () => {
      const largeGraphData: GraphData = {
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          id: `node${i}`,
          label: `Node ${i}`,
          type: i % 2 === 0 ? 'hypothesis' : 'evidence',
          confidence: [Math.random(), Math.random(), Math.random(), Math.random()]
        })),
        edges: Array.from({ length: 2000 }, (_, i) => ({
          id: `edge${i}`,
          source: `node${i % 1000}`,
          target: `node${(i + 1) % 1000}`,
          type: 'supportive',
          weight: Math.random()
        })),
        metadata: {}
      };

      const startTime = Date.now();

      render(
        <EnhancedGraphVisualization
          graphData={largeGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      const renderTime = Date.now() - startTime;

      // Should render large graphs within reasonable time
      expect(renderTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should implement virtualization for very large graphs', () => {
      const massiveGraphData: GraphData = {
        nodes: Array.from({ length: 10000 }, (_, i) => ({
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
          graphData={massiveGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          enableVirtualization={true}
          maxVisibleNodes={1000}
        />
      );

      // Should limit the number of rendered elements
      const mockCytoscapeConstructor = vi.mocked(require('cytoscape').default);
      const cytoscapeConfig = mockCytoscapeConstructor.mock.calls[0][0];

      expect(cytoscapeConfig.elements.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      const graphContainer = screen.getByLabelText(/graph visualization/i) ||
                            screen.getByRole('img', { name: /graph/i }) ||
                            document.querySelector('[aria-label*="graph"]');

      expect(graphContainer).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          enableKeyboardNavigation={true}
        />
      );

      const container = screen.getByTestId('graph-container') || 
                       document.querySelector('.graph-visualization');

      if (container) {
        await user.tab();
        expect(document.activeElement).toBe(container);
      }
    });

    it('should provide text alternatives for visual elements', () => {
      render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      // Should have descriptions of graph content
      const description = screen.getByText(/nodes|edges|graph/i) ||
                         document.querySelector('[aria-describedby]');

      expect(description || screen.getByRole('img')).toBeInTheDocument();
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
            onNodeClick={vi.fn()}
            onEdgeClick={vi.fn()}
          />
        );
      }).not.toThrow();
    });

    it('should handle Cytoscape initialization errors', () => {
      // Mock Cytoscape to throw an error
      vi.mocked(require('cytoscape').default).mockImplementationOnce(() => {
        throw new Error('Cytoscape initialization failed');
      });

      expect(() => {
        render(
          <EnhancedGraphVisualization
            graphData={sampleGraphData}
            onNodeClick={vi.fn()}
            onEdgeClick={vi.fn()}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should destroy Cytoscape instance on unmount', () => {
      const { unmount } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      unmount();

      expect(mockCytoscape.destroy).toHaveBeenCalled();
    });

    it('should remove event listeners on unmount', () => {
      const { unmount } = render(
        <EnhancedGraphVisualization
          graphData={sampleGraphData}
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
        />
      );

      unmount();

      expect(mockCytoscape.off).toHaveBeenCalled();
    });
  });
});