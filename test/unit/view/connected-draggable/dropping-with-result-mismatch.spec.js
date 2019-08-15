// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../util/dimension';
import getStatePreset from '../../../util/get-simple-state-preset';
import getOwnProps from './util/get-own-props';
import type {
  Selector,
  OwnProps,
  MapProps,
  DropAnimation,
} from '../../../../src/view/draggable/draggable-types';
import type { DropAnimatingState } from '../../../../src/types';
import { curves } from '../../../../src/animation';
import { getDraggingSnapshot } from './util/get-snapshot';
import { tryGetDestination } from '../../../../src/state/get-impact-location';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);

it('should use result for providing data and not the impact', () => {
  const current: DropAnimatingState = state.userCancel();

  // little validation: the result is null, but the impact has a destination
  expect(current.completed.result.destination).toBe(null);
  expect(tryGetDestination(current.completed.impact)).toBeTruthy();

  const selector: Selector = makeMapStateToProps();

  const dropping: DropAnimation = {
    duration: current.dropDuration,
    curve: curves.drop,
    moveTo: current.newHomeClientOffset,
    opacity: null,
    scale: null,
  };

  const expected: MapProps = {
    mapped: {
      type: 'DRAGGING',
      dimension: preset.inHome1,
      // using result
      draggingOver: null,
      forceShouldAnimate: null,
      offset: current.newHomeClientOffset,
      mode: current.completed.result.mode,
      combineWith: null,
      dropping,
      snapshot: getDraggingSnapshot({
        descriptor: preset.inHome1.descriptor,
        mode: current.completed.result.mode,
        // using result
        draggingOver: null,
        combineWith: null,
        dropping,
      }),
    },
  };

  const whileDropping: MapProps = selector(current, ownProps);

  expect(whileDropping).toEqual(expected);
});
