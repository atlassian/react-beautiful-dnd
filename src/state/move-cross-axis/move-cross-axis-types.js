// @flow
import { type Position } from 'css-box-model';
import type { DragImpact } from '../../types';

export type Result = {|
  // how far the draggable needs to move to be in its new home
  pageBorderBoxCenter: Position,
  // The impact of the movement
  impact: DragImpact,
|};
