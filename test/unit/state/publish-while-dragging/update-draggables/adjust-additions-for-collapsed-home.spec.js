// @flow
import invariant from 'tiny-invariant';
import getStatePreset from '../../../../utils/get-simple-state-preset';
import type {
  Published,
  DraggableDimension,
  DropPendingState,
  DraggingState,
  DraggableDimensionMap,
  DisplacedBy,
} from '../../../../../src/types';
import publish from '../../../../../src/state/publish-while-dragging';
import { getPreset } from '../../../../utils/dimension';
import { empty, withScrollables, scrollableHome } from '../util';
import getDisplacedBy from '../../../../../src/state/get-displaced-by';
import { vertical } from '../../../../../src/state/axis';
import offsetDraggable from '../../../../../src/state/publish-while-dragging/update-draggables/offset-draggable';

const state = getStatePreset();
const preset = getPreset(vertical);

it('should shift added dimensions to account for a collapsed home', () => {
  const displacedBy: DisplacedBy = getDisplacedBy(
    vertical,
    preset.inHome1.displaceBy,
  );
  const added1: DraggableDimension = {
    ...preset.inHome4,
    descriptor: {
      ...preset.inHome4.descriptor,
      index: preset.inHome4.descriptor.index + 1,
      id: 'added1',
    },
  };
  const added2: DraggableDimension = {
    ...preset.inHome4,
    descriptor: {
      ...preset.inHome4.descriptor,
      index: preset.inHome4.descriptor.index + 2,
      id: 'added2',
    },
  };
  const published: Published = {
    ...empty,
    additions: [added1, added2],
    modified: [scrollableHome],
  };

  const result: DraggingState | DropPendingState = publish({
    state: withScrollables(state.collecting()),
    published,
  });

  invariant(result.phase === 'DRAGGING');
  const expected: DraggableDimensionMap = {
    // everything else is unmodified
    ...preset.dimensions.draggables,
    // shifted after home
    [added1.descriptor.id]: offsetDraggable({
      draggable: added1,
      offset: displacedBy.point,
      initialWindowScroll: preset.windowScroll,
    }),
    [added2.descriptor.id]: offsetDraggable({
      draggable: added2,
      offset: displacedBy.point,
      initialWindowScroll: preset.windowScroll,
    }),
  };

  expect(result.dimensions.draggables).toEqual(expected);
});

it('should account for a change in critical index', () => {
  // dragging inHome4
  // removing inHome1
  // removing inHome2
  // removing inHome3
  // new inHome4 index: 0
  // adding item into index 1 - will need to be shifted

  const displacedBy: DisplacedBy = getDisplacedBy(
    vertical,
    preset.inHome4.displaceBy,
  );
  const added: DraggableDimension = {
    // a random dimension
    ...preset.inHome3,
    descriptor: {
      ...preset.inHome4.descriptor,
      index: 1,
      id: 'added',
    },
  };
  const published: Published = {
    removals: [
      preset.inHome1.descriptor.id,
      preset.inHome2.descriptor.id,
      preset.inHome3.descriptor.id,
    ],
    additions: [added],
    modified: [],
  };

  const result: DraggingState | DropPendingState = publish({
    state: withScrollables(state.collecting(preset.inHome4.descriptor.id)),
    published,
  });

  invariant(result.phase === 'DRAGGING');
  const expected: DraggableDimension = offsetDraggable({
    draggable: added,
    offset: displacedBy.point,
    initialWindowScroll: preset.windowScroll,
  });

  expect(result.dimensions.draggables[added.descriptor.id]).toEqual(expected);

  // validation: inHome4 is in the spot we expect
  expect(result.critical.draggable.index).toBe(0);
});
