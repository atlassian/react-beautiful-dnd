// @flow
import isDisplacedDraggableVisible from './is-displaced-draggable-visible';
import type {
  DraggableId,
  Displacement,
  DraggableDimension,
  DroppableDimension,
  ClientRect,
  DragImpact,
} from '../types';

type Args = {|
  draggable: DraggableDimension,
  destination: DroppableDimension,
  viewport: ClientRect,
  previousImpact: DragImpact,
|}

export default ({
  draggable,
  destination,
  viewport,
  previousImpact,
}: Args): Displacement => {
  const id: DraggableId = draggable.descriptor.id;

  const isVisible: boolean = isDisplacedDraggableVisible({
    displaced: draggable,
    droppable: destination,
    viewport,
  });

  const shouldAnimate: boolean = (() => {
    // if should be displaced and not visible
    if (!isVisible) {
      return false;
    }

    // see if we can find a previous value
    const previous: ?Displacement = previousImpact.movement.displaced.filter(
      (item: Displacement) => item.draggableId === id
    )[0];

    // if visible and no previous entries: animate!
    if (!previous) {
      return true;
    }

    // return our previous value
    // for items that where originally not visible this will be false
    // otherwise it will be true
    return previous.shouldAnimate;
  })();

  const displacement: Displacement = {
    draggableId: id,
    isVisible,
    shouldAnimate,
  };

  return displacement;
};
