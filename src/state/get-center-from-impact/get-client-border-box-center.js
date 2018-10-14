// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  DragImpact,
  DraggableDimension,
  DraggableDimensionMap,
} from '../../types';
import { subtract, add, isEqual, origin } from '../position';
import getPageBorderBoxCenterFromImpact from './get-page-border-box-center';
import withViewportDisplacement from '../with-scroll-change/with-viewport-displacement';

type Args = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
  viewport: Viewport,
|};

export default ({
  impact,
  draggable,
  droppable,
  draggables,
  viewport,
}: Args): Position => {
  const newBorderBoxPageCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    draggables,
    droppable,
  });

  if (isEqual(draggable.page.borderBox.center, newBorderBoxPageCenter)) {
    console.warn('no change in border box center');
  }

  const offsetWithWindowScrollChange: Position = subtract(
    newBorderBoxPageCenter,
    draggable.page.borderBox.center,
  );

  const clientOffset: Position = withViewportDisplacement(
    viewport,
    offsetWithWindowScrollChange,
  );

  if (isEqual(clientOffset, origin)) {
    console.warn('no change in client pos');
  }

  return add(draggable.client.borderBox.center, clientOffset);
};
