// @flow
import getDroppableOver from '../../../src/state/get-droppable-over';
import { getPreset } from '../../utils/dimension';
import { getDroppableDimension, getDraggableDimension } from '../../../src/state/dimension';
import getArea from '../../../src/state/get-area';
import type {
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DroppableId,
  Position,
} from '../../../src/types';

const noPosition = { x: 0, y: 0 };
const preset = getPreset();

// Most functionality is tested by get getInsideDimension
describe('get droppable over', () => {
  it('should return null if the target is not over any dimension', () => {
    const target: Position = {
      x: 100000,
      y: 100000,
    };

    const result: ?DroppableId = getDroppableOver({
      target,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousDroppableOverId: null,
    });

    expect(result).toBe(null);
  });

  it('should return the id of the droppable that the target is over', () => {
    Object.keys(preset.draggables).forEach((id: DraggableId) => {
      const draggable: DraggableDimension = preset.draggables[id];

      const result: ?DroppableId = getDroppableOver({
        target: draggable.page.withoutMargin.center,
        draggable,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousDroppableOverId: null,
      });

      expect(result).toBe(draggable.descriptor.droppableId);
    });
  });

  describe('placeholder buffer', () => {
    describe('is dragging over nothing', () => {
      it('should not add any placeholder buffer', () => {

      });
    });

    describe('is dragging over home droppable', () => {
      it('should not add any placeholder buffer', () => {

      });
    });

    describe('over foreign droppable', () => {
      describe('it should not add a buffer if it was not previously over the foreign droppable', () => {

      });

      describe('droppable has no scroll container', () => {
        it('should not do anything if the droppable already had enough space', () => {

        });

        it('should only add as much space as required to fit a placeholder', () => {

        });
      });

      describe('droppable has scroll container', () => {
        // TODO: as above + frame clipping
      });
    });
  });

  describe('adding a placeholder buffer to the droppable area', () => {
    it('should not add buffer to the home droppable', () => {
      const draggingHomeDraggable: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 110 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable1.descriptor.id,
      });
      const draggingForeignDraggable: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 110 },
        draggable: draggable2,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable1.descriptor.id,
      });
      expect(draggingHomeDraggable).toBe(droppable2.descriptor.id);
      expect(draggingForeignDraggable).toBe(droppable1.descriptor.id);
    });

    it('should only add buffer if this droppable was hovered over on the previous tick', () => {
      const wasPreviouslyHovered: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 210 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable2.descriptor.id,
      });
      const wasNotPreviouslyHovered: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 210 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: null,
      });
      expect(wasPreviouslyHovered).toBe(droppable2.descriptor.id);
      expect(wasNotPreviouslyHovered).toBe(null);
    });

    it('buffer should only be added along the main axis of the droppable', () => {
      const inPlaceholderAreaOnTheMainAxis: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 210 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable2.descriptor.id,
      });
      const inPlaceholderAreaOnTheCrossAxis: ?DroppableId = getDroppableOver({
        target: { x: 110, y: 150 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable2.descriptor.id,
      });
      expect(inPlaceholderAreaOnTheMainAxis).toBe(droppable2.descriptor.id);
      expect(inPlaceholderAreaOnTheCrossAxis).toBe(null);
    });

    it('buffer should be the size of the draggable, including margin', () => {
      const target = {
        x: 10,
        y: droppable2.page.withMargin.bottom + draggable1.page.withMargin.height,
      };
      const justInsidePlaceholderArea: ?DroppableId = getDroppableOver({
        target,
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable2.descriptor.id,
      });
      const justOutsidePlaceholderArea: ?DroppableId = getDroppableOver({
        target: {
          ...target,
          y: target.y + 1,
        },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable2.descriptor.id,
      });

      expect(justInsidePlaceholderArea).toBe(droppable2.descriptor.id);
      expect(justOutsidePlaceholderArea).toBe(null);
    });

    it('if a droppable is longer than its list of items only as much buffer as is necessary should be added', () => {
      const target = {
        x: 150,
        y: draggable3.page.withMargin.bottom + draggable1.page.withMargin.height,
      };

      const justInsidePlaceholderArea: ?DroppableId = getDroppableOver({
        target,
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable3.descriptor.id,
      });
      const justOutsidePlaceholderArea: ?DroppableId = getDroppableOver({
        target: {
          ...target,
          y: target.y + 1,
        },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable3.descriptor.id,
      });

      expect(justInsidePlaceholderArea).toBe(droppable3.descriptor.id);
      expect(justOutsidePlaceholderArea).toBe(null);
    });
  });
});
