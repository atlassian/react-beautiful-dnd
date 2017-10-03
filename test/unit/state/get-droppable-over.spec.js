// @flow
import getDroppableOver from '../../../src/state/get-droppable-over';
import { getDroppableDimension, getDraggableDimension } from '../../../src/state/dimension';
import getClientRect from '../../../src/state/get-client-rect';
import type {
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  Position,
} from '../../../src/types';

const noPosition = { x: 0, y: 0 };

const droppable1: DroppableDimension = getDroppableDimension({
  id: 'drop-1',
  clientRect: getClientRect({
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
  }),
});

const droppable2: DroppableDimension = getDroppableDimension({
  id: 'drop-2',
  clientRect: getClientRect({
    top: 101,
    left: 0,
    bottom: 200,
    right: 100,
  }),
});

const draggable1: DraggableDimension = getDraggableDimension({
  id: 'drag',
  droppableId: droppable1.id,
  clientRect: getClientRect({
    top: 0,
    right: 100,
    bottom: 20,
    left: 0,
  }),
  margin: { top: 0, right: 0, bottom: 10, left: 0 },
  windowScroll: noPosition,
});
const draggable2: DraggableDimension = getDraggableDimension({
  id: 'drag',
  droppableId: droppable2.id,
  clientRect: getClientRect({
    top: 101,
    right: 100,
    bottom: 121,
    left: 0,
  }),
  margin: { top: 0, right: 0, bottom: 10, left: 0 },
  windowScroll: noPosition,
});

const droppableMap: DroppableDimensionMap = {
  [droppable1.id]: droppable1,
  [droppable2.id]: droppable2,
};

// Most functionality is tested by get getInsideDimension
describe('get droppable over', () => {
  it('should return null if the target is not over any dimension', () => {
    const target: Position = {
      x: 1000,
      y: 1000,
    };

    const result: ?DroppableId = getDroppableOver({
      target,
      draggable: draggable1,
      droppables: droppableMap,
      previousDroppableOver: null,
    });

    expect(result).toBe(null);
  });

  it('should return the droppable dimension that the target is over', () => {
    const target: Position = {
      x: 10,
      y: 10,
    };

    const result: ?DroppableId = getDroppableOver({
      target,
      draggable: draggable1,
      droppables: droppableMap,
      previousDroppableOver: null,
    });

    expect(result).toBe(droppable1.id);
  });

  describe('adding padding to the droppable area', () => {
    it('should never add padding to the home droppable', () => {
      const draggingHomeDraggable: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 110 },
        draggable: draggable1,
        droppables: droppableMap,
        previousDroppableOver: droppable1.id,
      });
      const draggingForeignDraggable: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 110 },
        draggable: draggable2,
        droppables: droppableMap,
        previousDroppableOver: droppable1.id,
      });
      expect(draggingHomeDraggable).toBe(droppable2.id);
      expect(draggingForeignDraggable).toBe(droppable1.id);
    });

    it('should only add padding if this droppable was hovered over on the previous tick', () => {
      const wasPreviouslyHovered: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 210 },
        draggable: draggable1,
        droppables: droppableMap,
        previousDroppableOver: droppable2.id,
      });
      const wasNotPreviouslyHovered: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 210 },
        draggable: draggable1,
        droppables: droppableMap,
        previousDroppableOver: null,
      });
      expect(wasPreviouslyHovered).toBe(droppable2.id);
      expect(wasNotPreviouslyHovered).toBe(null);
    });

    it('padding should only be added along the main axis of the droppable', () => {
      const inPlaceholderAreaOnTheMainAxis: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 210 },
        draggable: draggable1,
        droppables: droppableMap,
        previousDroppableOver: droppable2.id,
      });
      const inPlaceholderAreaOnTheCrossAxis: ?DroppableId = getDroppableOver({
        target: { x: 110, y: 150 },
        draggable: draggable1,
        droppables: droppableMap,
        previousDroppableOver: droppable2.id,
      });
      expect(inPlaceholderAreaOnTheMainAxis).toBe(droppable2.id);
      expect(inPlaceholderAreaOnTheCrossAxis).toBe(null);
    });

    it('padding should be the size of the draggable, including margin', () => {
      const target = {
        x: 10,
        y: droppable2.page.withMargin.bottom + draggable1.page.withMargin.height,
      };
      const justInsidePlaceholderArea: ?DroppableId = getDroppableOver({
        target,
        draggable: draggable1,
        droppables: droppableMap,
        previousDroppableOver: droppable2.id,
      });
      const justOutsidePlaceholderArea: ?DroppableId = getDroppableOver({
        target: {
          ...target,
          y: target.y + 1,
        },
        draggable: draggable1,
        droppables: droppableMap,
        previousDroppableOver: droppable2.id,
      });
      expect(justInsidePlaceholderArea).toBe(droppable2.id);
      expect(justOutsidePlaceholderArea).toBe(null);
    });
  });
});
