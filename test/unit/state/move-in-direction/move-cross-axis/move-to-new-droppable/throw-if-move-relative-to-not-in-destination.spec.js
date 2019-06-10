// @flow
import { type Position } from 'css-box-model';
import type { Viewport } from '../../../../../../src/types';
import moveToNewDroppable from '../../../../../../src/state/move-in-direction/move-cross-axis/move-to-new-droppable';
import noImpact from '../../../../../../src/state/no-impact';
import { getPreset } from '../../../../../utils/dimension';
import getHomeOnLift from '../../../../../../src/state/get-home-on-lift';

const dontCare: Position = { x: 0, y: 0 };

const preset = getPreset();
const viewport: Viewport = preset.viewport;
const { onLift } = getHomeOnLift({
  draggable: preset.inHome1,
  home: preset.home,
  draggables: preset.draggables,
  viewport: preset.viewport,
});

it('should throw if moving relative to something that is not inside the destination (foreign => home)', () => {
  expect(() =>
    moveToNewDroppable({
      previousPageBorderBoxCenter: dontCare,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      // moving relative to item that is not in the destination
      moveRelativeTo: preset.inForeign1,
      destination: preset.home,
      // boom
      insideDestination: preset.inHomeList,
      previousImpact: noImpact,
      viewport,
      onLift,
    }),
  ).toThrow();
});

it('should throw if moving relative to something that is not inside the destination (foreign)', () => {
  expect(() =>
    moveToNewDroppable({
      previousPageBorderBoxCenter: dontCare,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      // moving relative to item that is not in the destination
      moveRelativeTo: preset.inForeign2,
      destination: preset.foreign,
      insideDestination: preset.inHomeList,
      previousImpact: noImpact,
      viewport,
      onLift,
    }),
  ).toThrow();
});
