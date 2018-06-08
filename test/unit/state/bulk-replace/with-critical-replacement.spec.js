// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type {
  Axis,
  State,
  DraggingState,
  DropPendingState,
  BulkCollectionState,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DimensionMap,
  ItemPositions,
  DragImpact,
} from '../../../../src/types';
import reducer from '../../../../src/state/reducer';
import getStatePreset from '../../../utils/get-simple-state-preset';
import { moveDown, move } from '../../../../src/state/action-creators';
import { getPreset, shiftDraggables } from '../../../utils/dimension';
import { add, patch, subtract, negate } from '../../../../src/state/position';
import type { Result } from '../../../../src/state/bulk-replace/bulk-replace-types';
import bulkReplace from '../../../../src/state/bulk-replace';

const preset = getPreset();
const axis: Axis = preset.home.axis;
const state = getStatePreset(axis);

const origin: Position = { x: 0, y: 0 };

describe('adding a dimension before the dragging dimension', () => {
  it('should update correctly with no previous displacement', () => {
    // Setup
    // - dragging inHome1
    // - item added before inHome1
    // Result
    // - inHome1 stays in the same visual spot
    // - inHome1 stays in index 0
    // - the addition is displaced

    const original: DraggingState = state.dragging();

    const addition: DraggableDimension = {
      // stealing the inHome1 dimensions
      ...preset.inHome1,
      descriptor: {
        index: 0,
        id: 'addition',
        droppableId: preset.home.descriptor.id,
      },
    };
      // shifting the draggables forward to make room for the new addition
      // this will shift all of the droppables including foreign, but that is fine
    const amount: Position = patch(axis.line, addition.client.marginBox[axis.size]);
    const shifted: DraggableDimensionMap = shiftDraggables({
      amount,
      draggables: preset.draggables,
      indexChange: 1,
    });
    const dimensions: DimensionMap = {
      ...preset.dimensions,
      draggables: {
        ...shifted,
        [addition.descriptor.id]: addition,
      },
    };
    const bulkCollecting: BulkCollectionState = {
      phase: 'BULK_COLLECTING',
      ...original,
      // eslint-disable-next-line
        phase: 'BULK_COLLECTING',
    };

    const result: Result = bulkReplace({
      state: bulkCollecting,
      viewport: original.viewport,
      critical: bulkCollecting.critical,
      dimensions,
    });

    invariant(result.phase === 'DRAGGING', 'Expected to be in the DRAGGING phase');

    // ## First assertion: that the impact is correct

    const expectedResultImpact: DragImpact = {
      movement: {
        amount,
        // the addition has been pushed forward
        displaced: [{
          draggableId: addition.descriptor.id,
          isVisible: true,
          shouldAnimate: true,
        }],
        isBeyondStartPosition: false,
      },
      direction: axis.direction,
      destination: {
        droppableId: preset.home.descriptor.id,
        index: 0,
      },
    };
    expect(result.impact).toEqual(expectedResultImpact);

    // ## Second assertion: that the initial selection point has been adjusted

    // the difference between the center positions should be the amount of the shift
    const current: DraggableDimension = shifted[preset.inHome1.descriptor.id];
    const centerDiff: Position = subtract(
      current.client.borderBox.center,
      preset.inHome1.client.borderBox.center
    );
    expect(centerDiff).toEqual(amount);

    // the borderBoxCenter should not change
    expect(bulkCollecting.current.client.borderBoxCenter)
      .toEqual(result.current.client.borderBoxCenter);

    const initialClient: ItemPositions = {
      selection: add(bulkCollecting.initial.client.selection, centerDiff),
      borderBoxCenter: current.client.borderBox.center,
      offset: origin,
    };
    expect(result.initial.client).toEqual(initialClient);

    const offset: Position = negate(centerDiff);
    const currentClient: ItemPositions = {
      selection: add(initialClient.selection, offset),
      borderBoxCenter: add(initialClient.borderBoxCenter, offset),
      offset,
    };
    expect(result.current.client).toEqual(currentClient);
  });

  it('should update correctly when there is previous displacement', () => {
    // Arrange
    // - dragging inHome1
    // - inHome1 is moved forward into index 1
    // - inHome2 is moved backwards into index 0
    // Act
    // - item added before inHome1
    // Assert
    // - inHome1 stays in the same visual spot
    // - inHome1 stays in index 1
    // - inHome2 is no longer displaced
    // - the addition is not displaced and just stays in index 0

    const original: DraggingState = state.dragging();
    const movedDown: State = reducer(original, moveDown());
    invariant(movedDown.phase === 'DRAGGING');
    const withALittleMore: State = reducer(movedDown, move({
      client: add(movedDown.current.client.selection, { x: 1, y: 1 }),
      shouldAnimate: false,
    }));
    invariant(withALittleMore.phase === 'DRAGGING');

    const firstImpact: DragImpact = {
      movement: {
        displaced: [{
          draggableId: preset.inHome2.descriptor.id,
          isVisible: true,
          shouldAnimate: true,
        }],
        amount: patch(axis.line, preset.inHome1.client.marginBox[axis.size]),
        isBeyondStartPosition: true,
      },
      direction: axis.direction,
      destination: {
        droppableId: preset.home.descriptor.id,
        index: 1,
      },
    };
    expect(withALittleMore.impact).toEqual(firstImpact);

    const addition: DraggableDimension = {
      // stealing the inHome1 dimensions
      ...preset.inHome1,
      // going into the first position
      descriptor: {
        index: 0,
        id: 'addition',
        droppableId: preset.home.descriptor.id,
      },
    };
      // shifting the draggables forward to make room for the new addition
      // this will shift all of the droppables including foreign, but that is fine
    const amount: Position = patch(axis.line, addition.client.marginBox[axis.size]);
    const shifted: DraggableDimensionMap = shiftDraggables({
      amount,
      draggables: preset.draggables,
      indexChange: 1,
    });
    const dimensions: DimensionMap = {
      ...preset.dimensions,
      draggables: {
        ...shifted,
        [addition.descriptor.id]: addition,
      },
    };
    const bulkCollecting: BulkCollectionState = {
      phase: 'BULK_COLLECTING',
      ...withALittleMore,
      // eslint-disable-next-line
        phase: 'BULK_COLLECTING',
    };

    const result: Result = bulkReplace({
      state: bulkCollecting,
      viewport: original.viewport,
      critical: bulkCollecting.critical,
      dimensions,
    });

    invariant(result.phase === 'DRAGGING', 'Expected to be in the DRAGGING phase');

    // ## First assertion: impact
    const bulkReplaceImpact: DragImpact = {
      movement: {
        amount,
        // the addition has been pushed forward
        displaced: [],
        isBeyondStartPosition: true,
      },
      direction: axis.direction,
      // Still in the first position
      destination: {
        droppableId: preset.home.descriptor.id,
        index: 1,
      },
    };
    expect(result.impact).toEqual(bulkReplaceImpact);

    // the borderBoxCenter should not change
    expect(bulkCollecting.current.client.borderBoxCenter)
      .toEqual(result.current.client.borderBoxCenter);

    // ## Second assertion: positions
    // the difference between the center positions should be the amount of the shift
    const current: DraggableDimension = shifted[preset.inHome1.descriptor.id];
    const centerDiff: Position = subtract(
      current.client.borderBox.center,
      preset.inHome1.client.borderBox.center
    );
    expect(centerDiff).toEqual(amount);

    const initialClient: ItemPositions = {
      selection: add(original.initial.client.selection, centerDiff),
      borderBoxCenter: current.client.borderBox.center,
      offset: origin,
    };
    expect(result.initial.client).toEqual(initialClient);

    const offset: Position = subtract(
      // The offset before the update
      bulkCollecting.current.client.offset,
      // how much that offset is changing
      centerDiff
    );

    const currentClient: ItemPositions = {
      selection: add(initialClient.selection, offset),
      borderBoxCenter: add(initialClient.borderBoxCenter, offset),
      offset,
    };
    expect(result.current.client).toEqual(currentClient);
  });
});

it('should adjust the home impact', () => {
  // Setup
  // - dragging inHome1 and still in home position
  // - an item is added to the start of the list
  // Result:
  // - inHome1 will still be at index 0
  // - the added item needs to move forward
});

it('should adjust an impact with displacement', () => {
  // Setup
  // - dragging inHome1
  // - inHome1 moved forward into index 1. inHome2 has moved backwards
  // - an item is added to the start of the list
  // Result:
  // - inHome1 will still be at index 1
  // - the added item will be in index 0 and not displaced
  // - inHome2 will be at index 2 and will no longer be displaced
});

describe('removal before dragging item', () => {

});

it('should adjust the impact based on additions', () => {
  // - dragging inHome1
  // - draggable added before inHome1
  // inHome1 should stay in place (index 0) and inHome1 should displace forward
  // TODO: should it be animated? I am thinking no.

});

it('should adjust the impact based on removals', () => {

});

it('should base the page positions off the new viewport initial scroll', () => {

});

// const movedForward: DraggingState = (reducer(original, moveDown()): any);
//     const expectedOriginalImpact: DragImpact = {
//       movement: {
//         displaced: [{
//           draggableId: preset.inHome2.descriptor.id,
//           isVisible: true,
//           shouldAnimate: true,
//         }],
//         amount,
//         isBeyondStartPosition: true,
//       },
//       direction,
//       destination: {
//         droppableId: preset.home.descriptor.id,
//         index: 1,
//       },
//     };

