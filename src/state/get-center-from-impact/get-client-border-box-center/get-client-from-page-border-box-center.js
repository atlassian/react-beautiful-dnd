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
  const withoutPageScrollChange: Position = withViewportDisplacement(
    viewport,
    pageBorderBoxCenter,
  );

  const offset: Position = subtract(
    withoutPageScrollChange,
    draggable.page.borderBox.center,
  );

  return add(draggable.client.borderBox.center, offset);
};
