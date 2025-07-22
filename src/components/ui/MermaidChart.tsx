import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidChartProps {
  chart: string;
  className?: string;
  id?: string;
}

export const MermaidChart: React.FC<MermaidChartProps> = ({ chart, className = '', id }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Mermaid with custom config
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#f1f5f9',
        primaryTextColor: '#1e293b',
        primaryBorderColor: '#cbd5e1',
        lineColor: '#64748b',
        sectionBkColor: '#ffffff',
        altSectionBkColor: '#f8fafc',
        gridColor: '#e2e8f0',
        tertiaryColor: '#f1f5f9',
        // Enhanced font settings
        fontFamily: '"Inter", "Arial", sans-serif',
        fontSize: '18px',
        fontWeight: '700'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 40,
        nodeSpacing: 100,
        rankSpacing: 80,
        fontSize: '18px',
        fontWeight: '700'
      },
      sequence: {
        diagramMarginX: 80,
        diagramMarginY: 20,
        actorMargin: 80,
        width: 250,
        height: 100,
        boxMargin: 20,
        boxTextMargin: 10,
        noteMargin: 20,
        messageMargin: 50,
        fontSize: '18px',
        fontWeight: '700'
      },
      mindmap: {
        padding: 30,
        maxNodeWidth: 400,
        fontSize: '20px',
        fontWeight: '800'
      },
      journey: {
        diagramMarginX: 80,
        diagramMarginY: 20,
        leftMargin: 250,
        width: 250,
        height: 80,
        boxMargin: 20,
        boxTextMargin: 10,
        noteMargin: 20,
        messageMargin: 50,
        bottomMarginAdj: 2,
        fontSize: '18px',
        fontWeight: '700'
      },
      graph: {
        fontSize: '18px',
        fontWeight: '700'
      }
    });

    if (ref.current) {
      const chartId = id || `mermaid-chart-${Math.random().toString(36).substr(2, 9)}`;
      ref.current.innerHTML = `<div class="mermaid" id="${chartId}">${chart}</div>`;
      
      mermaid.run({
        nodes: [ref.current.querySelector('.mermaid')!]
      }).catch(console.error);
    }
  }, [chart, id]);

  return (
    <div 
      ref={ref} 
      className={`mermaid-container ${className}`} 
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '500px',
        width: '100%',
        fontSize: '18px',
        fontWeight: '700'
      }}
    />
  );
};

export default MermaidChart;