// @flow
import type { Position } from 'css-box-model';
import type { DragImpact, DroppableDimension } from '../../types';

export type ScrollJumpResult = {|
  type: 'SCROLL_JUMP',
  request: Position,
  impact: DragImpact,
|};

export type MoveResult = {|
  type: 'MOVE',
  pageBorderBoxCenter: Position,
  impact: DragImpact,
|};

export type CrossAxisResult = {|
  type: 'MOVE_CROSS_AXIS',
  pageBorderBoxCenter: Position,
  impact: DragImpact,
  destination: DroppableDimension,
|};

export type InternalResult = ScrollJumpResult | MoveResult | CrossAxisResult;

export type PublicResult = {|
  clientSelection: Position,
  impact: DragImpact,
  scrollJumpRequest: ?Position,
|};
