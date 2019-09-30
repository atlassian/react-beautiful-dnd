// @flow
import React, { type Node } from 'react';
import { warning } from '../../dev-warning';
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
    const callbacks: AppCallbacks = this.getCallbacks();
    const mode: ErrorMode = this.props.mode;

    if (callbacks.isDragging()) {
      warning(`
        An error was thrown in the React tree while a drag was occurring.
        The active drag has been aborted.
      `);
      callbacks.tryAbort();
    }

    if (mode === 'recover' && error instanceof RbdInvariant) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('rbd error', error);
      }
      this.setState({});
    }

    // 1. mode === 'recover' and not an RbdInvariant
    // 2. mode === 'abort'
    throw error;
  }

  onWindowError = () => {
    const callbacks: AppCallbacks = this.getCallbacks();

    if (callbacks.isDragging()) {
      warning(`
        An error was caught by our window 'error' event listener while a drag was occurring.
        The active drag has been aborted.
      `);
      callbacks.tryAbort();
    }
  };

  getCallbacks = (): AppCallbacks => {
    if (!this.callbacks) {
      throw new Error('Unable to find AppCallbacks in ErrorBoundary');
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
