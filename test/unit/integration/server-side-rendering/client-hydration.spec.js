// @flow
import React from 'react';
import invariant from 'tiny-invariant';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import { resetServerContext } from '../../../../src';
import App from './app';

beforeEach(() => {
  // Reset server context between tests to prevent state being shared between them
  resetServerContext();
});

// Checking that the browser globals are available in this test file
invariant(
  typeof window !== 'undefined' && typeof document !== 'undefined',
  'browser globals not found in jsdom test',
);

it('should support hydrating a server side rendered application', () => {
  // would be done server side
  const serverHTML: string = ReactDOMServer.renderToString(<App />);

  // would be done client side
  // would have a fresh server context on the client
  resetServerContext();
  const el = document.createElement('div');
  el.innerHTML = serverHTML;

  expect(() => ReactDOM.hydrate(<App />, el)).not.toThrow();
});
