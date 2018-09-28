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
  DisplacedBy,
  Axis,
  DragImpact,
  Combine,
} from '../../../../src/types';
import {
  curves,
  combine as combineStyle,
} from '../../../../src/view/animation';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';

const preset = getPreset();
const state = getStatePreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);

describe('dropping', () => {
  it('should move to the new home offset', () => {
    const current: DropAnimatingState = state.dropAnimating();
    const selector: Selector = makeMapStateToProps();
    const expected: MapProps = {
      dragging: {
        dimension: preset.inHome1,
        draggingOver: preset.home.descriptor.id,
        forceShouldAnimate: null,
        offset: current.pending.newHomeOffset,
        mode: current.pending.result.mode,
        combineWith: null,
        dropping: {
          duration: current.pending.dropDuration,
          curve: curves.drop,
          moveTo: current.pending.newHomeOffset,
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
    const withoutCombine: DropAnimatingState = state.dropAnimating();
    const axis: Axis = preset.home.axis;
    const willDisplaceForward: boolean = false;
    const displacedBy: DisplacedBy = getDisplacedBy(
      axis,
      preset.inHome1.displaceBy,
      willDisplaceForward,
    );
    const combine: Combine = {
      draggableId: preset.inHome2.descriptor.id,
      droppableId: preset.inHome2.descriptor.droppableId,
    };
    const impact: DragImpact = {
      movement: {
        displaced: [],
        map: {},
        displacedBy,
        willDisplaceForward,
      },
      direction: preset.home.axis.direction,
      destination: null,
      merge: {
        whenEntered: forward,
        combine,
      },
    };
    const withCombine: DropAnimatingState = {
      ...withoutCombine,
      pending: {
        ...withoutCombine.pending,
        impact,
        result: {
          ...withoutCombine.pending.result,
          destination: null,
          combine,
        },
      },
    };

    const selector: Selector = makeMapStateToProps();
    const expected: MapProps = {
      dragging: {
        dimension: preset.inHome1,
        draggingOver: preset.home.descriptor.id,
        forceShouldAnimate: null,
        offset: withCombine.pending.newHomeOffset,
        mode: withCombine.pending.result.mode,
        combineWith: preset.inHome2.descriptor.id,
        dropping: {
          duration: withCombine.pending.dropDuration,
          curve: curves.drop,
          moveTo: withCombine.pending.newHomeOffset,
          scale: combineStyle.scale.drop,
          opacity: combineStyle.opacity.drop,
        },
      },
      secondary: null,
    };

    const whileDropping: MapProps = selector(withCombine, ownProps);

    expect(whileDropping).toEqual(expected);
  });
});
