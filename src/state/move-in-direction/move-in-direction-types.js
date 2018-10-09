// @flow
import type { Position } from 'css-box-model';
import type { DragImpact } from '../../types';

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

export type InternalResult = ScrollJumpResult | MoveResult;

export type PublicResult = {|
  clientSelection: Position,
  impact: DragImpact,
  scrollJumpRequest: ?Position,
|};
