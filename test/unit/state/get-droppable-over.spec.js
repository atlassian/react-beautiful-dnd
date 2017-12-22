// @flow
import getDroppableOver from '../../../src/state/get-droppable-over';
import { getPreset } from '../../utils/dimension';
import { getDroppableDimension, getDraggableDimension } from '../../../src/state/dimension';
import getArea from '../../../src/state/get-area';
import type {
  Area,
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  Spacing,
  DroppableId,
  Position,
} from '../../../src/types';

const noPosition = { x: 0, y: 0 };
const preset = getPreset();

// TODO: tests for window scroll changes?

// Most functionality is tested by get getInsideDimension
describe('get droppable over', () => {
  it('should return null if the target is not over any dimension', () => {
    const target: Position = {
      x: 100000,
      y: 100000,
    };

    const result: ?DroppableId = getDroppableOver({
      target,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousDroppableOverId: null,
    });

    expect(result).toBe(null);
  });

  it('should return the id of the droppable that the target is over', () => {
    Object.keys(preset.draggables).forEach((id: DraggableId) => {
      const draggable: DraggableDimension = preset.draggables[id];

      const result: ?DroppableId = getDroppableOver({
        target: draggable.page.withoutMargin.center,
        draggable,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousDroppableOverId: null,
      });

      expect(result).toBe(draggable.descriptor.droppableId);
    });
  });

  describe('placeholder buffer', () => {
    const margin: Spacing = {
      top: 10, right: 10, bottom: 10, left: 10,
    };
    const droppableClient: Area = getArea({
      top: 10,
      left: 10,
      right: 90,
      bottom: 90,
    });
    const home: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'home',
        type: 'TYPE',
      },
      client: droppableClient,
      margin,
    });
    const inHome1: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'in-home-1',
        droppableId: home.descriptor.id,
        index: 0,
      },
      client: getArea({
        top: 10,
        left: 10,
        right: 90,
        // almost takes up the whole droppable
        bottom: 80,
      }),
      margin,
    });
    const inForeign1: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'in-foreign-1',
        droppableId: 'foreign',
        index: 0,
      },
      client: getArea({
        // to the right of inHome1
        left: 200,
        right: 250,
        // initially the same vertically
        top: 10,
        // almost takes up the whole droppable
        bottom: 80,
      }),
      margin,
    });
    const draggables: DraggableDimensionMap = {
      [inHome1.descriptor.id]: inHome1,
      [inForeign1.descriptor.id]: inForeign1,
    };
    const droppables: DroppableDimensionMap = {
      [home.descriptor.id]: home,
    };

    describe('is dragging over nothing', () => {
      it('should not add any placeholder buffer', () => {
        const target: Position = {
          x: 10000,
          y: 10000,
        };
        // dragging inForeign1 just below inHome1
        const result: ?DroppableId = getDroppableOver({
          target,
          draggable: inForeign1,
          draggables,
          droppables,
          previousDroppableOverId: null,
        });

        expect(result).toBe(null);
      });
    });

    describe('is dragging over home droppable', () => {
      it('should not add any placeholder buffer', () => {
        // just below home
        const target: Position = {
          x: home.page.withMargin.center.x,
          y: home.page.withMargin.bottom + 1,
        };
        // dragging inHome1 just below home
        const result: ?DroppableId = getDroppableOver({
          target,
          draggable: inHome1,
          draggables,
          droppables,
          previousDroppableOverId: null,
        });

        expect(result).toBe(null);
      });
    });

    describe('over foreign droppable', () => {
      describe('droppable has no scroll container', () => {
        it('should not add a buffer if it was not previously over the foreign droppable', () => {
          // just below home
          const target: Position = {
            x: home.page.withMargin.center.x,
            y: home.page.withMargin.bottom + 1,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables,
            previousDroppableOverId: null,
          });

          expect(result).toBe(null);
        });

        it('should add a placeholder buffer when previously dragging over', () => {
          // just below home
          const target: Position = {
            x: home.page.withMargin.center.x,
            y: home.page.withMargin.bottom + 1,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables,
            previousDroppableOverId: home.descriptor.id,
          });

          expect(result).toBe(home.descriptor.id);
        });

        it('should add as much space as required to fit a placeholder', () => {
          // at the end of the placeholder
          const target: Position = {
            x: inHome1.page.withMargin.center.x,
            y: inHome1.page.withMargin.bottom + inForeign1.page.withMargin.bottom,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables,
            previousDroppableOverId: home.descriptor.id,
          });

          expect(result).toBe(home.descriptor.id);
        });

        it('should not extend beyond what is required', () => {
          // at the end of the placeholder
          const target: Position = {
            x: inHome1.page.withMargin.center.x,
            y: inHome1.page.withMargin.bottom + inForeign1.page.withMargin.bottom + 1,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables,
            previousDroppableOverId: home.descriptor.id,
          });

          expect(result).toBe(null);
        });
      });

      describe('droppable has scroll container', () => {
        // TODO: as above + frame clipping
      });
    });
  });
});
