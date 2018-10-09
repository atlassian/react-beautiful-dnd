// @flow
import type { Position } from 'css-box-model';
import type { DragImpact } from '../../../types';

export type MoveResult = {|
  pageBorderBoxCenter: Position,
  impact: DragImpact,
|};
