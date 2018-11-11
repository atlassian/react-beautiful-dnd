// @flow
import type { Position } from 'css-box-model';
import type {
  UserDirection,
  VerticalUserDirection,
  HorizontalUserDirection,
} from '../../types';
import { subtract } from '../position';

const getVertical = (
  previous: VerticalUserDirection,
  diff: number,
): VerticalUserDirection => {
  if (diff === 0) {
    return previous;
  }
  return diff > 0 ? 'down' : 'up';
};

const getHorizontal = (
  previous: HorizontalUserDirection,
  diff: number,
): HorizontalUserDirection => {
  if (diff === 0) {
    return previous;
  }
  return diff > 0 ? 'right' : 'left';
};

export default (
  previous: UserDirection,
  oldPageBorderBoxCenter: Position,
  newPageBorderBoxCenter: Position,
): UserDirection => {
  const diff: Position = subtract(
    newPageBorderBoxCenter,
    oldPageBorderBoxCenter,
  );

  return {
    horizontal: getHorizontal(previous.horizontal, diff.x),
    vertical: getVertical(previous.vertical, diff.y),
  };
};
