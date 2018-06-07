// @flow
import type {
  BulkCollectionState,
} from '../../../../src/types';
import * as state from '../../../utils/state-preset';

it('should adjust the positions based on any change between starting center positions', () => {
  // - dragging inHome2
  // - removing inHome1
  // The absolute x/y client position of the dragging item should not change
  const original: BulkCollectionState = state.bulkCollecting();
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
