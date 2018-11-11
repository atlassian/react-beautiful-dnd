// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import {
  draggingStates,
  withImpact,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import type { Axis, DragImpact, DisplacedBy } from '../../../../src/types';
import getOwnProps from './util/get-own-props';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { origin } from '../../../../src/state/position';

const preset = getPreset();
const ownProps: OwnProps = getOwnProps(preset.inHome2);
const axis: Axis = preset.home.axis;
const willDisplaceForward: boolean = false;
const displacedBy: DisplacedBy = getDisplacedBy(
  axis,
  preset.inHome1.displaceBy,
  willDisplaceForward,
);
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
    combine: {
      draggableId: preset.inHome2.descriptor.id,
      droppableId: preset.inHome2.descriptor.droppableId,
    },
  },
};

draggingStates.forEach((withoutMerge: IsDraggingState) => {
  describe(`in phase: ${withoutMerge.phase}`, () => {
    const withMerge: IsDraggingState = withImpact(withoutMerge, impact);

    it('should indicate that it is a combine target', () => {
      const selector: Selector = makeMapStateToProps();
      const result: MapProps = selector(withMerge, ownProps);

      const expected: MapProps = {
        dragging: null,
        secondary: {
          offset: origin,
          shouldAnimateDisplacement: true,
          combineTargetFor: preset.inHome1.descriptor.id,
        },
      };
      expect(result).toEqual(expected);
    });

    it('should not break memoization on multiple calls with the same impact', () => {
      const selector: Selector = makeMapStateToProps();
      const expected: MapProps = {
        dragging: null,
        secondary: {
          offset: origin,
          shouldAnimateDisplacement: true,
          combineTargetFor: preset.inHome1.descriptor.id,
        },
      };

      const result1: MapProps = selector(withMerge, ownProps);
      const result2: MapProps = selector(
        JSON.parse(JSON.stringify(withMerge)),
        ownProps,
      );

      expect(result1).toEqual(expected);
      expect(result1).toBe(result2);
    });

    it('should break memoization on multiple calls if changing combine', () => {
      const selector: Selector = makeMapStateToProps();

      const result1: MapProps = selector(withMerge, ownProps);
      const result2: MapProps = selector(withoutMerge, ownProps);

      expect(result1).not.toBe(result2);
      expect(result1).not.toEqual(result2);
    });
  });
});
