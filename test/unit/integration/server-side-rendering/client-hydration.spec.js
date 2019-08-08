// @flow
import React from 'react';
import invariant from 'tiny-invariant';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import { resetServerContext } from '../../../../src';
import App from '../utils/app';
import { noop } from '../../../../src/empty';

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
  // we need to mock out the warnings caused by useLayoutEffect
  // This will not happen on the client as the string is rendered
  // on the server
  const error = jest.spyOn(console, 'error').mockImplementation(noop);

  const serverHTML: string = ReactDOMServer.renderToString(<App />);

  error.mock.calls.forEach(call => {
    expect(
      call[0].includes('Warning: useLayoutEffect does nothing on the server'),
    ).toBe(true);
  });
  error.mockRestore();

  // would be done client side
  // would have a fresh server context on the client
  resetServerContext();
  const el = document.createElement('div');
  el.innerHTML = serverHTML;

  expect(() => ReactDOM.hydrate(<App />, el)).not.toThrow();
});
