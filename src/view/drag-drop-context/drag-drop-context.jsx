// @flow
import React, { type Node } from 'react';
import { useMemo } from 'use-memo-one';
import type { Responders, ContextId, Sensor } from '../../types';
import ErrorBoundary from '../error-boundary';
import preset from '../../screen-reader-message-preset';
import App from './app';

type Props = {|
  ...Responders,
  // we do not technically need any children for this component
  children: Node | null,

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

  // We need the error boundary to be on the outside of App
  // so that it can catch any errors caused by App
  return (
    <ErrorBoundary>
      {setOnError => (
        <App
          setOnError={setOnError}
          contextId={contextId}
          liftInstruction={liftInstruction}
          {...props}
        >
          {props.children}
        </App>
      )}
    </ErrorBoundary>
  );
}
