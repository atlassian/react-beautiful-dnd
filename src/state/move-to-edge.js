// @flow
import { absolute, add, patch, subtract } from './position';
import type {
  Axis,
  Position,
  Area,
} from '../types';

export type Edge = 'start' | 'end';

type Args = {|
  source: Area,
  sourceEdge: Edge,
  destination: Area,
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
  const getCorner = (fragment: Area): Position => patch(
    destinationAxis.line,
    // it does not really matter what edge we use here
    // as the difference to the center from edges will be the same
    fragment[destinationAxis[destinationEdge]],
    fragment[destinationAxis.crossAxisStart]
  );

  // 1. Find the intersection corner point
  // 2. add the difference between that point and the center of the dimension
  const corner: Position = getCorner(destination);

  // the difference between the center of the draggable and its corner
  const centerDiff = absolute(subtract(
    source.center,
    getCorner(source)
  ));

  const signed: Position = patch(
    destinationAxis.line,
    // if moving to the end edge - we need to pull the source backwards
    (sourceEdge === 'end' ? -1 : 1) * centerDiff[destinationAxis.line],
    centerDiff[destinationAxis.crossLine],
  );

  return add(corner, signed);
};
