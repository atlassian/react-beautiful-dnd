// @flow
import type { Position } from 'css-box-model';
import type { DraggableDimension } from '../../../../types';

export type InListResult = {|
  newPageBorderBoxCenter: Position,
  addToDisplacement: ?DraggableDimension,
  isInFrontOfStart: boolean,
  proposedIndex: number,
|};
