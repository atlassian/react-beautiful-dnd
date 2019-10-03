// @flow
import React, { type Node } from 'react';
import { useMemo } from 'use-memo-one';
import type { Responders, ContextId, Sensor } from '../../types';
import type { ErrorMode } from './drag-drop-context-types';
import ErrorBoundary from './error-boundary';
import preset from '../../screen-reader-message-preset';
import App from './app';

type Props = {|
  ...Responders,
  nonce?: string,
  // we do not technically need any children for this component
  children: Node | null,

  errorMode?: ErrorMode,
  sensors?: Sensor[],
  enableDefaultSensors?: ?boolean,
  liftInstruction?: string,
|};

let instanceCount: number = 0;

// Reset any context that gets persisted across server side renders
export function resetServerContext() {
  instanceCount = 0;
}

export default function DragDropContext(props: Props) {
  const contextId: ContextId = useMemo(() => `${instanceCount++}`, []);
  const liftInstruction: string =
    props.liftInstruction || preset.liftInstruction;
  const errorMode: ErrorMode = props.errorMode || 'recover';

  // We need the error boundary to be on the outside of App
  // so that it can catch any errors caused by App
  return (
    <ErrorBoundary mode={errorMode}>
      {setCallbacks => (
        <App
          contextId={contextId}
          setCallbacks={setCallbacks}
          liftInstruction={liftInstruction}
          enableDefaultSensors={props.enableDefaultSensors}
          sensors={props.sensors}
          onBeforeDragStart={props.onBeforeDragStart}
          onDragStart={props.onDragStart}
          onDragUpdate={props.onDragUpdate}
          onDragEnd={props.onDragEnd}
        >
          {props.children}
        </App>
      )}
    </ErrorBoundary>
  );
}
