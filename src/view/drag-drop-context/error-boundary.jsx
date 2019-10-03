// @flow
import React, { type Node } from 'react';
import { warning, fatal } from '../../dev-warning';
import { noop } from '../../empty';
import bindEvents from '../event-bindings/bind-events';
import { RbdInvariant } from '../../invariant';
import type { AppCallbacks, ErrorMode } from './drag-drop-context-types';

type Props = {|
  mode: ErrorMode,
  children: (setCallbacks: (callbacks: AppCallbacks) => void) => Node,
|};

export default class ErrorBoundary extends React.Component<Props> {
  callbacks: ?AppCallbacks = null;
  unbind: () => void = noop;

  componentDidMount() {
    this.unbind = bindEvents(window, [
      {
        eventName: 'error',
        fn: this.onWindowError,
      },
    ]);
  }
  componentWillUnmount() {
    this.unbind();
  }

  componentDidCatch(error: Error) {
    // At this point the React tree below the error boundary has been unmounted
    const mode: ErrorMode = this.props.mode;

    console.log('COMPONENT DID CATCH');
    if (error instanceof RbdInvariant) {
      if (process.env.NODE_ENV !== 'production') {
        fatal(error);
      }

      if (mode === 'recover') {
        console.warn('RECOVERING');
        this.setState({});
        return;
      }
    }

    // throwing error for other error boundaries
    // eslint-disable-next-line no-restricted-syntax
    throw error;
  }

  onWindowError = (error: Error) => {
    const callbacks: AppCallbacks = this.getCallbacks();

    if (callbacks.isDragging()) {
      callbacks.tryAbort();
      warning(`
        An error was caught by our window 'error' event listener while a drag was occurring.
        The active drag has been aborted.
      `);
    }

    if (error instanceof RbdInvariant) {
      if (process.env.NODE_ENV !== 'production') {
        fatal(error);
      }
    }
  };

  getCallbacks = (): AppCallbacks => {
    if (!this.callbacks) {
      // eslint-disable-next-line no-restricted-syntax
      throw new Error('Unable to find AppCallbacks in <ErrorBoundary/>');
    }
    return this.callbacks;
  };

  setCallbacks = (callbacks: AppCallbacks) => {
    this.callbacks = callbacks;
  };

  render() {
    return this.props.children(this.setCallbacks);
  }
}
