// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import type {
  Viewport,
  DraggableDimension,
  DroppableDimension,
  Scrollable,
  DroppableDimensionMap,
  DroppableId,
} from '../../../types';
import { add, isEqual, origin } from '../../position';
import offsetDraggable from './offset-draggable';

type Args = {|
  additions: DraggableDimension[],
  updatedDroppables: DroppableDimensionMap,
  viewport: Viewport,
|};

export default ({
  additions,
  updatedDroppables,
  viewport,
}: Args): DraggableDimension[] => {
  // We need to adjust collected draggables so that they
  // match the model we had when the drag started.
  // When a draggable is dynamically collected it does not have
  // the same relative client position. We need to unwind
  // any changes in window scroll and droppable scroll so that
  // the newly collected draggables fit in with our other draggables
  // and give the same dimensions that would have had if they were
  // collected at the start of the drag.

  // Need to undo the displacement caused by window scroll changes
  const windowScrollChange: Position = viewport.scroll.diff.value;
  // These modified droppables have already had their scroll changes correctly updated

  return additions.map(
    (draggable: DraggableDimension): DraggableDimension => {
      const droppableId: DroppableId = draggable.descriptor.droppableId;
      const modified: DroppableDimension = updatedDroppables[droppableId];

      const frame: ?Scrollable = modified.frame;
      invariant(frame);

      const droppableScrollChange: Position = frame.scroll.diff.value;

      const totalChange: Position = add(
        windowScrollChange,
        droppableScrollChange,
      );

      const moved: DraggableDimension = offsetDraggable({
        draggable,
        offset: totalChange,
        initialWindowScroll: viewport.scroll.initial,
      });

      return moved;
    },
  );
};
