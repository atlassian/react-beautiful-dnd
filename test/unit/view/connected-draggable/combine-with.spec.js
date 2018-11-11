// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import {
  move,
  draggingStates,
  withImpact,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import type { Axis, DragImpact, DisplacedBy } from '../../../../src/types';
import getOwnProps from './util/get-own-props';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import getDisplacedBy from '../../../../src/state/get-displaced-by';

const preset = getPreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);
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

    it('should move the dragging item to the current offset and update combineWith', () => {
      const selector: Selector = makeMapStateToProps();
      const result: MapProps = selector(
        move(withMerge, { x: 1, y: 2 }),
        ownProps,
      );

      const expected: MapProps = {
        dragging: {
          offset: { x: 1, y: 2 },
          mode: 'FLUID',
          dimension: preset.inHome1,
          // still over home
          draggingOver: preset.home.descriptor.id,
          combineWith: preset.inHome2.descriptor.id,
          dropping: null,
          forceShouldAnimate: null,
        },
        secondary: null,
      };

      expect(result).toEqual(expected);
    });

    it('should not break memoization on multiple calls to the same offset', () => {
      const selector: Selector = makeMapStateToProps();

      const result1: MapProps = selector(
        move(withMerge, { x: 1, y: 2 }),
        ownProps,
      );
      const newReference: IsDraggingState = {
        phase: 'DRAGGING',
        ...withMerge,
        // eslint-disable-next-line
        phase: withMerge.phase,
      };
      const result2: MapProps = selector(
        move(newReference, { x: 1, y: 2 }),
        ownProps,
      );

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
