// @flow
import {
  offset,
  withScroll,
  type BoxModel,
  type Position,
} from 'css-box-model';
import { getPreset } from '../../../utils/dimension';
import type { Published, DraggableDimension } from '../../../../src/types';

const preset = getPreset();

export const empty: Published = {
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

export const shift = ({
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
