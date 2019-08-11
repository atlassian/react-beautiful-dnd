// @flow
import invariant from 'tiny-invariant';
import type {
  DropPendingState,
  DraggingState,
  CollectingState,
} from '../../../../src/types';

import publish from '../../../../src/state/publish-while-dragging';
import getStatePreset from '../../../util/get-simple-state-preset';
import { empty, withScrollables } from './util';

const state = getStatePreset();

it('should do not modify the dimensions when nothing has changed', () => {
  const original: CollectingState = withScrollables(state.collecting());

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published: empty,
  });

  invariant(result.phase === 'DRAGGING');

  // only minor modifications on original
  const expected: DraggingState = {
    phase: 'DRAGGING',
    ...original,
    // appeasing flow
    // eslint-disable-next-line
    phase: 'DRAGGING',
    // we force no animation of the moving item
    forceShouldAnimate: false,
  };
  expect(result).toEqual(expected);
});
