// @flow

import invariant from 'tiny-invariant';
import getStatePreset from '../../../util/get-simple-state-preset';
import type { DropPendingState, DraggingState } from '../../../../src/types';
import publish from '../../../../src/state/publish-while-dragging';
import { empty } from './util';

const state = getStatePreset();

it('should move to the DRAGGING phase if was in the COLLECTING phase', () => {
  const result: DraggingState | DropPendingState = publish({
    state: state.collecting(),
    published: empty,
  });

  expect(result.phase).toBe('DRAGGING');
});

it('should move into a non-waiting DROP_PENDING phase if was in a DROP_PENDING phase', () => {
  const result: DraggingState | DropPendingState = publish({
    state: state.dropPending(),
    published: empty,
  });

  expect(result.phase).toBe('DROP_PENDING');
  invariant(result.phase === 'DROP_PENDING');
  expect(result.reason).toBe(state.dropPending().reason);
});
