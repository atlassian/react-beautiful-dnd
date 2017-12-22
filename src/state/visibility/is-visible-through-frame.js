// @flow
import isWithin from '../is-within';
import type {
  Spacing,
} from '../../types';

export default (frame: Spacing) => {
  const isWithinVertical = isWithin(frame.top, frame.bottom);
  const isWithinHorizontal = isWithin(frame.left, frame.right);

  return (target: Spacing) => {
    // situations where target is visible:
    // 1. is completely contained within frame
    // 2. is partially visible on both axis within frame
    // 3. is bigger than frame on both axis
    // 4. is bigger than frame on one axis and is partially visible on the other

    // completely contained
    const isContained: boolean =
      isWithinVertical(target.top) &&
      isWithinVertical(target.bottom) &&
      isWithinHorizontal(target.left) &&
      isWithinHorizontal(target.right);

    if (isContained) {
      return true;
    }

    const isPartiallyVisibleVertically: boolean =
      isWithinVertical(target.top) || isWithinVertical(target.bottom);
    const isPartiallyVisibleHorizontally: boolean =
      isWithinHorizontal(target.left) || isWithinHorizontal(target.right);

    // partially visible on both axis
    const isPartiallyContained: boolean =
      isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;

    if (isPartiallyContained) {
      return true;
    }

    const isBiggerVertically: boolean = target.top < frame.top && target.bottom > frame.bottom;
    const isBiggerHorizontally: boolean = target.left < frame.left && target.right > frame.right;

    // is bigger than frame on both axis
    const isTargetBiggerThanFrame: boolean =
      isBiggerVertically && isBiggerHorizontally;

    if (isTargetBiggerThanFrame) {
      return true;
    }

    // is bigger on one axis, and partially visible on another
    const isTargetBiggerOnOneAxis: boolean =
      (isBiggerVertically && isPartiallyVisibleHorizontally) ||
      (isBiggerHorizontally && isPartiallyVisibleVertically);

    return isTargetBiggerOnOneAxis;
  };
};
