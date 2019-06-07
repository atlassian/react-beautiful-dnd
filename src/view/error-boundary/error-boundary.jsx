// @flow
import React, { type Node } from 'react';
import { getFormattedMessage, warning } from '../../dev-warning';
import {
  clearErrorMap,
  hasLoggedError,
  setError,
} from '../../utilities/handle-errors';

const BEAUTIFUL_DND_ERROR = 'BEAUTIFUL_DND_ERROR';

type Props = {|
  children: (setOnError: Function) => Node,
|};

type Error = {
  message: string,
  filename?: string,
  type?: string,
};

function printFatalError(message: string) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  // eslint-disable-next-line no-console
  console.error(
    ...getFormattedMessage(
      `
        An error has occurred while a drag is occurring.
        Any existing drag will be cancelled.

        > ${message}
        `,
    ),
  );
}

// Not the best marker, but using invariant as a signal for when to try to recover from an error
function shouldRecover(error: Error): boolean {
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
    clearErrorMap();
  }

  setOnError = (fn: () => void) => {
    this.onError = fn;
  };

  onFatalError = (error: Error) => {
    const { message = '', filename = '', type = '' } = error;
    const errorKey = `${filename}-${message}`;
    if (!type || type !== BEAUTIFUL_DND_ERROR || hasLoggedError(errorKey)) {
      return;
    }
    setError(errorKey);
    printFatalError(message);

    if (this.onError) {
      this.onError();
    } else {
      warning('Could not find recovering function');
    }

    // If the failure was due to an invariant failure - then we handle the error
    if (shouldRecover(error)) {
      this.setState({});
    }
  };

  componentDidCatch(error: Error) {
    // explicitly report type to only capture our errors
    error.type = BEAUTIFUL_DND_ERROR;
    this.onFatalError(error);
    // if it was not an invariant - throw
    if (!shouldRecover(error)) {
      throw error;
    }
  }

  render() {
    return this.props.children(this.setOnError);
  }
}
