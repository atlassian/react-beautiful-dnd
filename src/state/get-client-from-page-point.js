// @flow
import type { Position } from 'css-box-model';
import type { Viewport } from '../types';
import { subtract } from './position';

export default (page: Position, viewport: Viewport): Position =>
  subtract(page, viewport.scroll.initial);
