// @flow
import noImpact from '../../../../src/state/no-impact';
import whatIsDraggedOver from '../../../../src/state/droppable/what-is-dragged-over';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import type {
  DraggableLocation,
  DragImpact,
  CombineImpact,
} from '../../../../src/types';

it('should return the droppableId of a reorder impact', () => {
  const destination: DraggableLocation = {
    droppableId: 'droppable',
    index: 0,
  };
  const impact: DragImpact = {
    ...noImpact,
    destination,
  };
  expect(whatIsDraggedOver(impact)).toEqual(destination.droppableId);
});

it('should return the droppableId from a merge impact', () => {
  const merge: CombineImpact = {
    combine: {
      draggableId: 'draggable',
      droppableId: 'droppable',
    },
    whenEntered: forward,
  };
  const impact: DragImpact = {
    ...noImpact,
    merge,
  };
  expect(whatIsDraggedOver(impact)).toEqual(merge.combine.droppableId);
});

it('should return null when there is no destination or merge impact', () => {
  expect(whatIsDraggedOver(noImpact)).toEqual(null);
});
