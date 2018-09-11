// @flow
import type { Position } from 'css-box-model';
import type { DraggableDimension } from '../../../../types';

type RemoveClosest = {|
  type: 'REMOVE_CLOSEST',
|};

type AddClosest = {|
  type: 'ADD_CLOSEST',
  add: DraggableDimension,
|};

type DoNothing = {|
  type: 'DO_NOTHING',
|};

export type ChangeDisplacement = RemoveClosest | AddClosest | DoNothing;

export type MoveFromResult = {|
  newPageBorderBoxCenter: Position,
  changeDisplacement: ChangeDisplacement,
  willDisplaceForward: boolean,
  proposedIndex: number,
|};
