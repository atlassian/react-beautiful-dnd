// @flow
import {
  offset,
  withScroll,
  type BoxModel,
  type Position,
} from 'css-box-model';
import {
  getPreset,
  makeScrollable,
  addDroppable,
} from '../../../utils/dimension';
import type {
  Published,
  DraggableDimension,
  DroppableDimension,
  DropPendingState,
  CollectingState,
} from '../../../../src/types';

const preset = getPreset();

export const empty: Published = {
  additions: [],
  removals: [],
  modified: [],
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

export const scrollableHome: DroppableDimension = makeScrollable(preset.home);
export const scrollableForeign: DroppableDimension = makeScrollable(
  preset.foreign,
);

export const withScrollables = (state: CollectingState): CollectingState =>
  // $FlowFixMe - wrong types for these functions
  addDroppable(addDroppable(state, scrollableHome), scrollableForeign);
