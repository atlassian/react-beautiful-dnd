// @flow
import type {
  DropPendingState,
  DraggingState,
  CollectingState,
} from '../../../../src/types';
import { invariant } from '../../../../src/invariant';
import publish from '../../../../src/state/publish-while-dragging-in-virtual';
import getStatePreset from '../../../util/get-simple-state-preset';
import { empty, withVirtuals } from './util';

const state = getStatePreset();

it('should do not modify the dimensions when nothing has changed', () => {
  const original: CollectingState = withVirtuals(state.collecting());

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
