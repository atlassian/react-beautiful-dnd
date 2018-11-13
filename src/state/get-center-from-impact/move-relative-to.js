// @flow
import type { Position, BoxModel, Rect } from 'css-box-model';
import { patch } from '../position';
import type { Axis } from '../../types';

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

const distanceFromCrossAxisStartToCenter = (
  axis: Axis,
  box: BoxModel,
): number =>
  box.margin[axis.crossAxisStart] +
  box.border[axis.crossAxisStart] +
  box.padding[axis.crossAxisStart] +
  box.contentBox[axis.crossAxisSize] / 2;

const getCrossAxisCenter = (
  axis: Axis,
  target: Rect,
  isMoving: BoxModel,
): number =>
  target[axis.crossAxisStart] +
  distanceFromCrossAxisStartToCenter(axis, isMoving);

export const goAfter = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    // start measuring from the bottom of the target
    moveRelativeTo.marginBox[axis.end] +
      distanceFromStartToCenter(axis, isMoving),
    getCrossAxisCenter(axis, moveRelativeTo.marginBox, isMoving),
  );

export const goBefore = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    // start measuring from the top of the target
    moveRelativeTo.marginBox[axis.start] -
      distanceFromEndToCenter(axis, isMoving),
    getCrossAxisCenter(axis, moveRelativeTo.marginBox, isMoving),
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
    getCrossAxisCenter(axis, moveInto.contentBox, isMoving),
  );
