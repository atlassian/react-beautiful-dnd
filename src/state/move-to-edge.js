// @flow
import { absolute, add, patch, negate, subtract } from './position';
import type {
  Axis,
  Position,
  DraggableDimension,
  DimensionFragment,
} from '../types';

type Edge = 'start' | 'end';

type Args = {|
  source: DraggableDimension,
  sourceEdge: Edge,
  destination: DimensionFragment,
  destinationEdge: Edge,
  destinationAxis: Axis,
|}

// Being clear that this function returns the new center position
type CenterPosition = Position;

// This function will return the center position required to move
// a draggable to the edge of a dimension fragment (could be a droppable or draggable).
// The center position will be aligned to the axis.crossAxisStart value rather than
// the center position of the destination. This allows for generally a better
// experience when moving between lists of different cross axis size.
// The size difference can be caused by the presence or absence of scroll bars

export default ({
  source,
  sourceEdge,
  destination,
  destinationEdge,
  destinationAxis,
}: Args): CenterPosition => {
  const getCorner = (fragment: DimensionFragment): Position => patch(
    destinationAxis.line,
    fragment[destinationAxis[destinationEdge]],
    fragment[destinationAxis.crossAxisStart]
  );

  // 1. Find the intersection corner point
  // 2. add the difference between that point and the center of the dimension

  const corner: Position = getCorner(destination);

  // the difference between the center of the draggable and its corner
  const centerDiff = absolute(subtract(
    source.page.withoutMargin.center,
    getCorner(source.page.withoutMargin)
  ));

  const signed: Position = patch(
    destinationAxis.line,
    (sourceEdge === 'start' ? 1 : -1) * centerDiff[destinationAxis.line],
    centerDiff[destinationAxis.crossLine],
  );

  return add(corner, signed);
};
