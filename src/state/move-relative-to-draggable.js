// @flow
import type { Position, BoxModel } from 'css-box-model';
import { patch } from './position';
import type { Axis } from '../types';

type Args = {|
  axis: Axis,
  moveRelativeTo: BoxModel,
  isMoving: BoxModel,
|};

export const goAfter = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    moveRelativeTo.marginBox[axis.end] +
      isMoving.margin.top +
      isMoving.border.top +
      isMoving.padding.top +
      isMoving.contentBox[axis.size] / 2,
    moveRelativeTo.marginBox.center[axis.crossAxisLine],
  );

export const goBefore = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    moveRelativeTo.marginBox[axis.start] -
      isMoving.margin.bottom -
      isMoving.border.bottom -
      isMoving.padding.bottom -
      isMoving.contentBox[axis.size] / 2,
    moveRelativeTo.marginBox.center[axis.crossAxisLine],
  );
