// @flow
import getDroppableOver from '../../../src/state/get-droppable-over';
import { getDroppableDimension, getDraggableDimension } from '../../../src/state/dimension';
import getArea from '../../../src/state/get-area';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DroppableId,
  Position,
} from '../../../src/types';

const noPosition = { x: 0, y: 0 };

const droppable1: DroppableDimension = getDroppableDimension({
  id: 'drop-1',
  area: getArea({
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
  }),
});

const droppable2: DroppableDimension = getDroppableDimension({
  id: 'drop-2',
  area: getArea({
    top: 101,
    left: 0,
    bottom: 200,
    right: 100,
  }),
});
const droppable3: DroppableDimension = getDroppableDimension({
  id: 'drop-3',
  area: getArea({
    top: 0,
    left: 100,
    bottom: 100,
    right: 200,
  }),
});

const draggableMargin = { top: 0, right: 0, bottom: 10, left: 0 };
const draggable1: DraggableDimension = getDraggableDimension({
  id: 'drag-1',
  droppableId: droppable1.id,
  area: getArea({
    top: 0,
    right: 100,
    bottom: 90,
    left: 0,
  }),
  margin: draggableMargin,
  windowScroll: noPosition,
});
const draggable2: DraggableDimension = getDraggableDimension({
  id: 'drag-2',
  droppableId: droppable2.id,
  area: getArea({
    top: 101,
    right: 100,
    bottom: 190,
    left: 0,
  }),
  margin: draggableMargin,
  windowScroll: noPosition,
});
const draggable3: DraggableDimension = getDraggableDimension({
  id: 'drag-3',
  droppableId: droppable3.id,
  area: getArea({
    top: 0,
    right: 200,
    bottom: 40,
    left: 100,
  }),
  margin: draggableMargin,
  windowScroll: noPosition,
});

const droppableMap: DroppableDimensionMap = {
  [droppable1.id]: droppable1,
  [droppable2.id]: droppable2,
  [droppable3.id]: droppable3,
};

const draggableMap: DraggableDimensionMap = {
  [draggable1.id]: draggable1,
  [draggable2.id]: draggable2,
  [draggable3.id]: draggable3,
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
      draggables: draggableMap,
      droppables: droppableMap,
      previousDroppableOverId: null,
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
      draggables: draggableMap,
      droppables: droppableMap,
      previousDroppableOverId: null,
    });

    expect(result).toBe(droppable1.id);
  });

  describe('adding a buffer to the droppable area', () => {
    it('should never add buffer to the home droppable', () => {
      const draggingHomeDraggable: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 110 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable1.id,
      });
      const draggingForeignDraggable: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 110 },
        draggable: draggable2,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable1.id,
      });
      expect(draggingHomeDraggable).toBe(droppable2.id);
      expect(draggingForeignDraggable).toBe(droppable1.id);
    });

    it('should only add buffer if this droppable was hovered over on the previous tick', () => {
      const wasPreviouslyHovered: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 210 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable2.id,
      });
      const wasNotPreviouslyHovered: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 210 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: null,
      });
      expect(wasPreviouslyHovered).toBe(droppable2.id);
      expect(wasNotPreviouslyHovered).toBe(null);
    });

    it('buffer should only be added along the main axis of the droppable', () => {
      const inPlaceholderAreaOnTheMainAxis: ?DroppableId = getDroppableOver({
        target: { x: 10, y: 210 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable2.id,
      });
      const inPlaceholderAreaOnTheCrossAxis: ?DroppableId = getDroppableOver({
        target: { x: 110, y: 150 },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable2.id,
      });
      expect(inPlaceholderAreaOnTheMainAxis).toBe(droppable2.id);
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
        previousDroppableOverId: droppable2.id,
      });
      const justOutsidePlaceholderArea: ?DroppableId = getDroppableOver({
        target: {
          ...target,
          y: target.y + 1,
        },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable2.id,
      });

      expect(justInsidePlaceholderArea).toBe(droppable2.id);
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
        previousDroppableOverId: droppable3.id,
      });
      const justOutsidePlaceholderArea: ?DroppableId = getDroppableOver({
        target: {
          ...target,
          y: target.y + 1,
        },
        draggable: draggable1,
        draggables: draggableMap,
        droppables: droppableMap,
        previousDroppableOverId: droppable3.id,
      });

      expect(justInsidePlaceholderArea).toBe(droppable3.id);
      expect(justOutsidePlaceholderArea).toBe(null);
    });
  });
});
