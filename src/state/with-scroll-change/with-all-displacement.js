// @flow
import type { Position } from 'css-box-model';
import type { DroppableDimension, Viewport } from '../../types';
import withDroppableDisplacement from './with-droppable-displacement';
import withViewportDisplacement from './with-viewport-displacement';

export default (
  page: Position,
  droppable: DroppableDimension,
  viewport: Viewport,
): Position =>
  withDroppableDisplacement(
    droppable,
    withViewportDisplacement(viewport, page),
  );
