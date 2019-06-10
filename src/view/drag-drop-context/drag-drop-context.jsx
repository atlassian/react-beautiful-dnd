// @flow
import React, { type Node } from 'react';
import { useMemo } from 'use-memo-one';
import type { Responders } from '../../types';
import ErrorBoundary from '../error-boundary';
import App from './app';

type Props = {|
  ...Responders,
  nonce?: string,
  // we do not technically need any children for this component
  children: Node | null,
|};

let instanceCount: number = 0;

// Reset any context that gets persisted across server side renders
export function resetServerContext() {
  instanceCount = 0;
}

export default function DragDropContext(props: Props) {
  const uniqueId: number = useMemo(() => instanceCount++, []);

  // We need the error boundary to be on the outside of App
  // so that it can catch any errors caused by App
  return (
    <ErrorBoundary>
      {setOnError => (
        <App setOnError={setOnError} uniqueId={uniqueId} {...props}>
          {props.children}
        </App>
      )}
    </ErrorBoundary>
  );
}
