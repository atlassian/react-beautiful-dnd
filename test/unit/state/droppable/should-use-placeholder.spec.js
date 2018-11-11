// @flow
import type { DragImpact } from '../../../../src/types';
import noImpact from '../../../../src/state/no-impact';
import { forward } from '../../../../src/state/user-direction/user-direction-preset';
import { getPreset } from '../../../utils/dimension';
import shouldUsePlaceholder from '../../../../src/state/droppable/should-use-placeholder';

const preset = getPreset();

it('should use placeholder when reordering in foreign list', () => {
  const withReorder: DragImpact = {
    ...noImpact,
    destination: {
      index: 0,
      droppableId: preset.foreign.descriptor.id,
    },
  };

  const result: boolean = shouldUsePlaceholder(
    preset.inHome1.descriptor,
    withReorder,
  );

  expect(result).toBe(true);
});

it('should use placeholder when combining in foreign list', () => {
  const withCombine: DragImpact = {
    ...noImpact,
    merge: {
      combine: {
        draggableId: preset.inHome1.descriptor.id,
        droppableId: preset.foreign.descriptor.id,
      },
      whenEntered: forward,
    },
  };

  const result: boolean = shouldUsePlaceholder(
    preset.inHome1.descriptor,
    withCombine,
  );

  expect(result).toBe(true);
});

it('should not use placeholder when reordering in home list', () => {
  const withReorder: DragImpact = {
    ...noImpact,
    destination: {
      index: 0,
      droppableId: preset.home.descriptor.id,
    },
  };

  const result: boolean = shouldUsePlaceholder(
    preset.inHome1.descriptor,
    withReorder,
  );

  expect(result).toBe(false);
});

it('should not use placeholder when combining in home list', () => {
  const withCombine: DragImpact = {
    ...noImpact,
    merge: {
      combine: {
        draggableId: preset.inHome1.descriptor.id,
        droppableId: preset.home.descriptor.id,
      },
      whenEntered: forward,
    },
  };

  const result: boolean = shouldUsePlaceholder(
    preset.inHome1.descriptor,
    withCombine,
  );

  expect(result).toBe(false);
});

it('should not use placeholder when over no list', () => {
  const result: boolean = shouldUsePlaceholder(
    preset.inHome1.descriptor,
    noImpact,
  );

  expect(result).toBe(false);
});
