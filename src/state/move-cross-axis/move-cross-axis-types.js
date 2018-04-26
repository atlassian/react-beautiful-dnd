// @flow
import type { Position, DragImpact } from '../../types';

export type Result = {|
  // how far the draggable needs to move to be in its new home
  // TODO: pageBorderBoxCenter
  pageCenter: Position,
  // The impact of the movement
  impact: DragImpact,
|}
