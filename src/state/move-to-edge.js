// @flow
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

// being clear that this function returns the new center position
type CenterPosition = Position;

export default ({
  source,
  sourceEdge,
  destination,
  destinationEdge,
  destinationAxis,
}: Args): CenterPosition => {
  // Wanting to move the edge of a draggable to the edge of something else


};
