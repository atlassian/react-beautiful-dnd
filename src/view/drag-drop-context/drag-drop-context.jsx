// @flow
import React, { type Node } from 'react';
import { useMemo } from 'use-memo-one';
import type { Responders, ContextId, Sensor } from '../../types';
import ErrorBoundary from './error-boundary';
import preset from '../../screen-reader-message-preset';
import App from './app';

type Props = {|
  ...Responders,
  // We do not technically need any children for this component
  children: Node | null,
  // Read out by screen readers when focusing on a drag handle
  liftInstruction?: string,
  // Used for strict content security policies
  // See our [content security policy guide](/docs/guides/content-security-policy.md)
  nonce?: string,
  // See our [sensor api](/docs/sensors/sensor-api.md)
  sensors?: Sensor[],
  enableDefaultSensors?: ?boolean,
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

  // We need the error boundary to be on the outside of App
  // so that it can catch any errors caused by App
  return (
    <ErrorBoundary>
      {setCallbacks => (
        <App
          nonce={props.nonce}
          contextId={contextId}
          setCallbacks={setCallbacks}
          liftInstruction={liftInstruction}
          enableDefaultSensors={props.enableDefaultSensors}
          sensors={props.sensors}
          onBeforeCapture={props.onBeforeCapture}
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
