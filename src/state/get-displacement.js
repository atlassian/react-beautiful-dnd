// @flow
import { isDraggablePartiallyVisible } from './visibility/is-partially-visible';
import getDisplacementMap, { type DisplacementMap } from './get-displacement-map';
import type {
  DraggableId,
  Displacement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Area,
} from '../types';

type Args = {|
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Area,
|}

export default ({
  draggable,
  destination,
  previousImpact,
  viewport,
}: Args): Displacement => {
  const id: DraggableId = draggable.descriptor.id;
  const map: DisplacementMap = getDisplacementMap(previousImpact.movement.displaced);

  const isVisible: boolean = isDraggablePartiallyVisible({
    draggable,
    droppable: destination,
    viewport,
  });

  const shouldAnimate: boolean = (() => {
    // if should be displaced and not visible
    if (!isVisible) {
      return false;
    }

    // see if we can find a previous value
    const previous: ?Displacement = map[id];

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
