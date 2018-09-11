// @flow
import type { Position } from 'css-box-model';
import type { DragImpact } from '../../../types';

export type Result = {|
  // the new page center position of the element
  pageBorderBoxCenter: Position,
  // the impact of the movement
  impact: DragImpact,
  // Any scroll that is required for the movement.
  // If this is present then the pageBorderBoxCenter and impact
  // will just be the same as the previous drag
  scrollJumpRequest: ?Position,
|};
