// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getOwnProps from './util/get-own-props';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import type { DropAnimatingState } from '../../../../src/types';
import { curves } from '../../../../src/animation';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);

it('should use the impact and not the result for animation', () => {
  const current: DropAnimatingState = state.userCancel();

  // little validation
  expect(current.completed.result.destination).toBe(null);
  expect(current.completed.impact.destination).toBeTruthy();

  const selector: Selector = makeMapStateToProps();
  const expected: MapProps = {
    dragging: {
      dimension: preset.inHome1,
      // even though result is null the impact will provide this information
      draggingOver: preset.home.descriptor.id,
      forceShouldAnimate: null,
      offset: current.newHomeClientOffset,
      mode: current.completed.result.mode,
      combineWith: null,
      dropping: {
        duration: current.dropDuration,
        curve: curves.drop,
        moveTo: current.newHomeClientOffset,
        opacity: null,
        scale: null,
      },
    },
    secondary: null,
  };

  const whileDropping: MapProps = selector(current, ownProps);

  expect(whileDropping).toEqual(expected);
});
