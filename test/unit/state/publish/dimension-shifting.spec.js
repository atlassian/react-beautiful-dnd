// @flow
import {
  offset,
  withScroll,
  type BoxModel,
  type Position,
} from 'css-box-model';
import invariant from 'tiny-invariant';
import getStatePreset from '../../../utils/get-simple-state-preset';
import type {
  Published,
  DraggableDimension,
  DropPendingState,
  DraggingState,
  DraggableDimensionMap,
} from '../../../../src/types';
import publish from '../../../../src/state/publish';
import { getPreset } from '../../../utils/dimension';
import { patch } from '../../../../src/state/position';

const state = getStatePreset();
const preset = getPreset();

const empty: Published = {
  additions: {
    draggables: [],
    droppables: [],
  },
  removals: {
    draggables: [],
    droppables: [],
  },
};

type ShiftArgs = {|
  draggable: DraggableDimension,
  change: Position,
  newIndex: number,
|};

const shift = ({
  draggable,
  change,
  newIndex,
}: ShiftArgs): DraggableDimension => {
  const client: BoxModel = offset(draggable.client, change);
  const page: BoxModel = withScroll(client, preset.windowScroll);

  const moved: DraggableDimension = {
    ...draggable,
    descriptor: {
      ...draggable.descriptor,
      index: newIndex,
    },
    placeholder: {
      ...draggable.placeholder,
      client,
    },
    client,
    page,
  };

  return moved;
};

it('should shift draggables after an added draggable', () => {
  // dragging the third item
  // insert a draggable into second position and into third position
  // assert everything after it is shifted and the first is not shifted
  const added1: DraggableDimension = {
    ...preset.inHome2,
    descriptor: {
      index: 1,
      id: 'added1',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
  };
  const added2: DraggableDimension = {
    ...preset.inHome3,
    descriptor: {
      index: 2,
      id: 'added2',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
  };

  const published: Published = {
    ...empty,
    additions: {
      draggables: [added1, added2],
      droppables: [],
    },
  };

  const result: DraggingState | DropPendingState = publish({
    state: state.collecting(preset.inHome3.descriptor.id),
    published,
  });

  // validation
  invariant(result.phase === 'DRAGGING');

  const draggables: DraggableDimensionMap = result.dimensions.draggables;

  // inHome1 has not changed as it was before the insertion
  expect(draggables[preset.inHome1.descriptor.id]).toEqual(preset.inHome1);

  // Everything else below it has been shifted
  const change: Position = patch(
    preset.home.axis.line,
    added1.client.marginBox.height + added2.client.marginBox.height,
  );

  // inHome2 has shifted down two places
  // const shiftedInHome2: DraggableDimension = null;
  const shiftedInHome2: DraggableDimension = shift({
    draggable: preset.inHome2,
    change,
    newIndex: preset.inHome2.descriptor.index + 2,
  });

  expect(draggables[preset.inHome2.descriptor.id]).toEqual(shiftedInHome2);

  // inHome3 has shifted down two places

  // inHome3 has shifted down two places
});

it('should shift draggables after a removed draggable', () => {
  // insert a draggable from the second position
  // assert everything after it is shifted and the first is not shifted
});
