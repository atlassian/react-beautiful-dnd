// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../src/state/no-impact';
import { add, patch, subtract } from '../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { scrollDroppable } from '../../../../../src/state/droppable-dimension';
import {
  getPreset,
  disableDroppable,
  makeScrollable,
  getDroppableDimension,
  getDraggableDimension,
} from '../../../../utils/dimension';
import getViewport from '../../../../../src/view/window/get-viewport';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import type {
  Axis,
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
  DraggableDimensionMap,
  Viewport,
  UserDirection,
  Displacement,
} from '../../../../../src/types';

const viewport: Viewport = getViewport();
const dontCareAboutDirection: UserDirection = {
  vertical: 'down',
  horizontal: 'right',
};

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    it('should indicate when a displacement is not visible due to being outside of the droppable frame', () => {
      const droppable: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'my-custom-droppable',
          type: 'TYPE',
        },
        direction: axis.direction,
        borderBox: {
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 100,
          [axis.start]: 0,
          // will be cut by the frame
          [axis.end]: 200,
        },
        closest: {
          borderBox: {
            [axis.crossAxisStart]: 0,
            [axis.crossAxisEnd]: 100,
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
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 100,
          [axis.start]: 0,
          [axis.end]: 100,
        },
      });
      const notVisible1: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'not-visible-1',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 1,
        },
        borderBox: {
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 100,
          // inside the frame, but not in the visible area
          [axis.start]: 110,
          [axis.end]: 120,
        },
      });
      const notVisible2: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'not-visible-2',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 2,
        },
        borderBox: {
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 100,
          // inside the frame, but not in the visible area
          [axis.start]: 130,
          [axis.end]: 140,
        },
      });
      const customDraggables: DraggableDimensionMap = {
        [visible.descriptor.id]: visible,
        [notVisible1.descriptor.id]: notVisible1,
        [notVisible2.descriptor.id]: notVisible2,
      };
      const customDroppables: DroppableDimensionMap = {
        [droppable.descriptor.id]: droppable,
      };
      const expected: DragImpact = {
        movement: {
          // ordered by closest to current position
          displaced: [
            {
              draggableId: visible.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: notVisible1.descriptor.id,
              // showing that the displacement in non-visual
              isVisible: false,
              shouldAnimate: false,
            },
          ],
          amount: patch(axis.line, notVisible2.page.marginBox[axis.size]),
          isInFrontOfStart: false,
        },
        direction: axis.direction,
        // moved into the first position
        destination: {
          droppableId: droppable.descriptor.id,
          index: 0,
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
      });

      expect(impact).toEqual(expected);
    });

    it('should indicate when a displacement is not visible due to being outside of the viewport', () => {
      const droppable: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'my-custom-droppable',
          type: 'TYPE',
        },
        direction: axis.direction,
        borderBox: {
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 100,
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
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 100,
          [axis.start]: 0,
          [axis.end]: viewport.frame[axis.end],
        },
      });
      const notVisible1: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'not-visible-1',
          droppableId: droppable.descriptor.id,
          type: droppable.descriptor.type,
          index: 1,
        },
        borderBox: {
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 100,
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
          index: 2,
        },
        borderBox: {
          [axis.crossAxisStart]: 0,
          [axis.crossAxisEnd]: 100,
          // inside the droppable, but not in the visible area
          [axis.start]: viewport.frame[axis.end] + 30,
          [axis.end]: viewport.frame[axis.end] + 40,
        },
      });
      const customDraggables: DraggableDimensionMap = {
        [visible.descriptor.id]: visible,
        [notVisible1.descriptor.id]: notVisible1,
        [notVisible2.descriptor.id]: notVisible2,
      };
      const customDroppables: DroppableDimensionMap = {
        [droppable.descriptor.id]: droppable,
      };
      const expected: DragImpact = {
        movement: {
          // ordered by closest to current position
          displaced: [
            {
              draggableId: visible.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: notVisible1.descriptor.id,
              // showing that the displacement in non-visual
              isVisible: false,
              shouldAnimate: false,
            },
          ],
          amount: patch(axis.line, notVisible2.page.marginBox[axis.size]),
          isInFrontOfStart: false,
        },
        direction: axis.direction,
        // moved into the first position
        destination: {
          droppableId: droppable.descriptor.id,
          index: 0,
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
      });

      expect(impact).toEqual(expected);
    });
  });
});
