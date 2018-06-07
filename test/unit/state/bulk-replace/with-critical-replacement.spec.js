// @flow
import type {
  BulkCollectionState,
} from '../../../../src/types';
import * as state from '../../../utils/state-preset';

describe('addition before dragging item', () => {
  it('should adjust the positions based on any change between starting center positions', () => {
    // Setup
    // - dragging inHome1
    // - item added before inHome1
    // Result
    // - inHome1 stays in the same visual spot
    // - inHome1 stays in index 0
    // - the addition is displaced
    // The absolute x/y client position of the dragging item should not change
    const original: BulkCollectionState = state.bulkCollecting();
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
