// @flow
import { type Position } from 'css-box-model';
import moveToNewDroppable from '../../../../../../src/state/move-in-direction/move-cross-axis/move-to-new-droppable';
import noImpact from '../../../../../../src/state/no-impact';
import { getPreset } from '../../../../../utils/dimension';
import type { Viewport } from '../../../../../../src/types';

const dontCare: Position = { x: 0, y: 0 };

const preset = getPreset();
const viewport: Viewport = preset.viewport;

it('should throw if moving relative to something that is not inside the droppable (home)', () => {
  expect(() =>
    moveToNewDroppable({
      pageBorderBoxCenter: dontCare,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      // moving relative to item that is not in the destination
      moveRelativeTo: preset.inForeign1,
      destination: preset.home,
      insideDestination: preset.inHomeList,
      previousImpact: noImpact,
      viewport,
    }),
  ).toThrow();
});

it('should throw if moving relative to something that is not inside the droppable (foreign)', () => {
  expect(() =>
    moveToNewDroppable({
      pageBorderBoxCenter: dontCare,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      // moving relative to item that is not in the destination
      moveRelativeTo: preset.inHome2,
      destination: preset.foreign,
      insideDestination: preset.inHomeList,
      previousImpact: noImpact,
      viewport,
    }),
  ).toThrow();
});
