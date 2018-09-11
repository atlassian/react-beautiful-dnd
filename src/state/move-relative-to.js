// @flow
import type { Position, BoxModel } from 'css-box-model';
import { patch } from './position';
import type { Axis } from '../types';

type Args = {|
  axis: Axis,
  moveRelativeTo: BoxModel,
  isMoving: BoxModel,
|};

const distanceFromStartToCenter = (axis: Axis, box: BoxModel): number =>
  box.margin[axis.start] +
  box.border[axis.start] +
  box.padding[axis.start] +
  box.contentBox[axis.size] / 2;

const distanceFromEndToCenter = (axis: Axis, box: BoxModel): number =>
  box.margin[axis.end] +
  box.border[axis.end] +
  box.padding[axis.end] +
  box.contentBox[axis.size] / 2;

export const goAfter = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    moveRelativeTo.marginBox[axis.end] +
      distanceFromStartToCenter(axis, isMoving),
    moveRelativeTo.marginBox.center[axis.crossAxisLine],
  );

export const goBefore = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    moveRelativeTo.marginBox[axis.start] -
      distanceFromEndToCenter(axis, isMoving),
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
    moveInto.contentBox[axis.start] + distanceFromStartToCenter(axis, isMoving),
    moveInto.contentBox.center[axis.crossAxisLine],
  );
