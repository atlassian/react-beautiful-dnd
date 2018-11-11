// @flow
import { type Position } from 'css-box-model';
import type { Viewport } from '../../types';
import { add } from '../position';

export default (viewport: Viewport, point: Position): Position =>
  add(viewport.scroll.diff.displacement, point);
