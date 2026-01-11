import { FC, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface Props {
  chart: string;
}

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#9333ea',
    primaryTextColor: '#f3f4f6',
    primaryBorderColor: '#7c3aed',
    lineColor: '#6b7280',
    secondaryColor: '#1f2937',
    tertiaryColor: '#111827',
    background: '#030712',
    mainBkg: '#1f2937',
    secondBkg: '#111827',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px',
    nodeBorder: '#4c1d95',
    clusterBkg: '#1f2937',
    clusterBorder: '#374151',
    edgeLabelBackground: '#1f2937',
    nodeTextColor: '#f3f4f6',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 15,
  },
  sequence: {
    actorMargin: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
  },
});

let diagramId = 0;

export const MermaidDiagram: FC<Props> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [id] = useState(() => `mermaid-${++diagramId}`);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Clean the chart text
        const cleanChart = chart.trim();

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart, id]);

  if (error) {
    return (
      <div className="my-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
        <p className="text-red-400 text-sm">Failed to render diagram: {error}</p>
        <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="my-6 flex justify-center">
      <div
        ref={containerRef}
        className="mermaid-container bg-gray-900/50 rounded-xl p-6 border border-gray-800 overflow-x-auto max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
};
