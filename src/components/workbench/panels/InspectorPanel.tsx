import React, { useState } from 'react';
import type { IDockviewPanelProps } from 'dockview-react';
import { useWorkbenchRuntime } from '../WorkbenchRuntimeContext';
import {
  $stylesCatalog as defaultStylesCatalog,
  $activeStyle as defaultActiveStyle,
  $graphAST as defaultGraphAST,
  $selectedElements as defaultSelected,
  styleActions,
  graphActions,
} from '../../../stores/workbench';
import { StylePalette } from '../../styles/StylePalette';
import { PropertyInspector } from '../../inspector/PropertyInspector';
import { StyleEditorModal } from '../../styles/StyleEditorModal';
import type { TikzStyle, GraphAST } from '../../../core/domain/types';

export const InspectorPanel: React.FC<IDockviewPanelProps> = () => {
  let runtime: ReturnType<typeof useWorkbenchRuntime> | null = null;
  try {
    runtime = useWorkbenchRuntime();
  } catch {
    // outside provider fallback
  }

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const stylesCatalogStore = runtime ? runtime.stores.$stylesCatalog : defaultStylesCatalog;
  const activeStyleStore = runtime ? runtime.stores.$activeStyle : defaultActiveStyle;
  const graphASTStore = runtime ? runtime.stores.$graphAST : defaultGraphAST;
  const selectedElementsStore = runtime ? runtime.stores.$selectedElements : defaultSelected;

  const handleApplyStyle = (styleName: string) => {
    if (runtime) {
      const sel = runtime.stores.$selectedElements.get();
      if (sel.nodes.length > 0) {
        runtime.ctx.styles.applyStyleToNodes(sel.nodes, styleName);
      }
      if (sel.edges.length > 0) {
        runtime.ctx.styles.applyStyleToEdges(sel.edges, styleName);
      }
    } else {
      styleActions.applyStyleToSelected(styleName);
    }
  };

  const handleSaveStyle = (style: TikzStyle) => {
    if (runtime) {
      runtime.ctx.styles.addStyle(style);
    } else {
      styleActions.addStyle(style);
    }
  };

  const handleCommitGraph = (ast: GraphAST) => {
    if (runtime) {
      runtime.ctx.graph.setAST(ast);
    } else {
      graphActions.setAST(ast);
    }
  };

  return (
    <div
      className="w-full h-full bg-[#161922] flex flex-col divide-y divide-[#2e3446] overflow-hidden"
      data-testid="panel-inspector"
      data-panel="inspector"
    >
      {/* Top half: Style Palette with Categories & Swatches */}
      <div className="h-1/2 flex-shrink-0 overflow-hidden">
        <StylePalette
          stylesCatalogStore={stylesCatalogStore}
          activeStyleStore={activeStyleStore}
          selectedElementsStore={selectedElementsStore}
          onApplyStyle={handleApplyStyle}
          onOpenStyleEditor={() => setIsEditorOpen(true)}
        />
      </div>

      {/* Bottom half: Selected Element Property Inspector */}
      <div className="h-1/2 flex-1 overflow-hidden">
        <PropertyInspector
          graphASTStore={graphASTStore}
          selectedElementsStore={selectedElementsStore}
          stylesCatalogStore={stylesCatalogStore}
          onCommitGraph={handleCommitGraph}
        />
      </div>

      {/* Style Editor Dialog Modal */}
      <StyleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaveStyle={handleSaveStyle}
      />
    </div>
  );
};
