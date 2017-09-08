// @flow
import isWithin from './is-within';
import type {
  Position,
  DroppableDimension,
  DimensionFragment,
} from '../types';

export default (target: Position, droppable: DroppableDimension): boolean => {
  const fragment: DimensionFragment = droppable.page.withMargin;
  const { top, right, bottom, left } = fragment;

  console.log('is within droppable?', fragment, target);

  return isWithin(left, right)(target.x) &&
    isWithin(top, bottom)(target.y);
};
