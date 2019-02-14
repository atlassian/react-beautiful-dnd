// @flow
import type { Position, BoxModel, Rect } from 'css-box-model';
import { patch } from '../position';
import type { Axis } from '../../types';

type Args = {|
  axis: Axis,
  moveRelativeTo: BoxModel,
  isMoving: BoxModel,
|};

const distanceFromStartToBorderBoxCenter = (
  axis: Axis,
  box: BoxModel,
): number => box.margin[axis.start] + box.borderBox[axis.size] / 2;

const distanceFromEndToBorderBoxCenter = (axis: Axis, box: BoxModel): number =>
  box.margin[axis.end] + box.borderBox[axis.size] / 2;

// We align the moving item against the cross axis start of the target
// We used to align the moving item cross axis center with the cross axis center of the target.
// However, this leads to a bad experience when reordering columns
const getCrossAxisBorderBoxCenter = (
  axis: Axis,
  target: Rect,
  isMoving: BoxModel,
): number =>
  target[axis.crossAxisStart] +
  isMoving.margin[axis.crossAxisStart] +
  isMoving.borderBox[axis.crossAxisSize] / 2;

export const goAfter = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    // start measuring from the end of the target
    moveRelativeTo.marginBox[axis.end] +
      distanceFromStartToBorderBoxCenter(axis, isMoving),
    getCrossAxisBorderBoxCenter(axis, moveRelativeTo.marginBox, isMoving),
  );

export const goBefore = ({ axis, moveRelativeTo, isMoving }: Args): Position =>
  patch(
    axis.line,
    // start measuring from the start of the target
    moveRelativeTo.marginBox[axis.start] -
      distanceFromEndToBorderBoxCenter(axis, isMoving),
    getCrossAxisBorderBoxCenter(axis, moveRelativeTo.marginBox, isMoving),
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
    moveInto.contentBox[axis.start] +
      distanceFromStartToBorderBoxCenter(axis, isMoving),
    getCrossAxisBorderBoxCenter(axis, moveInto.contentBox, isMoving),
  );
