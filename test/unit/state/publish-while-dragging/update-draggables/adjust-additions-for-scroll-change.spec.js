// @flow
import { offset, type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import publish from '../../../../../src/state/publish-while-dragging';
import {
  getPreset,
  getDraggableDimension,
  addDroppable,
  getFrame,
} from '../../../../utils/dimension';
import getStatePreset from '../../../../utils/get-simple-state-preset';
import { empty, withScrollables, scrollableHome } from '../util';
import { add, negate } from '../../../../../src/state/position';
import scrollViewport from '../../../../../src/state/scroll-viewport';
import scrollDroppable from '../../../../../src/state/droppable/scroll-droppable';
import type {
  Published,
  DraggableDimension,
  DropPendingState,
  DraggingState,
  CollectingState,
  Viewport,
  DroppableDimension,
} from '../../../../../src/types';

const state = getStatePreset();
const preset = getPreset();

it('should shift added draggables to account for change in page scroll since start of drag', () => {
  // change in scroll
  const scrollChange: Position = { x: 20, y: 40 };
  // the displacement caused to draggables as a result of the change
  const scrollDisplacement: Position = negate(scrollChange);
  const newScroll: Position = add(preset.viewport.scroll.initial, scrollChange);
  const scrolledViewport: Viewport = scrollViewport(preset.viewport, newScroll);
  // dimensions
  const added: DraggableDimension = getDraggableDimension({
    descriptor: {
      index: 0,
      id: 'added',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
    // when collected this dimension would have been displaced by the scroll
    borderBox: offset(preset.inHome1.client, scrollDisplacement).borderBox,
    windowScroll: add(preset.windowScroll, scrollDisplacement),
  });
  const unshifted: DraggableDimension = getDraggableDimension({
    descriptor: added.descriptor,
    // unshifted
    borderBox: preset.inHome1.client.borderBox,
    windowScroll: preset.windowScroll,
  });
  const published: Published = {
    ...empty,
    additions: [added],
    modified: [scrollableHome],
  };
  const original: CollectingState = withScrollables(
    state.collecting(
      preset.inHome1.descriptor.id,
      preset.inHome1.client.borderBox.center,
      scrolledViewport,
    ),
  );

  const result: DraggingState | DropPendingState = publish({
    state: original,
    published,
  });

  invariant(result.phase === 'DRAGGING');
  expect(result.dimensions.draggables[added.descriptor.id]).toEqual(unshifted);
});

it('should shift added draggables to account for change in droppable scroll since start of drag', () => {
  // Scroll droppable
  const scrollChange: Position = { x: 20, y: 40 };
  const scrollDisplacement: Position = negate(scrollChange);
  const newScroll: Position = add(
    getFrame(scrollableHome).scroll.initial,
    scrollChange,
  );
  const scrolled: DroppableDimension = scrollDroppable(
    scrollableHome,
    newScroll,
  );
  // validation
  expect(getFrame(scrolled).scroll.current).toEqual(scrollChange);
  // dimensions
  const added: DraggableDimension = getDraggableDimension({
    descriptor: {
      index: 0,
      id: 'added',
      droppableId: preset.home.descriptor.id,
      type: preset.home.descriptor.type,
    },
    // when collected this dimension would have been displaced by the scroll
    borderBox: offset(preset.inHome1.client, scrollDisplacement).borderBox,
    windowScroll: preset.windowScroll,
  });
  const unshifted: DraggableDimension = getDraggableDimension({
    descriptor: added.descriptor,
    // unshifted
    borderBox: preset.inHome1.client.borderBox,
    windowScroll: preset.windowScroll,
  });
  const published: Published = {
    ...empty,
    additions: [added],
    modified: [scrolled],
  };
  const original: CollectingState = state.collecting(
    preset.inHome1.descriptor.id,
  );
  const withScrolled: CollectingState = (addDroppable(
    (original: any),
    scrolled,
  ): any);

  const result: DraggingState | DropPendingState = publish({
    state: withScrolled,
    published,
  });

  invariant(result.phase === 'DRAGGING');
  expect(result.dimensions.draggables[added.descriptor.id]).toEqual(unshifted);
});
