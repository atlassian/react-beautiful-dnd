// @flow
import React, { type Node } from 'react';
import { useMemo } from 'use-memo-one';
import type { Responders, ContextId, Sensor } from '../../types';
import ErrorBoundary from '../error-boundary';
import App from './app';

type Props = {|
  ...Responders,
  // we do not technically need any children for this component
  children: Node | null,

  sensors?: Sensor[],
  enableDefaultSensors?: ?boolean,
  dragHandleDescription?: string,
|};

let instanceCount: number = 0;

// Reset any context that gets persisted across server side renders
export function resetServerContext() {
  instanceCount = 0;
}

const DEFAULT_DRAG_HANDLE_DESCRIPTION = `Draggable item. Ensure you're screen reader is not in browse mode and then press spacebar to lift.`;

export default function DragDropContext(props: Props) {
  const contextId: ContextId = useMemo(() => `${instanceCount++}`, []);
  const description =
    props.dragHandleDescription || DEFAULT_DRAG_HANDLE_DESCRIPTION;

  // We need the error boundary to be on the outside of App
  // so that it can catch any errors caused by App
  return (
    <ErrorBoundary>
      {setOnError => (
        <App
          setOnError={setOnError}
          contextId={contextId}
          dragHandleDescription={description}
          {...props}
        >
          {props.children}
        </App>
      )}
    </ErrorBoundary>
  );
}
