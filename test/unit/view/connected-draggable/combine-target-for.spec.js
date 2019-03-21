// @flow
import type { DragImpact } from '../../../../src/types';
import type {
  Selector,
  OwnProps,
  MapProps,
} from '../../../../src/view/draggable/draggable-types';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import { makeMapStateToProps } from '../../../../src/view/draggable/connected-draggable';
import { getPreset } from '../../../utils/dimension';
import {
  draggingStates,
  withImpact,
  type IsDraggingState,
} from '../../../utils/dragging-state';
import getOwnProps from './util/get-own-props';
import { getSecondarySnapshot } from './util/get-snapshot';

const preset = getPreset();
const ownProps: OwnProps = getOwnProps(preset.inHome2);

draggingStates.forEach((withoutMerge: IsDraggingState) => {
  describe(`in phase: ${withoutMerge.phase}`, () => {
    const impact: DragImpact = {
      ...withoutMerge.impact,
      destination: null,
      merge: {
        whenEntered: forward,
        combine: {
          draggableId: preset.inHome2.descriptor.id,
          droppableId: preset.inHome2.descriptor.droppableId,
        },
      },
    };

    const withMerge: IsDraggingState = withImpact(withoutMerge, impact);

    it('should indicate that it is a combine target', () => {
      const selector: Selector = makeMapStateToProps();
      const result: MapProps = selector(withMerge, ownProps);

      const expected: MapProps = {
        mapped: {
          type: 'SECONDARY',
          offset: impact.movement.displacedBy.point,
          shouldAnimateDisplacement: false,
          combineTargetFor: preset.inHome1.descriptor.id,
          snapshot: getSecondarySnapshot({
            combineTargetFor: preset.inHome1.descriptor.id,
          }),
        },
      };
      expect(result).toEqual(expected);
    });

    it('should not break memoization on multiple calls with the same impact', () => {
      const selector: Selector = makeMapStateToProps();
      const expected: MapProps = {
        mapped: {
          type: 'SECONDARY',
          offset: impact.movement.displacedBy.point,
          shouldAnimateDisplacement: false,
          combineTargetFor: preset.inHome1.descriptor.id,
          snapshot: getSecondarySnapshot({
            combineTargetFor: preset.inHome1.descriptor.id,
          }),
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
