// @flow
import isWithin from '../is-within';
import type {
  Spacing,
} from '../../types';

export default (frame: Spacing) => {
  const isWithinVertical = isWithin(frame.top, frame.bottom);
  const isWithinHorizontal = isWithin(frame.left, frame.right);

  return (subject: Spacing) => {
    const isContained: boolean =
      isWithinVertical(subject.top) &&
      isWithinVertical(subject.bottom) &&
      isWithinHorizontal(subject.left) &&
      isWithinHorizontal(subject.right);

    return isContained;
  };
};
