// @flow
import type { Position, BoxModel } from 'css-box-model';
import { patch } from './position';
import type { Axis } from '../types';

type Args = {|
  axis: Axis,
  moveRelativeTo: BoxModel,
  isMoving: BoxModel,
|};

const distanceFromTopToCenter = (axis: Axis, box: BoxModel): number =>
  box.margin.top +
  box.border.top +
  box.padding.top +
  box.contentBox[axis.size] / 2;

const distanceFromBottomToCenter = (axis: Axis, box: BoxModel): number =>
  box.margin.bottom +
  box.border.bottom +
  box.padding.bottom +
  box.contentBox[axis.size] / 2;

export const goAfter = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    moveRelativeTo.marginBox[axis.end] +
      distanceFromTopToCenter(axis, isMoving),
    moveRelativeTo.marginBox.center[axis.crossAxisLine],
  );

export const goBefore = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    moveRelativeTo.marginBox[axis.start] -
      distanceFromBottomToCenter(axis, isMoving),
    moveRelativeTo.marginBox.center[axis.crossAxisLine],
  );

type GoIntoArgs = {|
  axis: Axis,
  moveInto: BoxModel,
  isMoving: BoxModel,
|};

// moves into the content box
export const goIntoStart = ({
  axis,
  moveInto,
  isMoving,
}: GoIntoArgs): Position =>
  patch(
    axis.line,
    moveInto.contentBox[axis.start] + distanceFromTopToCenter(axis, isMoving),
    moveInto.contentBox.center[axis.crossAxisLine],
  );
