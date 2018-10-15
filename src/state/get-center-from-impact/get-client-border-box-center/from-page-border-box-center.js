// @flow
import type { Position } from 'css-box-model';
import type { Viewport, DraggableDimension } from '../../../types';
import { add, subtract } from '../../position';
import withViewportDisplacement from '../../with-scroll-change/with-viewport-displacement';

type Args = {|
  pageBorderBoxCenter: Position,
  draggable: DraggableDimension,
  viewport: Viewport,
|};

export default ({
  pageBorderBoxCenter,
  draggable,
  viewport,
}: Args): Position => {
  const offsetWithWindowScrollChange: Position = subtract(
    pageBorderBoxCenter,
    draggable.page.borderBox.center,
  );

  const clientOffset: Position = withViewportDisplacement(
    viewport,
    offsetWithWindowScrollChange,
  );

  return add(draggable.client.borderBox.center, clientOffset);
};
