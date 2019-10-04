// @flow
import React from 'react';
import { render } from '@testing-library/react';
import { RbdInvariant } from '../../../../../src/invariant';
import App from '../../util/app';
import { simpleLift, keyboard } from '../../util/controls';
import { isDragging } from '../../util/helpers';
import { withError, withWarn, withoutError } from '../../../../util/console';

// Lame that this is not in flow

it('should abort any active drag (rbd error)', () => {
  const { getByTestId } = render(<App />);

  simpleLift(keyboard, getByTestId('0'));
  expect(isDragging(getByTestId('0'))).toBe(true);

  withWarn(() => {
    withError(() => {
      window.dispatchEvent(
        new window.ErrorEvent('error', {
          error: new RbdInvariant('my invariant'),
        }),
      );
    });
  });

  expect(isDragging(getByTestId('0'))).toBe(false);
});

it('should abort any active drag (non-rbd error)', () => {
  const { getByTestId } = render(<App />);
  simpleLift(keyboard, getByTestId('0'));
  expect(isDragging(getByTestId('0'))).toBe(true);

  // not logging the raw error
  withoutError(() => {
    // logging that the drag was aborted
    withWarn(() => {
      window.dispatchEvent(
        new window.ErrorEvent('error', {
          error: new Error('non-rbd'),
        }),
      );
    });
  });

  expect(isDragging(getByTestId('0'))).toBe(false);
});
