// @flow
import { type Rect, getRect } from 'css-box-model';
import type {
  DraggableId,
  Displacement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  DisplacementMap,
  OnLift,
} from '../types';
import { isPartiallyVisible } from './visibility/is-visible';
import { offsetByPosition } from './spacing';
import { negate } from './position';
import didStartDisplaced from './starting-displaced/did-start-displaced';

type Args = {|
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Rect,
  onLift: OnLift,
  forceShouldAnimate?: boolean,
|};

const getShouldAnimate = (
  forceShouldAnimate: ?boolean,
  isVisible: boolean,
  previous: ?Displacement,
) => {
  // Use a forced value if provided
  if (typeof forceShouldAnimate === 'boolean') {
    return forceShouldAnimate;
  }

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

const getTarget = (draggable: DraggableDimension, onLift: OnLift): Rect => {
  const marginBox: Rect = draggable.page.marginBox;

  if (!didStartDisplaced(draggable.descriptor.id, onLift)) {
    return marginBox;
  }

  return getRect(offsetByPosition(marginBox, negate(onLift.displacedBy.point)));
};

export default ({
  draggable,
  destination,
  previousImpact,
  viewport,
  onLift,
  forceShouldAnimate,
}: Args): Displacement => {
  const id: DraggableId = draggable.descriptor.id;
  const map: DisplacementMap = previousImpact.movement.map;
  const target: Rect = getTarget(draggable, onLift);

  // We need to account for items that are not in their resting
  // position without original displacement

  // only displacing items that are visible in the droppable and the viewport
  const isVisible: boolean = isPartiallyVisible({
    // TODO: borderBox?
    target,
    destination,
    viewport,
    withDroppableDisplacement: true,
  });

  const shouldAnimate: boolean = getShouldAnimate(
    forceShouldAnimate,
    isVisible,
    map[id],
  );

  const displacement: Displacement = {
    draggableId: id,
    isVisible,
    shouldAnimate,
  };

  return displacement;
};
