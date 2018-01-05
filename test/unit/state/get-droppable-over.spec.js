// @flow
import getDroppableOver from '../../../src/state/get-droppable-over';
import { getPreset, disableDroppable } from '../../utils/dimension';
import { getDroppableDimension, getDraggableDimension, scrollDroppable } from '../../../src/state/dimension';
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

  it('should ignore droppables that are disabled', () => {
    const target: Position = preset.inHome1.page.withoutMargin.center;
    const withDisabled: DroppableDimensionMap = {
      ...preset.droppables,
      [preset.home.descriptor.id]: disableDroppable(preset.home),
    };

    const whileEnabled: ?DroppableId = getDroppableOver({
      target,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousDroppableOverId: null,
    });
    const whileDisabled: ?DroppableId = getDroppableOver({
      target,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppables: withDisabled,
      previousDroppableOverId: null,
    });

    expect(whileEnabled).toBe(preset.home.descriptor.id);
    expect(whileDisabled).toBe(null);
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

        it('should not extend beyond what is required to fit a placeholder', () => {
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

        it('should only add buffer on main axis', () => {
          const target: Position = {
            // too far to the right
            x: inHome1.page.withMargin.right + 1,
            // would otherwise be fine
            y: inHome1.page.withMargin.bottom + inForeign1.page.withMargin.bottom,
          };

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
        const custom: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'has-a-scroll-parent',
            type: 'TYPE',
          },
          client: getArea({
            top: 0,
            left: 0,
            right: 100,
            // cut off by the frame
            bottom: 120,
          }),
          frameClient: getArea({
            top: 0,
            left: 0,
            right: 100,
            bottom: 100,
          }),
        });
        // scrolling custom down so that it the bottom is visible
        const scrolled: DroppableDimension = scrollDroppable(custom, { x: 0, y: 20 });

        const withCustom: DroppableDimensionMap = {
          ...droppables,
          [custom.descriptor.id]: scrolled,
        };

        it('should not a placeholder buffer to the frame', () => {
          // just below frame
          // normally cut off by frame
          const target: Position = {
            x: 0,
            y: 101,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables: withCustom,
            previousDroppableOverId: custom.descriptor.id,
          });

          expect(result).toBe(null);
        });
      });
    });
  });
});
