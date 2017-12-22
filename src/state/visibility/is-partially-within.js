// @flow
import isWithin from '../is-within';
import type {
  Spacing,
} from '../../types';

export default (container: Spacing) => {
  const isWithinVertical = isWithin(container.top, container.bottom);
  const isWithinHorizontal = isWithin(container.left, container.right);

  return (target: Spacing): boolean => {
    const isPartiallyVisibleVertically: boolean =
      isWithinVertical(target.top) || isWithinVertical(target.bottom);
    const isPartiallyVisibleHorizontally: boolean =
      isWithinHorizontal(target.left) || isWithinHorizontal(target.right);

    const isPartiallyVisible = isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;

    if (isPartiallyVisible) {
      return true;
    }

    // is completely bigger than on a single axis?
    const isBiggerVertically = target.top < container.top && target.bottom > container.bottom;
    const isBiggerHorizontally = target.left < container.left && target.right > container.right;

    return (isBiggerVertically && isPartiallyVisibleHorizontally) ||
      (isBiggerHorizontally && isPartiallyVisibleVertically);

    // const isTotallyBiggerThan =
    //   target.top < container.top &&
    //   target.right > container.right &&
    //   target.bottom > container.bottom &&
    //   target.left < container.left;

    // console.log('is totally bigger than?', isTotallyBiggerThan);
    // console.log('target', target);
    // console.log('container', container);

    // return isTotallyBiggerThan;

    // Needs to be partially visible both vertically and horizontally to
    // be actually visible by the user.
    // return isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;
  };
};
