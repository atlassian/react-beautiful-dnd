// @flow
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import type { Axis, DragImpact, DisplacedBy } from '../../../../src/types';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import { getPreset } from '../../../util/dimension';
import {
  move,
  draggingStates,
  withImpact,
  type IsDraggingState,
} from '../../../util/dragging-state';
import getOwnProps from './util/get-own-props';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import getDisplacedBy from '../../../../src/state/get-displaced-by';
import { getDraggingSnapshot } from './util/get-snapshot';
import { getForcedDisplacement } from '../../../util/impact';

const preset = getPreset();
const ownProps: OwnProps = getOwnProps(preset.inHome1);
const axis: Axis = preset.home.axis;
const displacedBy: DisplacedBy = getDisplacedBy(
  axis,
  preset.inHome1.displaceBy,
);
const impact: DragImpact = {
  displaced: getForcedDisplacement({
    visible: [
      { dimension: preset.inHome2, shouldAnimate: false },
      { dimension: preset.inHome3, shouldAnimate: false },
      { dimension: preset.inHome4, shouldAnimate: false },
    ],
  }),
  displacedBy,
  at: {
    type: 'COMBINE',
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
        mapped: {
          type: 'DRAGGING',
          offset: { x: 1, y: 2 },
          mode: 'FLUID',
          dimension: preset.inHome1,
          // still over home
          draggingOver: preset.home.descriptor.id,
          combineWith: preset.inHome2.descriptor.id,
          dropping: null,
          forceShouldAnimate: null,
          snapshot: getDraggingSnapshot({
            mode: 'FLUID',
            draggingOver: preset.home.descriptor.id,
            combineWith: preset.inHome2.descriptor.id,
            dropping: null,
          }),
        },
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
