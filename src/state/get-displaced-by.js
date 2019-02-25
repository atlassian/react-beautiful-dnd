// @flow
import memoizeOne from 'memoize-one';
import { type Position } from 'css-box-model';
import type { Axis, DisplacedBy } from '../types';
import { patch } from './position';

// TODO: memoization needed?
export default memoizeOne(
  (axis: Axis, displaceBy: Position): DisplacedBy => {
    const displacement: number = displaceBy[axis.line];
    return {
      value: displacement,
      point: patch(axis.line, displacement),
    };
  },
);
