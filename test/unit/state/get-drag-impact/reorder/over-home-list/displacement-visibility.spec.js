// @flow
import getDragImpact from '../../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../../src/state/no-impact';
import { vertical, horizontal } from '../../../../../../src/state/axis';
import getDisplacedBy from '../../../../../../src/state/get-displaced-by';
import type {
  Axis,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  Viewport,
  DisplacedBy,
} from '../../../../../../src/types';
import { backward } from '../../../../../../src/state/user-direction/user-direction-preset';
import {
  getDroppableDimension,
  getDraggableDimension,
} from '../../../../../utils/dimension';
import getViewport from '../../../../../../src/view/window/get-viewport';
import getLiftEffect from '../../../../../../src/state/get-lift-effect';
import { getForcedDisplacement } from '../../../../../utils/impact';
import noAfterCritical from '../../../../../utils/no-after-critical';

const viewport: Viewport = getViewport();

// this is just an application of get-displacement.spec

[vertical /* , horizontal */].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const crossAxisStart: number = 0;
    const crossAxisEnd: number = 100;

    it('should indicate when a displacement is not visible due to being outside of the droppable frame', () => {
      const droppable: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'my-custom-droppable',
          type: 'TYPE',
          mode: 'STANDARD',
        },
        direction: axis.direction,
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: 0,
          // will be cut by the frame
          [axis.end]: 200,
        },
        closest: {
          borderBox: {
            [axis.crossAxisStart]: crossAxisStart,
            [axis.crossAxisEnd]: crossAxisEnd,
            [axis.start]: 0,
            // will cut the subject,
            [axis.end]: 100,
          },
          scrollSize: {
            scrollWidth: 100,
            scrollHeight: 100,
          },
          scroll: { x: 0, y: 0 },
          shouldClipSubject: true,
        },
      });
      const visible: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'visible',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 0,
        },
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: 0,
          [axis.end]: 90,
        },
      });
      const partialVisible: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'partial-visible',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 1,
        },
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          // partially in frame
          [axis.start]: 90,
          [axis.end]: 120,
        },
      });
      const notVisible1: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'not-visible-1',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 2,
        },
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          // inside the frame, but not in the visible area
          [axis.start]: 130,
          [axis.end]: 140,
        },
      });
      const notVisible2: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'not-visible-2',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 3,
        },
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          // inside the frame, but not in the visible area
          [axis.start]: 150,
          [axis.end]: 170,
        },
      });
      const customDraggables: DraggableDimensionMap = {
        [visible.descriptor.id]: visible,
        [partialVisible.descriptor.id]: partialVisible,
        [notVisible1.descriptor.id]: notVisible1,
        [notVisible2.descriptor.id]: notVisible2,
      };
      const customDroppables: DroppableDimensionMap = {
        [droppable.descriptor.id]: droppable,
      };
      // dragging notVisible2 backwards into first position
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        notVisible2.displaceBy,
      );
      const expected: DragImpact = {
        displaced: getForcedDisplacement({
          visible: [
            {
              dimension: visible,
              shouldAnimate: true,
            },
            {
              dimension: partialVisible,
              shouldAnimate: true,
            },
          ],
          invisible: [notVisible1],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            droppableId: droppable.descriptor.id,
            index: 0,
          },
        },
      };

      const { afterCritical, impact: homeImpact } = getLiftEffect({
        draggable: notVisible2,
        home: droppable,
        draggables: customDraggables,
        viewport,
      });
      const impact: DragImpact = getDragImpact({
        // moving backwards to near the start of the droppable
        pageBorderBoxCenter: { x: 1, y: 1 },
        draggable: notVisible2,
        draggables: customDraggables,
        droppables: customDroppables,
        previousImpact: homeImpact,
        viewport,
        userDirection: backward,
        afterCritical,
      });

      expect(impact).toEqual(expected);
    });

    it('should indicate when a displacement is not visible due to being outside of the viewport', () => {
      const droppable: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'my-custom-droppable',
          type: 'TYPE',
          mode: 'STANDARD',
        },
        direction: axis.direction,
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: 0,
          [axis.end]: viewport.frame[axis.end] + 100,
        },
      });
      const visible: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'visible',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 0,
        },
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: 0,
          [axis.end]: viewport.frame[axis.end] - 20,
        },
      });
      const partialVisible: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'partial-visible',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 1,
        },
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: viewport.frame[axis.end] - 20,
          [axis.end]: viewport.frame[axis.end] + 10,
        },
      });
      const notVisible1: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'not-visible-1',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 2,
        },
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          // inside the droppable, but not in the visible area
          [axis.start]: viewport.frame[axis.end] + 10,
          [axis.end]: viewport.frame[axis.end] + 20,
        },
      });
      const notVisible2: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'not-visible-2',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 3,
        },
        borderBox: {
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          // inside the droppable, but not in the visible area
          [axis.start]: viewport.frame[axis.end] + 30,
          [axis.end]: viewport.frame[axis.end] + 40,
        },
      });
      const customDraggables: DraggableDimensionMap = {
        [visible.descriptor.id]: visible,
        [partialVisible.descriptor.id]: partialVisible,
        [notVisible1.descriptor.id]: notVisible1,
        [notVisible2.descriptor.id]: notVisible2,
      };
      const customDroppables: DroppableDimensionMap = {
        [droppable.descriptor.id]: droppable,
      };
      // dragging notVisible2 backwards into first position
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        notVisible2.displaceBy,
      );
      const expected: DragImpact = {
        // no longer the same due to visibility overscanning
        displaced: getForcedDisplacement({
          visible: [
            {
              dimension: visible,
              shouldAnimate: true,
            },
            {
              dimension: partialVisible,
              shouldAnimate: true,
            },
          ],
          invisible: [notVisible1],
        }),
        displacedBy,
        at: {
          type: 'REORDER',
          destination: {
            droppableId: droppable.descriptor.id,
            index: 0,
          },
        },
      };

      const impact: DragImpact = getDragImpact({
        // moving backwards to near the start of the droppable
        pageBorderBoxCenter: { x: 1, y: 1 },
        // dragging the notVisible2 draggable backwards
        draggable: notVisible2,
        draggables: customDraggables,
        droppables: customDroppables,
        previousImpact: noImpact,
        viewport,
        userDirection: backward,
        afterCritical: noAfterCritical,
      });

      expect(impact).toEqual(expected);
    });
  });
});
