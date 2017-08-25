// @flow
import memoizeOne from 'memoize-one';
import { closest } from './position';
import type {
  Axis,
  Position,
  DimensionFragment,
  DroppableId,
  DroppableDimension,
  DroppableDimensionMap,
} from '../types';

type DistanceToDroppable = {|
  id: DroppableId,
  distance: number,
|}

const sortOnMainAxis = memoizeOne(
  (droppables: DroppableDimensionMap, axis: Axis): DroppableDimension[] =>
    Object.keys(droppables)
      .map((key: DroppableId): DroppableDimension => droppables[key])
      .sort((a: DroppableDimension, b: DroppableDimension) => (
        a.page.withMargin[axis.start] - b.page.withMargin[axis.start]
      )
  )
);

const isWithin = (lowerBound: number, upperBound: number): ((number) => boolean) =>
  (value: number): boolean => value <= upperBound && value >= lowerBound;

const getCorners = (droppable: DroppableDimension): Position[] => {
  const fragment: DimensionFragment = droppable.page.withMargin;

  return [
    { x: fragment.left, y: fragment.top },
    { x: fragment.right, y: fragment.top },
    { x: fragment.left, y: fragment.bottom },
    { x: fragment.right, y: fragment.bottom },
  ];
};

type GetBestDroppableArgs = {|
  isMovingForward: boolean,
  center: Position,
  droppableId: DroppableId,
  droppables: DroppableDimensionMap,
|}

export default ({
  isMovingForward,
  center,
  droppableId,
  droppables,
}: GetBestDroppableArgs): ?DroppableId => {
  const source: DroppableDimension = droppables[droppableId];
  const axis: Axis = source.axis;
  const sorted: DroppableDimension[] = sortOnMainAxis(droppables, axis);

  // ...
};
