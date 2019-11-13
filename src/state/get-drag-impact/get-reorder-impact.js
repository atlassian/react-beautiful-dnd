// @flow
import { type Position, type Rect } from 'css-box-model';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  DisplacementGroups,
  Viewport,
  UserDirection,
  DisplacedBy,
  LiftEffect,
} from '../../types';
import getDisplacedBy from '../get-displaced-by';
import removeDraggableFromList from '../remove-draggable-from-list';
import getDidStartAfterCritical from '../did-start-after-critical';
import calculateReorderImpact from '../calculate-drag-impact/calculate-reorder-impact';

type Args = {|
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  viewport: Viewport,
  userDirection: UserDirection,
  afterCritical: LiftEffect,
  previousImpact: DragImpact,
|};

type AtIndexArgs = {|
  draggable: DraggableDimension,
  closest: ?DraggableDimension,
  inHomeList: boolean,
|};

export default ({
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  draggable,
  destination,
  insideDestination,
  viewport,
  afterCritical,
  previousImpact,
}: Args): DragImpact => {
  const axis: Axis = destination.axis;
  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
  );

  const targetCenter: number = currentCenter[axis.line];
  const displacement: number = displacedBy.value;
  const withoutDragging: DraggableDimension[] = removeDraggableFromList(
    draggable,
    insideDestination,
  );

  // Determine the current index of the target within the list.
  // This will either be the index of the previous impact destination or if
  // there hasn't been a previous impact yet fallback to the initial index
  // of the draggable.
  const prevDest =
    previousImpact && previousImpact.at && previousImpact.at.destination;
  const initialIndex = draggable.descriptor.index;
  const targetIndex = prevDest ? prevDest.index : initialIndex;

  // Calculate the current start and end positions of the target item.
  const offset = displacement / 2;
  const targetStart = targetCenter - offset;
  const targetEnd = targetCenter + offset;

  // Initialize the newIndex to the current index of the target.
  // If no updated index is found in the loop below then the `newIndex` will
  // remain unchanged i.e. maintaining the current index of the target item.
  let newIndex = targetIndex;

  // Loop through all items in the list excluding the current target item
  for (let i = 0; i < withoutDragging.length; i++) {
    const child = withoutDragging[i];

    // The `withoutDragging` list does not include the target item, so for all
    // elements after the target in the list shift the index forward by 1
    const listIndex = i >= targetIndex ? i + 1 : i;

    // Determine whether the child has been reordered, i.e. whether the child
    // is currently ordered before the target in the list but was initially after,
    // or is currently ordered after the target and started before.
    const startedAfter = getDidStartAfterCritical(
      child.descriptor.id,
      afterCritical,
    );
    const isAfter = listIndex > targetIndex;
    const hasReordered = startedAfter !== isAfter;

    // If the child has been reordered then the center position will have been
    // shifted back/forward by the displacement size of the target item.
    // To get the current center position of the child item adding or subtract
    // the displacement size from the center position based on whether the target
    // was initially before or after the item.
    const childDisplacement = startedAfter ? -displacement : displacement;
    const boxCenter = child.page.borderBox.center[axis.line];
    const center = boxCenter + (hasReordered ? childDisplacement : 0);

    // Check if the target item belongs at the child items index based on whether:
    // A: The target start position is less than the center of the child and the
    // child is before the target in the list.
    // or
    // B: The target end position is greater than the center of the child and the
    // child is after the target in the list.
    if ((targetStart < center && !isAfter) || (targetEnd > center && isAfter)) {
      newIndex = listIndex;
      break;
    }
  }

  // TODO: index cannot be null?
  // otherwise return null from there and return empty impact
  // that was calculate reorder impact does not need to account for a null index
  return calculateReorderImpact({
    draggable,
    insideDestination,
    destination,
    viewport,
    last: previousImpact.displaced,
    displacedBy,
    index: newIndex,
  });
};
