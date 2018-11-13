// @flow
import type { Position, BoxModel } from 'css-box-model';
import { patch } from '../position';
import type { Axis } from '../../types';

type Args = {|
  axis: Axis,
  moveRelativeTo: BoxModel,
  isMoving: BoxModel,
  isOverHome: boolean,
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

const getCrossAxisCenter = ({
  axis,
  moveRelativeTo,
  isMoving,
  isOverHome,
}: Args): number => {
  // Sometimes we can be in a home list that has items of different sizes.
  // Eg: columns in a horizontal list

  // home list: use the center from the moving item
  // foreign list: use the center from the box we are moving relative to

  // TODO: what if a foreign list has items of different sizes?

  const target: BoxModel = isOverHome ? isMoving : moveRelativeTo;

  return target.borderBox.center[axis.crossAxisLine];
};

export const goAfter = ({
  axis,
  moveRelativeTo,
  isMoving,
  isOverHome,
}: Args): Position =>
  patch(
    axis.line,
    // start measuring from the bottom of the target
    moveRelativeTo.marginBox[axis.end] +
      distanceFromStartToCenter(axis, isMoving),
    getCrossAxisCenter({ axis, moveRelativeTo, isMoving, isOverHome }),
  );

export const goBefore = ({
  axis,
  moveRelativeTo,
  isMoving,
  isOverHome,
}: Args): Position =>
  patch(
    axis.line,
    // start measuring from the top of the target
    moveRelativeTo.marginBox[axis.start] -
      distanceFromEndToCenter(axis, isMoving),
    getCrossAxisCenter({ axis, moveRelativeTo, isMoving, isOverHome }),
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
