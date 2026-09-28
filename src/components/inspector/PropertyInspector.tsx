import React from 'react';
import { useStore } from '@nanostores/react';
import type { GraphAST, NodeData, EdgeData, TikzStyle } from '../../core/domain/types';
import { getProperty, setProperty } from '../../core/domain/types';

export interface PropertyInspectorProps {
  graphASTStore: any;
  selectedElementsStore: any;
  stylesCatalogStore: any;
  onCommitGraph: (ast: GraphAST) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  graphASTStore,
  selectedElementsStore,
  stylesCatalogStore,
  onCommitGraph,
}) => {
  const graph: GraphAST = useStore(graphASTStore);
  const selected = useStore(selectedElementsStore);
  const catalog = useStore(stylesCatalogStore);

  const selectedNodeId = selected?.nodes?.[0];
  const selectedEdgeId = selected?.edges?.[0];

  const selectedNode = selectedNodeId !== undefined
    ? graph?.nodes?.find((n) => n.id === selectedNodeId || n.name === selectedNodeId)
    : undefined;

  const selectedEdge = selectedEdgeId !== undefined
    ? graph?.edges?.find(
        (e, idx) =>
          e.id === selectedEdgeId ||
          e.id === `e_${selectedEdgeId}` ||
          String(idx) === String(selectedEdgeId)
      )
    : undefined;

  // Node editing handlers
  const handleNodeStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStyle = e.target.value;
    if (!selectedNode || !graph) return;

    const newNodes = graph.nodes.map((n) => {
      if (n.id === selectedNode.id) {
        const data = setProperty(n.data, 'style', newStyle);
        return { ...n, data, style: newStyle };
      }
      return n;
    });

    onCommitGraph({ ...graph, nodes: newNodes });
  };

  const handleNodeLabelChange = (val: string) => {
    if (!selectedNode || !graph) return;

    const newNodes = graph.nodes.map((n) => {
      if (n.id === selectedNode.id) {
        return { ...n, label: val };
      }
      return n;
    });

    onCommitGraph({ ...graph, nodes: newNodes });
  };

  const handleNodePosChange = (axis: 'x' | 'y', val: number) => {
    if (!selectedNode || !graph || isNaN(val)) return;

    const newNodes = graph.nodes.map((n) => {
      if (n.id === selectedNode.id) {
        return {
          ...n,
          position: { ...n.position, [axis]: val },
        };
      }
      return n;
    });

    onCommitGraph({ ...graph, nodes: newNodes });
  };

  // Edge editing handlers
  const handleEdgeDashedToggle = (checked: boolean) => {
    if (!selectedEdge || !graph) return;

    const newEdges = graph.edges.map((ed) => {
      if (ed.id === selectedEdge.id) {
        let data = ed.data.filter((p) => p.key !== 'dashed');
        if (checked) {
          data.push({ key: 'dashed' });
        }
        return { ...ed, data };
      }
      return ed;
    });

    onCommitGraph({ ...graph, edges: newEdges });
  };

  const nodeStyle = selectedNode ? getProperty(selectedNode.data, 'style') || 'none' : 'none';
  const isEdgeDashed = selectedEdge ? selectedEdge.data.some((p) => p.key === 'dashed') : false;

  return (
    <div className="flex flex-col h-full bg-[#161922] p-3 text-xs text-[#94a3b8] overflow-y-auto space-y-4">
      <div className="border-b border-[#2e3446] pb-2">
        <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
          Property Inspector
        </h3>
        <p className="text-[#64748b] text-[11px] mt-0.5">
          Selected Element: {selectedNode
            ? `Node #${selectedNode.name || selectedNode.id} (${nodeStyle})`
            : selectedEdge
            ? `Edge #${selectedEdge.id} (${selectedEdge.sourceId} → ${selectedEdge.targetId})`
            : 'None'}
        </p>
      </div>

      {selectedNode ? (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-[#94a3b8] mb-1 font-medium">Style Preset</label>
            <select
              id="node-style-select"
              value={nodeStyle}
              onChange={handleNodeStyleChange}
              className="w-full bg-[#1f2330] border border-[#2e3446] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {catalog?.styles?.map((s: TikzStyle) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.category || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-[#94a3b8] mb-1 font-medium">X Position</label>
              <input
                type="number"
                value={selectedNode.position.x}
                step={0.25}
                onChange={(e) => handleNodePosChange('x', parseFloat(e.target.value))}
                className="w-full bg-[#1f2330] border border-[#2e3446] rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#94a3b8] mb-1 font-medium">Y Position</label>
              <input
                type="number"
                value={selectedNode.position.y}
                step={0.25}
                onChange={(e) => handleNodePosChange('y', parseFloat(e.target.value))}
                className="w-full bg-[#1f2330] border border-[#2e3446] rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[#94a3b8] mb-1 font-medium">Phase / Label (LaTeX)</label>
            <input
              id="node-label-input"
              type="text"
              value={selectedNode.label || ''}
              onChange={(e) => handleNodeLabelChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNodeLabelChange((e.target as HTMLInputElement).value);
                }
              }}
              placeholder="e.g. \alpha or \pi/2"
              className="w-full bg-[#1f2330] border border-[#2e3446] rounded px-2.5 py-1 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      ) : selectedEdge ? (
        <div className="space-y-3">
          <div>
            <label className="flex items-center space-x-2 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                id="edge-dashed-checkbox"
                checked={isEdgeDashed}
                onChange={(e) => handleEdgeDashedToggle(e.target.checked)}
                className="rounded bg-[#1f2330] border-[#2e3446] text-blue-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px] font-medium">Dashed Line</span>
            </label>
          </div>

          <div className="text-[11px] text-[#64748b]">
            Source: <span className="font-mono text-slate-300">{selectedEdge.sourceId}</span> | Target:{' '}
            <span className="font-mono text-slate-300">{selectedEdge.targetId}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-[#64748b] space-y-1">
          <span className="text-2xl">🔍</span>
          <p className="text-[11px]">Click a node or edge on canvas to inspect and edit properties.</p>
        </div>
      )}
    </div>
  );
};
