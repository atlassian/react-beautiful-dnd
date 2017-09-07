// @flow
import getBestCrossAxisDroppable from '../../../../src/state/move-to-best-droppable/get-best-cross-axis-droppable';
import { getDroppableDimension } from '../../../../src/state/dimension';
import getClientRect from '../../../utils/get-client-rect';
import { horizontal, vertical } from '../../../../src/state/axis';
import type {
  Axis,
  DroppableDimension,
  DroppableDimensionMap,
} from '../../../../src/types';

describe('get best cross axis droppable', () => {
  // TODO: horizontal
  [vertical].forEach((axis: Axis) => {
    it('should return the first droppable on the cross axis', () => {
      const source = getDroppableDimension({
        id: 'source',
        direction: axis.direction,
        clientRect: getClientRect({
          top: 0,
          left: 20,
          right: 30,
          bottom: 10,
        }),
      });
      const forward = getDroppableDimension({
        id: 'forward',
        direction: axis.direction,
        clientRect: getClientRect({
          top: 0,
          left: 30,
          right: 40,
          bottom: 10,
        }),
      });
      const droppables: DroppableDimensionMap = {
        [source.id]: source,
        [forward.id]: forward,
      };

      const result: ?DroppableDimension = getBestCrossAxisDroppable({
        isMovingForward: true,
        pageCenter: source.page.withMargin.center,
        source,
        droppables,
      });

      expect(result).toBe(forward);
    });

    it('should exclude options that are not in the desired direction', () => {
      const source = getDroppableDimension({
        id: 'source',
        direction: axis.direction,
        clientRect: getClientRect({
          top: 0,
          left: 20,
          right: 30,
          bottom: 10,
        }),
      });
      const behind = getDroppableDimension({
        id: 'behind',
        direction: axis.direction,
        clientRect: getClientRect({
          top: 0,
          left: 0,
          right: 10,
          bottom: 10,
        }),
      });
      const droppables: DroppableDimensionMap = {
        [behind.id]: behind,
        [source.id]: source,
      };

      const result: ?DroppableDimension = getBestCrossAxisDroppable({
        isMovingForward: true,
        pageCenter: source.page.withMargin.center,
        source,
        droppables,
      });

      expect(result).toBe(null);
    });

    it('should exclude options that are not enabled', () => {
      const source = getDroppableDimension({
        id: 'source',
        direction: axis.direction,
        clientRect: getClientRect({
          top: 0,
          left: 20,
          right: 30,
          bottom: 10,
        }),
      });
      const forward = getDroppableDimension({
        id: 'forward',
        isEnabled: false,
        direction: axis.direction,
        clientRect: getClientRect({
          top: 0,
          left: 30,
          right: 40,
          bottom: 10,
        }),
      });
      const droppables: DroppableDimensionMap = {
        [source.id]: source,
        [forward.id]: forward,
      };

      const result: ?DroppableDimension = getBestCrossAxisDroppable({
        isMovingForward: true,
        pageCenter: source.page.withMargin.center,
        source,
        droppables,
      });

      expect(result).toBe(null);
    });

    it('should exclude options that do not overlap on the main axis', () => {

    });

    describe('more than one option share the same crossAxisStart value', () => {
      it('should return a droppable where the center position (axis.line) of the draggable draggable sits within the size of a droppable', () => {

      });

      describe('center point is not contained within a droppable', () => {
        it('should return the droppable that has the closest corner', () => {

        });
      });
    });
  });
});
