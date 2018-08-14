// @flow
import { type Rect } from 'css-box-model';
import getDisplacementMap, {
  type DisplacementMap,
} from './get-displacement-map';
import { isPartiallyVisible } from './visibility/is-visible';
import type {
  DraggableId,
  Displacement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
} from '../types';

type Args = {|
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Rect,
|};

// Note: it is also an optimisation to undo the displacement on
// items when they are no longer visible.
// This prevents a lot of .render() calls when leaving a list

export default ({
  draggable,
  destination,
  previousImpact,
  viewport,
}: Args): Displacement => {
  const id: DraggableId = draggable.descriptor.id;
  const map: DisplacementMap = getDisplacementMap(previousImpact);

  // only displacing items that are visible in the droppable and the viewport
  const isVisible: boolean = isPartiallyVisible({
    target: draggable.page.marginBox,
    destination,
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
