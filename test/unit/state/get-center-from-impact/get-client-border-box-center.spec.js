// @flow
import type { Position } from 'css-box-model';
import type {
  DraggableDimension,
  Viewport,
  DragImpact,
} from '../../../../src/types';
import { add, subtract, negate } from '../../../../src/state/position';
import { getPreset } from '../../../utils/dimension';
import scrollViewport from '../../../../src/state/scroll-viewport';
import getClientBorderBoxCenter from '../../../../src/state/get-center-from-impact/get-client-border-box-center';
import getHomeImpact from '../../../../src/state/get-home-impact';

const preset = getPreset();

const draggable: DraggableDimension = preset.inHome1;
const originalClientCenter: Position = preset.inHome1.client.borderBox.center;
const impact: DragImpact = getHomeImpact(draggable, preset.home);

it('should give the client center without scroll change', () => {
  const result: Position = getClientBorderBoxCenter({
    impact,
    draggable,
    droppable: preset.home,
    draggables: preset.dimensions.draggables,
    viewport: preset.viewport,
  });

  expect(result).toEqual(originalClientCenter);
});

it('should unwind any changes in viewport scroll', () => {
  const scroll: Position = { x: 10, y: 20 };
  const newScroll: Position = add(preset.windowScroll, scroll);
  const scrolled: Viewport = scrollViewport(preset.viewport, newScroll);

  const result: Position = getClientBorderBoxCenter({
    impact,
    draggable,
    droppable: preset.home,
    draggables: preset.dimensions.draggables,
    viewport: scrolled,
  });

  expect(result).toEqual(originalClientCenter);
});
