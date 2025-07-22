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
        primaryTextColor: '#334155',
        primaryBorderColor: '#cbd5e1',
        lineColor: '#64748b',
        sectionBkColor: '#ffffff',
        altSectionBkColor: '#f8fafc',
        gridColor: '#e2e8f0',
        tertiaryColor: '#f1f5f9'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 20
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35
      },
      mindmap: {
        padding: 10,
        maxNodeWidth: 200
      },
      journey: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        leftMargin: 150,
        width: 150,
        height: 50,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        bottomMarginAdj: 1
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
        minHeight: '200px'
      }}
    />
  );
};

export default MermaidChart;