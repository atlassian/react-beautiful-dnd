// @flow
import { type Position } from 'css-box-model';
import type {
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  DisplacementGroups,
  Viewport,
  DisplacedBy,
  LiftEffect,
} from '../../types';
import getDisplacedBy from '../get-displaced-by';
import removeDraggableFromList from '../remove-draggable-from-list';
import isHomeOf from '../droppable/is-home-of';
import { find } from '../../native-with-fallback';
import getDidStartAfterCritical from '../did-start-after-critical';
import calculateReorderImpact from '../calculate-drag-impact/calculate-reorder-impact';

type Args = {|
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  last: DisplacementGroups,
  viewport: Viewport,
  afterCritical: LiftEffect,
|};

type AtIndexArgs = {|
  draggable: DraggableDimension,
  closest: ?DraggableDimension,
  inHomeList: boolean,
|};

function atIndex({ draggable, closest, inHomeList }: AtIndexArgs): ?number {
  if (!closest) {
    return null;
  }

  if (!inHomeList) {
    return closest.descriptor.index;
  }

  if (closest.descriptor.index > draggable.descriptor.index) {
    return closest.descriptor.index - 1;
  }

  return closest.descriptor.index;
}

export default ({
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  draggable,
  destination,
  insideDestination,
  last,
  viewport,
  afterCritical,
}: Args): DragImpact => {
  const axis: Axis = destination.axis;
  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
  );

  const targetCenter: number = currentCenter[axis.line];
  const targetSize: number = draggable.client.borderBox[axis.size];
  const targetStart: number = targetCenter - targetSize / 2;
  const targetEnd: number = targetCenter + targetSize / 2;

  const displacement: number = displacedBy.value;
  const withoutDragging: DraggableDimension[] = removeDraggableFromList(
    draggable,
    insideDestination,
  );

  const closest: ?DraggableDimension = find(
    withoutDragging,
    (child: DraggableDimension): boolean => {
      const id: DraggableId = child.descriptor.id;
      const childCenter: number = child.page.borderBox.center[axis.line];
      // const start: number = borderBox[axis.start];
      // const end: number = borderBox[axis.end];

      const didStartAfterCritical: boolean = getDidStartAfterCritical(
        id,
        afterCritical,
      );

      const isDisplaced: boolean = Boolean(
        last.visible[id] || last.invisible[id],
      );

      // TODO: <= or <

      if (didStartAfterCritical) {
        // Continue to displace while targetEnd < center
        if (isDisplaced) {
          return targetEnd < childCenter;
        }

        // has been moved backwards from where it started
        // displace once targetStart is less than the new center
        return targetStart < childCenter - displacement;
      }

      // Item has been shifted forward.
      // Continue to displace forward while targetEnd < new center
      if (isDisplaced) {
        return targetEnd < childCenter + displacement;
      }

      // Item is behind the dragging item
      // We want to displace it if the targetStart < center
      return targetStart < childCenter;
    },
  );

  const newIndex: ?number = atIndex({
    draggable,
    closest,
    inHomeList: isHomeOf(draggable, destination),
  });

  // TODO: index cannot be null?
  // otherwise return null from there and return empty impact
  // that was calculate reorder impact does not need to account for a null index
  return calculateReorderImpact({
    draggable,
    insideDestination,
    destination,
    viewport,
    last,
    displacedBy,
    index: newIndex,
  });
};
