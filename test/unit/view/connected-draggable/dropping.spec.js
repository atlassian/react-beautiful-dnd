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
import type {
  DropAnimatingState,
  DragImpact,
  Combine,
} from '../../../../src/types';
import { curves, combine as combineStyle } from '../../../../src/animation';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import getHomeOnLift from '../../../../src/state/get-home-on-lift';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);

it('should move to the new home offset', () => {
  const current: DropAnimatingState = state.dropAnimating();
  const selector: Selector = makeMapStateToProps();
  const expected: MapProps = {
    dragging: {
      dimension: preset.inHome1,
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

it('should maintain combine information', () => {
  const { impact: homeImpact } = getHomeOnLift({
    draggable: preset.inHome1,
    home: preset.home,
    draggables: preset.draggables,
    viewport: preset.viewport,
  });
  const combine: Combine = {
    draggableId: preset.inHome2.descriptor.id,
    droppableId: preset.inHome2.descriptor.droppableId,
  };
  const impact: DragImpact = {
    ...homeImpact,
    destination: null,
    merge: {
      whenEntered: forward,
      combine,
    },
  };
  const withoutCombine: DropAnimatingState = state.dropAnimating();
  const withCombine: DropAnimatingState = {
    ...withoutCombine,
    completed: {
      ...withoutCombine.completed,
      impact,
    },
  };

  const selector: Selector = makeMapStateToProps();
  const expected: MapProps = {
    dragging: {
      dimension: preset.inHome1,
      draggingOver: preset.home.descriptor.id,
      forceShouldAnimate: null,
      offset: withCombine.newHomeClientOffset,
      mode: withCombine.completed.result.mode,
      combineWith: preset.inHome2.descriptor.id,
      dropping: {
        duration: withCombine.dropDuration,
        curve: curves.drop,
        moveTo: withCombine.newHomeClientOffset,
        scale: combineStyle.scale.drop,
        opacity: combineStyle.opacity.drop,
      },
    },
    secondary: null,
  };

  const whileDropping: MapProps = selector(withCombine, ownProps);

  expect(whileDropping).toEqual(expected);
});
