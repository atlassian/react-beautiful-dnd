// @flow
import React, { type Node } from 'react';
import type { Responders } from '../../types';
import ErrorBoundary from '../error-boundary';
import App from './app';
import useMemoOne from '../use-custom-memo/use-memo-one';

type Props = {|
  ...Responders,
  // we do not technically need any children for this component
  children: Node | null,
|};

let instanceCount: number = 0;

// Reset any context that gets persisted across server side renders
export function resetServerContext() {
  instanceCount = 0;
}

export default function DragDropContext(props: Props) {
  const uniqueId: number = useMemoOne(() => instanceCount++, []);
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
