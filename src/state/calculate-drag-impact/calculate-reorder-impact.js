// @flow
import type {
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  DisplacementGroups,
  Viewport,
  DisplacedBy,
} from '../../types';
import removeDraggableFromList from '../remove-draggable-from-list';
import isHomeOf from '../droppable/is-home-of';
import { emptyGroups } from '../no-impact';
import { find } from '../../native-with-fallback';
import getDisplacementGroups from '../get-displacement-groups';

type Args = {|
  draggable: DraggableDimension,
  insideDestination: DraggableDimension[],
  destination: DroppableDimension,
  viewport: Viewport,
  displacedBy: DisplacedBy,
  last: DisplacementGroups,
  index: ?number,
|};

function getIndexOfLastItem(
  draggables: DraggableDimension[],
  options: {| inHomeList: boolean |},
): number {
  if (!draggables.length) {
    return 0;
  }

  const indexOfLastItem: number =
    draggables[draggables.length - 1].descriptor.index;

  // When in a foreign list there will be an additional one item in the list
  return options.inHomeList ? indexOfLastItem : indexOfLastItem + 1;
}

type GoAtEndArgs = {|
  insideDestination: DraggableDimension[],
  inHomeList: boolean,
  displacedBy: DisplacedBy,
  destination: DroppableDimension,
|};

function goAtEnd({
  insideDestination,
  inHomeList,
  displacedBy,
  destination,
}: GoAtEndArgs) {
  const newIndex: number = getIndexOfLastItem(insideDestination, {
    inHomeList,
  });

  return {
    displaced: emptyGroups,
    displacedBy,
    at: {
      type: 'REORDER',
      closestAfter: null,
      destination: {
        droppableId: destination.descriptor.id,
        index: newIndex,
      },
    },
  };
}

export default function calculateReorderImpact({
  draggable,
  insideDestination,
  destination,
  viewport,
  displacedBy,
  last,
  index,
}: Args): DragImpact {
  const inHomeList: boolean = isHomeOf(draggable, destination);

  // Go into last spot of list
  if (index == null) {
    return goAtEnd({
      insideDestination,
      inHomeList,
      displacedBy,
      destination,
    });
  }

  // this might be the dragging item
  const match: ?DraggableDimension = find(
    insideDestination,
    (item: DraggableDimension) => item.descriptor.index === index,
  );

  if (!match) {
    return goAtEnd({
      insideDestination,
      inHomeList,
      displacedBy,
      destination,
    });
  }
  const withoutDragging: DraggableDimension[] = removeDraggableFromList(
    draggable,
    insideDestination,
  );

  const sliceFrom: number = insideDestination.indexOf(match);
  const impacted: DraggableDimension[] = withoutDragging.slice(sliceFrom);

  const displaced: DisplacementGroups = getDisplacementGroups({
    afterDragging: impacted,
    destination,
    displacedBy,
    last,
    viewport: viewport.frame,
  });
  const closestAfter: ?DraggableId = impacted.length
    ? impacted[0].descriptor.id
    : null;

  return {
    displaced,
    displacedBy,
    at: {
      type: 'REORDER',
      closestAfter,
      destination: {
        droppableId: destination.descriptor.id,
        index,
      },
    },
  };
}
