// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DraggableDimension,
  DraggableDimensionMap,
  DragImpact,
  DraggableLocation,
  DroppableDimension,
} from '../../types';
import isInHomeList from '../is-in-home-list';
import { patch } from '../position';

type NewHomeArgs = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  // all draggables in the system
  draggables: DraggableDimensionMap,
  destination: ?DroppableDimension,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({
  impact,
  draggable,
  draggables,
  destination,
}: NewHomeArgs): ?Position => {
  // not dropping anywhere
  if (destination == null) {
    return null;
  }
  // dropping outside of any list
  const location: ?DraggableLocation = impact.destination;

  if (!location) {
    return null;
  }

  const { displaced, willDisplaceForward } = impact.movement;
  const axis: Axis = destination.axis;

  const inHomeList: boolean = isInHomeList(draggable, destination);

  // there can be no displaced if:
  // - you are in the home index or
  // - in the last position of a foreign droppable
  const lastDisplaced: ?DraggableDimension = displaced.length
    ? draggables[displaced[0].draggableId]
    : null;

  // dropping back into home index
  if (inHomeList && !lastDisplaced) {
    return null;
  }

  // TODO: last spot in foreign list
  if (!lastDisplaced) {
    return null;
  }

  const displacedBy: Position = impact.movement.displacedBy.point;
  const displacedClient: BoxModel = offset(lastDisplaced.client, displacedBy);
  const draggableClient: BoxModel = draggable.client;
  const shouldDropInFrontOfDisplaced: boolean = !willDisplaceForward;

  // going in front of displaced item
  if (shouldDropInFrontOfDisplaced) {
    return patch(
      axis.line,
      displacedClient.marginBox[axis.end] +
        draggableClient.margin.top +
        draggableClient.border.top +
        draggableClient.padding.top +
        draggableClient.contentBox[axis.size] / 2,
      displacedClient.marginBox.center[axis.crossAxisLine],
    );
  }

  // going behind displaced item
  return patch(
    axis.line,
    displacedClient.marginBox[axis.start] -
      draggableClient.margin.bottom -
      draggableClient.border.bottom -
      draggableClient.padding.bottom -
      draggableClient.contentBox[axis.size] / 2,
    displacedClient.marginBox.center[axis.crossAxisLine],
  );
};
