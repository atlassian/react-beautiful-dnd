// @flow
import React, { type Node } from 'react';
import { useMemo } from 'use-memo-one';
import type { Responders, ContextId, Sensor, ErrorMode } from '../../types';
import ErrorBoundary from '../error-boundary';
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
  const errorMode: ErrorMode = props.errorMode || 'RECOVER';

  // We need the error boundary to be on the outside of App
  // so that it can catch any errors caused by App
  return (
    <ErrorBoundary mode={errorMode}>
      {setOnError => (
        // $FlowFixMe: errorMode prop
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
