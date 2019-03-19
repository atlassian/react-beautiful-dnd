// @flow
import React, { type Node } from 'react';
import { getFormattedMessage } from '../../dev-warning';

type Props = {|
  onError: () => void,
  children: Node | null,
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
  componentDidCatch(error: Error) {
    printFatalError(error);
    this.props.onError();

    // If the failure was due to an invariant failure - then we handle the error
    if (error.message.indexOf('Invariant failed') !== -1) {
      this.setState({});
      return;
    }

    // Error is more serious and we throw it
    throw error;
  }

  render() {
    return this.props.children;
  }
}
