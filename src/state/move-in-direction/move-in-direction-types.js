// @flow
import type { Position } from 'css-box-model';
import type { DragImpact } from '../../types';

export type PublicResult = {|
  clientSelection: Position,
  impact: DragImpact,
  scrollJumpRequest: ?Position,
|};
