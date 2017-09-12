// @flow
import moveCrossAxis from '../../../../src/state/move-cross-axis/';
import type { Result } from '../../../../src/state/move-cross-axis/move-cross-axis-types';
import getDroppableWithDraggables from '../../../utils/get-droppable-with-draggables';
import type { Result as Data } from '../../../utils/get-droppable-with-draggables';
import type {
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../../../../src/types';

// The functionality of move-cross-axis is covered by other files in this folder.
// This spec file is directed any any logic in move-cross-axis/index.js

describe('move cross axis', () => {
  const home: Data = getDroppableWithDraggables({
    droppableId: 'home',
    droppableRect: { top: 0, left: 0, right: 100, bottom: 100 },
    draggableRects: [
      { top: 0, left: 0, right: 100, bottom: 20 },
    ],
  });

  it('should return null if there are draggables in a destination list but none are visible', () => {
    const foreign: Data = getDroppableWithDraggables({
      droppableId: 'foreign',
      // to the right of home
      droppableRect: { top: 0, left: 100, right: 200, bottom: 100 },
      draggableRects: [
        // bigger than that visible rect
        { top: 0, left: 100, right: 200, bottom: 110 },
      ],
    });
    const draggables: DraggableDimensionMap = {
      ...home.draggables,
      ...foreign.draggables,
    };
    const droppables: DroppableDimensionMap = {
      [home.droppable.id]: home.droppable,
      [foreign.droppable.id]: foreign.droppable,
    };
    const draggable: DraggableDimension = home.draggableDimensions[0];

    const result: ?Result = moveCrossAxis({
      isMovingForward: true,
      pageCenter: draggable.page.withMargin.center,
      draggableId: draggable.id,
      droppableId: home.droppable.id,
      home: {
        droppableId: home.droppable.id,
        index: 0,
      },
      draggables,
      droppables,
    });

    expect(result).toBe(null);
  });

  // this test is a validation that the previous test is working correctly
  it('should return a droppable if its children are visible (and all other criteria are met', () => {
    // adding visible child to foreign
    const foreign: Data = getDroppableWithDraggables({
      droppableId: 'foreign',
      // to the right of home
      droppableRect: { top: 0, left: 100, right: 200, bottom: 100 },
      draggableRects: [
        // child is visible
        { top: 0, left: 100, right: 200, bottom: 90 },
      ],
    });
    const draggables: DraggableDimensionMap = {
      ...home.draggables,
      ...foreign.draggables,
    };
    const droppables: DroppableDimensionMap = {
      [home.droppable.id]: home.droppable,
      [foreign.droppable.id]: foreign.droppable,
    };
    const draggable: DraggableDimension = home.draggableDimensions[0];

    const result: ?Result = moveCrossAxis({
      isMovingForward: true,
      pageCenter: draggable.page.withMargin.center,
      draggableId: draggable.id,
      droppableId: home.droppable.id,
      home: {
        droppableId: home.droppable.id,
        index: 0,
      },
      draggables,
      droppables,
    });

    // not asserting anything about the behaviour - just that something was returned
    expect(result).toBeTruthy();
  });
});
