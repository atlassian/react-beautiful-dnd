// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import passThrough from './util/pass-through-middleware';
import middleware from '../../../../src/state/middleware/max-scroll-updater';
import createStore from './util/create-store';
import {
  updateViewportMaxScroll,
  initialPublish,
  moveDown,
  moveRight,
  clean,
  updateDroppableIsCombineEnabled,
} from '../../../../src/state/action-creators';
import type { Store } from '../../../../src/state/store-types';
import type {
  Viewport,
  State,
  DragImpact,
  DroppableId,
} from '../../../../src/types';
import getMaxScroll from '../../../../src/state/get-max-scroll';
import { initialPublishArgs, preset } from '../../../utils/preset-action-args';
import getViewport from '../../../../src/view/window/get-viewport';

const viewport: Viewport = getViewport();
const doc: ?HTMLElement = document.documentElement;
invariant(doc, 'Cannot find document');

// These properties are not setup correctly in jsdom
const originalHeight: number = doc.scrollHeight;
const originalWidth: number = doc.scrollWidth;

const scrollHeight: number = viewport.frame.height;
const scrollWidth: number = viewport.frame.width;
doc.scrollHeight = scrollHeight;
doc.scrollWidth = scrollWidth;

afterEach(() => {
  doc.scrollHeight = scrollHeight;
  doc.scrollWidth = scrollWidth;
});

afterAll(() => {
  doc.scrollHeight = originalHeight;
  doc.scrollWidth = originalWidth;
});

describe('not dragging', () => {
  it('should not update the max viewport scroll if no drag is occurring', () => {
    const mock = jest.fn();
    const store: Store = createStore(middleware, passThrough(mock));

    doc.scrollHeight = scrollHeight + 10;
    doc.scrollWidth = scrollWidth + 10;

    store.dispatch(clean());

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(clean());
  });
});

it('should update if the max scroll position has changed and the destination has changed', () => {
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    expect(current.isDragging).toBe(true);
  }
  mock.mockClear();

  // change in scroll size
  doc.scrollHeight = scrollHeight + 10;
  doc.scrollWidth = scrollWidth + 10;

  const expected: Position = getMaxScroll({
    height: viewport.frame.height,
    width: viewport.frame.width,
    scrollHeight: scrollHeight + 10,
    scrollWidth: scrollWidth + 10,
  });
  // changing droppable
  store.dispatch(moveRight());
  expect(mock).toHaveBeenCalledTimes(2);
  expect(mock).toHaveBeenCalledWith(moveRight());
  expect(mock).toHaveBeenCalledWith(updateViewportMaxScroll(expected));
});

it('should not update if the max scroll position has not changed and destination has', () => {
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    expect(current.isDragging).toBe(true);
  }
  mock.mockClear();

  // no change in scroll size but there is a change in destination
  store.dispatch(moveRight());
  expect(mock).toHaveBeenCalledWith(moveRight());
  expect(mock).toHaveBeenCalledTimes(1);
});

it('should not update if the destination has not changed (even if the scroll size has changed)', () => {
  // the scroll size should not change in response to a drag if the destination has not changed
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    expect(current.isDragging).toBe(true);
  }
  mock.mockClear();

  // change in scroll size
  doc.scrollHeight = scrollHeight + 10;
  doc.scrollWidth = scrollWidth + 10;

  // not changing droppable
  store.dispatch(moveDown());
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(moveDown());
});

it('should not update if the moving from a reorder to combine in the same list', () => {
  // the scroll size should not change in response to a drag if the destination has not changed
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));
  const homeId: DroppableId = preset.home.descriptor.id;

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(
    updateDroppableIsCombineEnabled({
      id: homeId,
      isCombineEnabled: true,
    }),
  );
  // validation
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    expect(current.isDragging).toBe(true);
    expect(current.dimensions.droppables[homeId].isCombineEnabled).toBe(true);
  }
  mock.mockClear();

  // change in scroll size - checking that this is not recorded
  doc.scrollHeight = scrollHeight + 10;
  doc.scrollWidth = scrollWidth + 10;

  // not changing droppable
  store.dispatch(moveDown());
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(moveDown());

  // validation: moved to combine impact
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    const impact: DragImpact = current.impact;
    expect(impact.merge && impact.merge.combine.droppableId).toBe(homeId);
  }
});

it('should change if moving from combine to another list', () => {
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));
  const homeId: DroppableId = preset.home.descriptor.id;

  // now dragging
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(
    updateDroppableIsCombineEnabled({
      id: homeId,
      isCombineEnabled: true,
    }),
  );
  mock.mockClear();

  // change in scroll size - checking that this is not recorded
  // (we would want this recorded, but this is just to show that we did not read from the DOM)
  doc.scrollHeight = scrollHeight + 10;
  doc.scrollWidth = scrollWidth + 10;

  // moving to a combine
  store.dispatch(moveDown());
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(moveDown());
  mock.mockClear();
  {
    const current: State = store.getState();
    invariant(current.isDragging);
    const impact: DragImpact = current.impact;
    expect(impact.merge && impact.merge.combine.droppableId).toBe(homeId);
  }

  doc.scrollHeight = scrollHeight + 20;
  doc.scrollWidth = scrollWidth + 20;

  const expected: Position = getMaxScroll({
    height: viewport.frame.height,
    width: viewport.frame.width,
    scrollHeight: scrollHeight + 20,
    scrollWidth: scrollWidth + 20,
  });
  // changing droppable
  store.dispatch(moveRight());
  expect(mock).toHaveBeenCalledTimes(2);
  expect(mock).toHaveBeenCalledWith(moveRight());
  expect(mock).toHaveBeenCalledWith(updateViewportMaxScroll(expected));
});
