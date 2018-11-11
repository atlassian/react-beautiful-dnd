// @flow
import { type Spacing } from 'css-box-model';
import type { Axis } from '../../types';
import isWithin from '../is-within';
import { vertical } from '../axis';

export default (axis: Axis) => (frame: Spacing) => {
  const isWithinVertical = isWithin(frame.top, frame.bottom);
  const isWithinHorizontal = isWithin(frame.left, frame.right);

  return (subject: Spacing) => {
    if (axis === vertical) {
      return isWithinVertical(subject.top) && isWithinVertical(subject.bottom);
    }
    return (
      isWithinHorizontal(subject.left) && isWithinHorizontal(subject.right)
    );
  };
};
