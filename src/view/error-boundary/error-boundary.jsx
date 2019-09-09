// @flow
import React, { type Node } from 'react';
import type { ErrorMode } from '../../types';
import { getFormattedMessage, warning } from '../../dev-warning';

type Props = {|
  mode: ErrorMode,
  children: (setOnError: Function) => Node,
|};

function printFatalError(error: Error) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  // eslint-disable-next-line no-console
  console.error(
    ...getFormattedMessage(
      `
        A fatal error has occurred. Any existing drag will be cancelled.

        > ${error.message}
        `,
    ),
  );
  // eslint-disable-next-line no-console
  console.error('raw', error);
}

// Not the best marker, but using invariant as a signal for when to try to recover from an error
function isInvariant(error: Error): boolean {
  return error.message.indexOf('Invariant failed') !== -1;
}

export default class ErrorBoundary extends React.Component<Props> {
  // eslint-disable-next-line react/sort-comp
  onError: ?() => void;

  componentDidMount() {
    window.addEventListener('error', this.onFatalError);
  }
  componentWillUnmount() {
    window.removeEventListener('error', this.onFatalError);
  }

  componentDidCatch(error: Error) {
    this.onFatalError(error);
    // if it was not an invariant - throw
    if (!isInvariant(error)) {
      throw error;
    }
  }

  setOnError = (fn: () => void) => {
    this.onError = fn;
  };

  onFatalError = (error: Error) => {
    printFatalError(error);

    if (this.onError) {
      this.onError();
    } else {
      warning('Could not find recovering function');
    }

    // If the failure was due to an invariant failure - then we handle the error
    if (this.props.mode === 'RECOVER' && isInvariant(error)) {
      this.setState({});
    }
  };

  render() {
    return this.props.children(this.setOnError);
  }
}
