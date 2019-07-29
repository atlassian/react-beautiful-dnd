// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getOwnProps from './util/get-own-props';
import type {
  Selector,
  OwnProps,
  MapProps,
  DropAnimation,
} from '../../../../src/view/draggable/draggable-types';
import type {
  DropAnimatingState,
  DragImpact,
  Combine,
} from '../../../../src/types';
import { curves, combine as combineStyle } from '../../../../src/animation';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import getLiftEffect from '../../../../src/state/get-lift-effect';
import { getDraggingSnapshot } from './util/get-snapshot';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);

it('should move to the new home offset', () => {
  const current: DropAnimatingState = state.dropAnimating();
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
      draggingOver: preset.home.descriptor.id,
      forceShouldAnimate: null,
      offset: current.newHomeClientOffset,
      mode: current.completed.result.mode,
      combineWith: null,
      dropping,
      snapshot: getDraggingSnapshot({
        draggingOver: preset.home.descriptor.id,
        mode: current.completed.result.mode,
        combineWith: null,
        dropping,
      }),
    },
  };

  const whileDropping: MapProps = selector(current, ownProps);

  expect(whileDropping).toEqual(expected);
});

it('should maintain combine information', () => {
  const { afterCritical, impact: homeImpact } = getLiftEffect({
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
    at: {
      type: 'COMBINE',
      whenEntered: forward,
      combine,
    },
  };
  const withoutCombine: DropAnimatingState = state.dropAnimating();
  const withCombine: DropAnimatingState = {
    ...withoutCombine,
    completed: {
      critical: withoutCombine.completed.critical,
      afterCritical,
      impact,
      result: {
        ...withoutCombine.completed.result,
        destination: null,
        combine,
      },
    },
  };

  const selector: Selector = makeMapStateToProps();
  const dropping: DropAnimation = {
    duration: withCombine.dropDuration,
    curve: curves.drop,
    moveTo: withCombine.newHomeClientOffset,
    scale: combineStyle.scale.drop,
    opacity: combineStyle.opacity.drop,
  };
  const expected: MapProps = {
    mapped: {
      type: 'DRAGGING',
      dimension: preset.inHome1,
      draggingOver: preset.home.descriptor.id,
      forceShouldAnimate: null,
      offset: withCombine.newHomeClientOffset,
      mode: withCombine.completed.result.mode,
      combineWith: preset.inHome2.descriptor.id,
      dropping,
      snapshot: getDraggingSnapshot({
        mode: withCombine.completed.result.mode,
        combineWith: preset.inHome2.descriptor.id,
        dropping,
        draggingOver: preset.home.descriptor.id,
      }),
    },
  };

  const whileDropping: MapProps = selector(withCombine, ownProps);

  expect(whileDropping).toEqual(expected);
});
