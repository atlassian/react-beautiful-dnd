// @flow
import { type Spacing } from 'css-box-model';
import isWithin from '../is-within';

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
