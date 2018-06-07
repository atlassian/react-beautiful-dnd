// @flow
import type {
  Axis,
  Viewport,
  DraggingState,
  BulkCollectionState,
  DragImpact,
  DimensionMap,
} from '../../../../src/types';
import bulkReplace from '../../../../src/state/bulk-replace';
import { patch } from '../../../../src/state/position';
import type { Result } from '../../../../src/state/bulk-replace/bulk-replace-types';
import getViewport from '../../../../src/view/window/get-viewport';
import * as state from '../../../utils/state-preset';
import { getPreset } from '../../../utils/dimension';
import getHomeImpact from '../../../../src/state/get-home-impact';

const preset = getPreset();
const axis: Axis = preset.home.axis;
const viewport: Viewport = getViewport();

it('should maintain the previous critical dimensions', () => {
  const replacement: DimensionMap = {
    draggables: {
      [preset.inForeign1.descriptor.id]: preset.inForeign1,
    },
    droppables: {
      [preset.foreign.descriptor.id]: preset.foreign,
    },
  };

  const result: Result = bulkReplace({
    state: state.bulkCollecting(),
    viewport,
    critical: null,
    dimensions: replacement,
  });

  expect(result.dimensions).toEqual({
    draggables: {
      // replaced
      ...replacement.draggables,
      // critical
      [preset.inHome1.descriptor.id]: preset.inHome1,
    },
    droppables: {
      // replaced
      ...replacement.droppables,
      // critical
      [preset.home.descriptor.id]: preset.home,
    },
  });
});

it.only('should recalculate the drag impact', () => {
  const base: BulkCollectionState = state.bulkCollecting();
  const movedForward: DragImpact = {
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
    // now in the second position
    destination: {
      droppableId: preset.home.descriptor.id,
      index: 1,
    },
  };
  const current: BulkCollectionState = {
    ...base,
    impact: movedForward,
  };

  // we have not changed the center position of the dragging item
  // so its impact should be reverted to the home location
  const result: Result = bulkReplace({
    state: current,
    viewport,
    critical: null,
    dimensions: preset.dimensions,
  });

  expect(result.impact).toEqual(getHomeImpact(state.critical, preset.dimensions));
});

it('should return dragging state if BULK_COLLECTING', () => {
  const result: Result = bulkReplace({
    state: state.bulkCollecting(),
    viewport,
    critical: null,
    dimensions: preset.dimensions,
  });

  expect(result.phase).toBe('DRAGGING');
});

it('should maintain a DROP_PENDING if there was one - and should indicate that the drop is no longer waiting', () => {
  const result: Result = bulkReplace({
    state: state.dropPending({
      reason: 'DROP',
      isWaiting: true,
    }),
    viewport,
    critical: null,
    dimensions: preset.dimensions,
  });

  expect(result.phase).toBe('DROP_PENDING');
  expect(result.isWaiting).toBe(false);
});
