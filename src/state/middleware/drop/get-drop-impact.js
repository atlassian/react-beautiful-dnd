// @flow
import whatIsDraggedOver from '../../droppable/what-is-dragged-over';
import recompute from '../../update-displacement-visibility/recompute';
import type {
  DropReason,
  DragImpact,
  Viewport,
  DroppableDimension,
  DraggableDimensionMap,
} from '../../../types';

type Args = {|
  reason: DropReason,
  lastImpact: DragImpact,
  originalImpact: DragImpact,
  viewport: Viewport,
  home: DroppableDimension,
  draggables: DraggableDimensionMap,
|};

export default ({
  reason,
  lastImpact,
  originalImpact,
  home,
  viewport,
  draggables,
}: Args): DragImpact => {
  const canUseLast: boolean =
    reason === 'DROP' && Boolean(whatIsDraggedOver(lastImpact));

  if (canUseLast) {
    return lastImpact;
  }

  return recompute({
    impact: originalImpact,
    destination: home,
    viewport,
    draggables,
    forceShouldAnimate: true,
  });
};
