// @flow
import React, { type Node } from 'react';
import { getFormattedMessage, warning } from '../../dev-warning';

type Props = {|
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
        An error has occurred while a drag is occurring.
        Any existing drag will be cancelled.

        > ${error.message}
        `,
    ),
  );
  // eslint-disable-next-line no-console
  console.error('raw', error);
}

export default class ErrorBoundary extends React.Component<Props> {
  // eslint-disable-next-line react/sort-comp
  recover: ?() => void;

  componentDidMount() {
    window.addEventListener('error', this.onFatalError);
  }
  componentWillUnmount() {
    window.removeEventListener('error', this.onFatalError);
  }

  setOnError = (onError: () => void) => {
    this.recover = onError;
  };

  onFatalError = (error: Error) => {
    printFatalError(error);

    if (this.recover) {
      this.recover();
    } else {
      warning('Could not find recovering function');
    }

    // If the failure was due to an invariant failure - then we handle the error
    if (error.message.indexOf('Invariant failed') !== -1) {
      this.setState({});
      return;
    }

    // Error is more serious and we throw it
    throw error;
  };

  componentDidCatch(error: Error) {
    this.onFatalError(error);
  }

  render() {
    return this.props.children(this.setOnError);
  }
}
