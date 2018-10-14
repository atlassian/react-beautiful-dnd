// @flow
import type { Position } from 'css-box-model';
import type { DragImpact } from '../../types';

export type ScrollJumpResult = {|
  type: 'SCROLL_JUMP',
  request: Position,
  impact: DragImpact,
|};

export type SnapMoveResult = {|
  type: 'SNAP_MOVE',
  impact: DragImpact,
|};

export type InternalResult = ScrollJumpResult | SnapMoveResult;

export type PublicResult = {|
  clientSelection: Position,
  impact: DragImpact,
  scrollJumpRequest: ?Position,
|};
