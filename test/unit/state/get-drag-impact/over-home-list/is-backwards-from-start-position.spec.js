// @flow
import { type Position } from 'css-box-model';
import getDragImpact from '../../../../../src/state/get-drag-impact';
import noImpact from '../../../../../src/state/no-impact';
import { add, patch, subtract } from '../../../../../src/state/position';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { scrollDroppable } from '../../../../../src/state/droppable-dimension';
import {
  getPreset,
  disableDroppable,
  makeScrollable,
  getDroppableDimension,
  getDraggableDimension,
} from '../../../../utils/dimension';
import getViewport from '../../../../../src/view/window/get-viewport';
import getDisplacementMap from '../../../../../src/state/get-displacement-map';
import type {
  Axis,
  DraggableDimension,
  DroppableDimension,
  DroppableDimensionMap,
  DragImpact,
  DraggableDimensionMap,
  Viewport,
  UserDirection,
  Displacement,
} from '../../../../../src/types';

const viewport: Viewport = getViewport();
const dontCareAboutDirection: UserDirection = {
  vertical: 'down',
  horizontal: 'right',
};

[(vertical, horizontal)].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const preset = getPreset(axis);

    // moving inHome3 back past inHome1
    it('should move into the correct position', () => {
      const pageBorderBoxCenter: Position = patch(
        axis.line,
        preset.inHome1.page.borderBox[axis.end] - 1,
        // no change
        preset.inHome3.page.borderBox.center[axis.crossAxisLine],
      );

      const expected: DragImpact = {
        movement: {
          amount: patch(axis.line, inHome3.page.marginBox[axis.size]),
          // ordered by closest to current location
          displaced: [
            {
              draggableId: inHome1.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
            {
              draggableId: inHome2.descriptor.id,
              isVisible: true,
              shouldAnimate: true,
            },
          ],
          isBeyondStartPosition: false,
        },
        direction: axis.direction,
        destination: {
          droppableId: home.descriptor.id,
          // is now before inHome1
          index: 0,
        },
      };

      const impact: DragImpact = getDragImpact({
        pageBorderBoxCenter,
        draggable: inHome3,
        draggables,
        droppables,
        previousImpact: noImpact,
        viewport,
      });

      expect(impact).toEqual(expected);
    });
  });
});
