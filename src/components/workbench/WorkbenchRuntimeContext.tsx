import React, { createContext, useContext } from 'react';
import type { WorkbenchRuntime } from '../../services/createWorkbenchRuntime';

const WorkbenchRuntimeContext = createContext<WorkbenchRuntime | null>(null);

export interface WorkbenchRuntimeProviderProps {
  runtime: WorkbenchRuntime;
  children: React.ReactNode;
}

export const WorkbenchRuntimeProvider: React.FC<WorkbenchRuntimeProviderProps> = ({
  runtime,
  children,
}) => {
  return (
    <WorkbenchRuntimeContext.Provider value={runtime}>
      {children}
    </WorkbenchRuntimeContext.Provider>
  );
};

export function useWorkbenchRuntime(): WorkbenchRuntime {
  const runtime = useContext(WorkbenchRuntimeContext);
  if (!runtime) {
    throw new Error('useWorkbenchRuntime must be used within a WorkbenchRuntimeProvider');
  }
  return runtime;
}
