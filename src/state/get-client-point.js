// @flow
import type { Position } from 'css-box-model';
import type { DroppableDimension, Viewport } from '../types';
import withDroppableDisplacement from './with-droppable-displacement';
import { add } from './position';

const withoutDroppableScroll = (
  droppable: DroppableDimension,
  point: Position,
): Position => withDroppableDisplacement(droppable, point);

const withoutPageScroll = (viewport: Viewport, point: Position): Position =>
  add(viewport.scroll.diff.displacement, point);

export default (
  page: Position,
  droppable: DroppableDimension,
  viewport: Viewport,
): Position =>
  withoutDroppableScroll(droppable, withoutPageScroll(viewport, page));
