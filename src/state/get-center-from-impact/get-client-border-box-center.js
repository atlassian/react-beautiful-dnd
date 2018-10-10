// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  DragImpact,
  DraggableDimension,
  DraggableDimensionMap,
} from '../../types';
import { subtract, add } from '../position';
import getPageBorderBoxCenterFromImpact from './get-page-border-box-center';
import withAllDisplacement from '../with-scroll-change/with-all-displacement';

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

  const originalClientCenter: Position = draggable.client.borderBox.center;

  // unwinding window scroll and manual client movement
  const offset: Position = subtract(
    newBorderBoxPageCenter,
    draggable.page.borderBox.center,
  );

  const newClientCenter: Position = add(originalClientCenter, offset);

  return withAllDisplacement(newClientCenter, droppable, viewport);
};
