// @flow
import { type Rect } from 'css-box-model';
import { isPartiallyVisible } from './visibility/is-visible';
import type {
  DraggableId,
  Displacement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  DisplacementMap,
} from '../types';

type Args = {|
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Rect,
|};

const getShouldAnimate = (isVisible: boolean, previous: ?Displacement) => {
  // if should be displaced and not visible
  if (!isVisible) {
    return false;
  }

  // if visible and no previous entries: animate!
  if (!previous) {
    return true;
  }

  // return our previous value
  // for items that where originally not visible this will be false
  // otherwise it will be true
  return previous.shouldAnimate;
};

// Note: it is also an optimisation to not render the displacement on
// items when they are not longer visible.
// This prevents a lot of .render() calls when leaving / entering a list

export default ({
  draggable,
  destination,
  previousImpact,
  viewport,
}: Args): Displacement => {
  const id: DraggableId = draggable.descriptor.id;
  const map: DisplacementMap = previousImpact.movement.map;

  // only displacing items that are visible in the droppable and the viewport
  const isVisible: boolean = isPartiallyVisible({
    // TODO: borderBox?
    target: draggable.page.marginBox,
    destination,
    viewport,
    withDroppableDisplacement: true,
  });

  const shouldAnimate: boolean = getShouldAnimate(isVisible, map[id]);

  const displacement: Displacement = {
    draggableId: id,
    isVisible,
    shouldAnimate,
  };

  return displacement;
};
