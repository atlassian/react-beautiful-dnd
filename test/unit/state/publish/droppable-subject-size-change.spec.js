// @flow
import invariant from 'tiny-invariant';
import { createBox, type BoxModel, withScroll } from 'css-box-model';
import type {
  DropPendingState,
  DraggingState,
  CollectingState,
  DroppableDimension,
  DraggableDimension,
  Published,
  Scrollable,
  Position,
} from '../../../../src/types';
import {
  getPreset,
  makeScrollable,
  getClosestScrollable,
  addDroppable,
} from '../../../utils/dimension';
import { isEqual, expandByPosition } from '../../../../src/state/spacing';
import getStatePreset from '../../../utils/get-simple-state-preset';
import publish from '../../../../src/state/publish';
import { empty } from './util';
import { getDroppableDimension } from '../../../../src/state/droppable-dimension';
import { expand } from '../../../../node_modules/rxjs/operators';

const preset = getPreset();
const state = getStatePreset();
// scrollable, but where frame == subject
const scrollableHome: DroppableDimension = makeScrollable(preset.home, 0);

invariant(
  isEqual(
    scrollableHome.client.marginBox,
    getClosestScrollable(scrollableHome).frameClient.marginBox,
  ),
  'Expected scrollableHome to have no scroll area',
);

const added1: DraggableDimension = {
  ...preset.inHome4,
  descriptor: {
    ...preset.inHome4.descriptor,
    index: preset.inHome4.descriptor.index + 1,
    id: 'added1',
  },
};

const expandBox = (box: BoxModel, point: Position): BoxModel =>
  createBox({
    borderBox: expandByPosition(box.borderBox, point),
    margin: box.margin,
    border: box.border,
    padding: box.padding,
  });

const scrollableHomeWithAdjustment: DroppableDimension = {
  ...scrollableHome,
  viewport: {
    ...scrollableHome.viewport,
    closestScrollable: {
      ...getClosestScrollable(scrollableHome),
      frameClient: expandBox(getClosestScrollable(scrollableHome).frameClient, {
        x: 0,
        y: 10,
      }),
    },
  },
};

// $FlowFixMe - wrong type
const original: CollectingState = addDroppable(
  // $FlowFixMe - wrong type
  state.collecting(),
  scrollableHome,
);

it('should adjust a subject in response to a change', () => {
  const published: Published = {
    ...empty,
    additions: [added1],
    modified: [scrollableHomeWithAdjustment],
  };

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');

  const postUpdateHome: DroppableDimension =
    result.dimensions.droppables[scrollableHome.descriptor.id];

  // droppable subject has changed
  expect(postUpdateHome.client).toEqual(scrollableHomeWithAdjustment.client);

  // frame has not changed
  expect(getClosestScrollable(postUpdateHome).frameClient).toEqual(
    getClosestScrollable(scrollableHome).frameClient,
  );
});

it('should throw if the frame size changes', () => {
  const expandedClient: BoxModel = createBox({
    borderBox: expandByPosition(preset.home.client.borderBox, { x: 1, y: 1 }),
    margin: preset.home.client.margin,
    border: preset.home.client.border,
    padding: preset.home.client.padding,
  });
  const withFrameSizeChanged: DroppableDimension = {
    ...scrollableHome,
    client: expandedClient,
    page: withScroll(expandedClient, preset.windowScroll),
  };
  const published: Published = {
    ...empty,
    additions: [added1],
    modified: [withFrameSizeChanged],
  };

  expect(() =>
    publish({
      state: original,
      published,
    }),
  ).toThrow('Cannot change the size of a Droppable frame during a drag');
});

it('should throw if any spacing changes', () => {});
