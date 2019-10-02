// @flow
import React, { useRef } from 'react';
import { render } from '@testing-library/react';
import { invariant } from '../../../../../src/invariant';
import App from '../../util/app';
import { simpleLift, keyboard } from '../../util/controls';
import { isDragging } from '../../util/helpers';

it.only('should abort any active drag (rbd error)', () => {
  let hasThrown: boolean = false;
  function CanThrow(props: { shouldThrow: boolean }) {
    if (!hasThrown && props.shouldThrow) {
      hasThrown = true;
      console.log('THROWING');
      invariant(false, 'throwing');
    }
    return null;
  }

  const { rerender, getByTestId } = render(
    <App anotherChild={<CanThrow shouldThrow={false} />} />,
  );
  const handle: HTMLElement = getByTestId('0');

  simpleLift(keyboard, handle);
  expect(isDragging(handle)).toBe(true);

  rerender(<App anotherChild={<CanThrow shouldThrow />} />);

  expect(isDragging(handle)).toBe(false);
});
it('should abort any active drag (non-rbd error)', () => {});

describe('recovery mode', () => {
  it('should recover from rbd errors', () => {});
  it('should not recover from non-rbd errors and rethrow them', () => {});
});

describe('abort mode', () => {
  it('should not recover from rbd errors', () => {});
  it('should not recover from non-rbd errors', () => {});
});
