// @flow
import invariant from 'tiny-invariant';
import { getRect } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  Viewport,
  DraggableDimension,
  DroppableDimension,
} from '../../../../src/types';
import {
  getPreset,
  getDraggableDimension,
  getDroppableDimension,
} from '../../../utils/dimension';
import speculativelyIncrease from '../../../../src/state/update-displacement-visibility/speculatively-increase';
import getHomeImpact from '../../../../src/state/get-home-impact';
import noImpact from '../../../../src/state/no-impact';
import { createViewport } from '../../../utils/viewport';
import { origin } from '../../../../src/state/position';
import { vertical, horizontal } from '../../../../src/state/axis';

[vertical, horizontal].forEach((axis: Axis) => {
  it('should do nothing when there is no displacement', () => {
    describe(`on ${axis.direction} axis`, () => {
      const preset = getPreset();

      const impact1: DragImpact = speculativelyIncrease({
        impact: getHomeImpact(preset.inHome1, preset.home),
        viewport: preset.viewport,
        destination: preset.home,
        draggables: preset.draggables,
        maxScrollChange: { x: 1000, y: 1000 },
      });
      expect(impact1).toEqual(getHomeImpact(preset.inHome1, preset.home));

      const impact2: DragImpact = speculativelyIncrease({
        impact: noImpact,
        viewport: preset.viewport,
        destination: preset.home,
        draggables: preset.draggables,
        maxScrollChange: { x: 1000, y: 1000 },
      });
      expect(impact2).toEqual(noImpact);
    });

    it('should increase the visible displacement in the window by the amount of the max scroll change', () => {
      const viewportSize: number = 200;
      const viewport: Viewport = createViewport({
        frame: getRect({
          top: 0,
          left: 0,
          bottom: viewportSize,
          right: viewportSize,
        }),
        scroll: origin,
        scrollHeight: 2000,
        scrollWidth: 2000,
      });
      const homeCrossAxisStart: number = 0;
      const homeCrossAxisEnd: number = 100;
      const foreignCrossAxisStart: number = 100;
      const foreignCrossAxisEnd: number = 200;

      const home: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'home',
          type: 'huge',
        },
        direction: axis.direction,
        borderBox: {
          [axis.crossAxisStart]: homeCrossAxisStart,
          [axis.crossAxisEnd]: homeCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: 10000,
        },
      });
      const foreign: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'foreign',
          type: 'huge',
        },
        direction: axis.direction,
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: 10000,
        },
      });

      // Scenario:
      // In a foreign list.
      // Currently lots of items are displaced forwards
      // Only a few are visibly displaced.
      // We want to increase the amount of visibly displaced items by the amount of the scroll change

      // inHome1: the dragging item that has come from another list
      // it is currently before inForeign1

      // Currently visibly displaced
      // - inForeign1
      // these are displaced, but not visibly
      // - inForeign2
      // - inForeign3
      // - inForeign4

      const inHome1Size: number = viewportSize - 100;
      invariant(inHome1Size === 100, 'Just so you know');

      const inHome1: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inhome1',
          type: home.descriptor.type,
          droppableId: home.descriptor.id,
          index: 0,
        },
        borderBox: {
          [axis.crossAxisStart]: homeCrossAxisStart,
          [axis.crossAxisEnd]: homeCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: inHome1Size,
        },
      });
      const inForeign1: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inforeign1',
          type: foreign.descriptor.type,
          droppableId: foreign.descriptor.id,
          index: 1,
        },
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: inHome1Size,
        },
      });
      const inForeign1: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inhome1',
          type: foreign.descriptor.type,
          droppableId: foreign.descriptor.id,
          index: 0,
        },
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: 20,
        },
      });
      const inForeign2: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inhome1',
          type: foreign.descriptor.type,
          droppableId: foreign.descriptor.id,
          index: 0,
        },
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: 20,
        },
      });
      const inForeign3: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inhome1',
          type: foreign.descriptor.type,
          droppableId: foreign.descriptor.id,
          index: 0,
        },
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: 20,
        },
      });
    });

    it('should increase the visible displacement in the droppable by the amount of the max scroll change', () => {});
  });
});
