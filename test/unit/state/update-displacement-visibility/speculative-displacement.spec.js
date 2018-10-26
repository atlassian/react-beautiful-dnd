// @flow
import invariant from 'tiny-invariant';
import { getRect } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  Viewport,
  DraggableDimension,
  DroppableDimension,
  DisplacedBy,
  DraggableDimensionMap,
  Displacement,
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
import { origin, patch } from '../../../../src/state/position';
import { vertical, horizontal } from '../../../../src/state/axis';
import { toDraggableMap } from '../../../../src/state/dimension-structures';
import getDisplacementMap from '../../../../src/state/get-displacement-map';
import getDisplacedBy from '../../../../src/state/get-displaced-by';

const getNotVisibleDisplacement = (
  draggable: DraggableDimension,
): Displacement => ({
  draggableId: draggable.descriptor.id,
  shouldAnimate: false,
  isVisible: false,
});

const getVisibleDisplacementWithoutAnimation = (
  draggable: DraggableDimension,
): Displacement => ({
  draggableId: draggable.descriptor.id,
  shouldAnimate: false,
  isVisible: true,
});

[vertical /* , horizontal */].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    it('should do nothing when there is no displacement', () => {
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
      const homeCrossAxisStart: number = 0;
      const homeCrossAxisEnd: number = 100;
      const foreignCrossAxisStart: number = 100;
      const foreignCrossAxisEnd: number = 200;

      const sizeOfInHome1: number = 50;
      const sizeOfInForeign1: number = 50;
      const sizeOfInForeign2: number = 50;
      const sizeOfInForeign3: number = 10;
      const sizeOfInForeign4: number = 100;
      const sizeOfInForeign5: number = 100;

      // when moving into the foreign list there will be enough room for inHome1 and inForeign1
      const sizeOfViewport: number = sizeOfInHome1 + sizeOfInForeign1;
      const viewport: Viewport = createViewport({
        frame: getRect({
          top: 0,
          left: 0,
          bottom: sizeOfViewport,
          right: sizeOfViewport,
        }),
        scroll: origin,
        // some massive number
        scrollHeight: 20000,
        scrollWidth: 20000,
      });
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
          [axis.end]: sizeOfInHome1,
        },
      });
      const inForeign1: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inForeign1',
          type: foreign.descriptor.type,
          droppableId: foreign.descriptor.id,
          index: 0,
        },
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: 0,
          [axis.end]: sizeOfInForeign1,
        },
      });
      const inForeign2: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inForeign2',
          type: foreign.descriptor.type,
          droppableId: foreign.descriptor.id,
          index: 1,
        },
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: sizeOfInForeign1,
          [axis.end]: sizeOfInForeign2,
        },
      });
      const inForeign3: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inForeign3',
          type: foreign.descriptor.type,
          droppableId: foreign.descriptor.id,
          index: 2,
        },
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: sizeOfInForeign2,
          [axis.end]: sizeOfInForeign3,
        },
      });
      const inForeign4: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inForeign4',
          type: foreign.descriptor.type,
          droppableId: foreign.descriptor.id,
          index: 3,
        },
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: sizeOfInForeign3,
          [axis.end]: sizeOfInForeign4,
        },
      });
      const inForeign5: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'inForeign4',
          type: foreign.descriptor.type,
          droppableId: foreign.descriptor.id,
          index: 4,
        },
        borderBox: {
          [axis.crossAxisStart]: foreignCrossAxisStart,
          [axis.crossAxisEnd]: foreignCrossAxisEnd,
          [axis.start]: sizeOfInForeign4,
          [axis.end]: sizeOfInForeign5,
        },
      });
      const draggables: DraggableDimensionMap = toDraggableMap([
        inHome1,
        inForeign1,
        inForeign2,
        inForeign3,
        inForeign4,
        inForeign5,
      ]);

      // inHome1 has moved into the foreign list below inForeign1
      const willDisplaceForward: boolean = true;
      const displacedBy: DisplacedBy = getDisplacedBy(
        axis,
        inHome1.displaceBy,
        willDisplaceForward,
      );

      // TODO: this is a bit fake
      // some of these should actually be visible
      const initial: Displacement[] = [
        getNotVisibleDisplacement(inForeign2),
        getNotVisibleDisplacement(inForeign3),
        getNotVisibleDisplacement(inForeign4),
        getNotVisibleDisplacement(inForeign5),
      ];
      const previousImpact: DragImpact = {
        movement: {
          displaced: initial,
          map: getDisplacementMap(initial),
          willDisplaceForward,
          displacedBy,
        },
        direction: axis.direction,
        destination: {
          droppableId: foreign.descriptor.id,
          index: inForeign2.descriptor.index,
        },
        merge: null,
      };

      const result: DragImpact = speculativelyIncrease({
        impact: previousImpact,
        viewport,
        destination: foreign,
        draggables,
        maxScrollChange: patch(axis.line, sizeOfInHome1),
      });

      const displaced: Displacement[] = [
        getVisibleDisplacementWithoutAnimation(inForeign2),
        getVisibleDisplacementWithoutAnimation(inForeign3),
        getVisibleDisplacementWithoutAnimation(inForeign4),
        getVisibleDisplacementWithoutAnimation(inForeign5),
      ];
      const expected: DragImpact = {
        movement: {
          displaced,
          map: getDisplacementMap(displaced),
          willDisplaceForward,
          displacedBy,
        },
        direction: axis.direction,
        destination: {
          droppableId: foreign.descriptor.id,
          index: inForeign2.descriptor.index,
        },
        merge: null,
      };
      expect(expected).toEqual(result);
    });

    it('should increase the visible displacement in the droppable by the amount of the max scroll change', () => {});
  });
});
