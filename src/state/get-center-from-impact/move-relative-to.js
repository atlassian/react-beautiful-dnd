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

// We align the moving item against the cross axis start of the target
// We used to align the moving item cross axis center with the cross axis center of the target.
// However, this leads to a bad experience when reordering columns
// We use the marginBox crossAxisSize of the moving item rather than
// building up a `distanceFromCrossAxisStart` as it might have unbalanced spacing
// (such as bigger padding on one side then the other)
const getCrossAxisCenter = (
  axis: Axis,
  target: Rect,
  isMoving: BoxModel,
): number =>
  target[axis.crossAxisStart] + isMoving.marginBox[axis.crossAxisSize] / 2;

export const goAfter = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    // start measuring from the end of the target
    moveRelativeTo.marginBox[axis.end] +
      distanceFromStartToCenter(axis, isMoving),
    getCrossAxisCenter(axis, moveRelativeTo.marginBox, isMoving),
  );

export const goBefore = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    // start measuring from the start of the target
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
