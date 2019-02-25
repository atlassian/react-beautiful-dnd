// @flow
import type {
  Viewport,
  DraggableDimension,
  DroppableDimension,
  DisplacedBy,
} from '../../../types';
import getDisplacedBy from '../../get-displaced-by';
import offsetDraggable from './offset-draggable';

type Args = {|
  additions: DraggableDimension[],
  dragging: DraggableDimension,
  home: DroppableDimension,
  viewport: Viewport,
|};

export default ({
  additions,
  dragging,
  home,
  viewport,
}: Args): DraggableDimension[] => {
  const displacedBy: DisplacedBy = getDisplacedBy(
    home.axis,
    dragging.displaceBy,
  );

  return additions.map(
    (draggable: DraggableDimension): DraggableDimension => {
      // not in the home list, nothing to worry about there
      if (draggable.descriptor.droppableId !== home.descriptor.id) {
        return draggable;
      }

      if (draggable.descriptor.index < dragging.descriptor.index) {
        return draggable;
      }
      // item occurs after dragging item.
      // need to shift it to account for collapsed home item

      return offsetDraggable({
        draggable,
        offset: displacedBy.point,
        initialWindowScroll: viewport.scroll.initial,
      });
    },
  );
};
