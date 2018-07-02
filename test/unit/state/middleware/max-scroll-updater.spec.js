// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import passThrough from './util/pass-through-middleware';
import middleware from '../../../../src/state/middleware/max-scroll-updater';
import createStore from './util/create-store';
import {
  prepare,
  updateViewportMaxScroll,
  initialPublish,
  moveDown,
} from '../../../../src/state/action-creators';
import type { Store } from '../../../../src/state/store-types';
import type { Viewport } from '../../../../src/types';
import getMaxScroll from '../../../../src/state/get-max-scroll';
import { initialPublishArgs } from '../../../utils/preset-action-args';
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

it('should not update the max viewport scroll if no drag is occurring', () => {
  const mock = jest.fn();
  const store: Store = createStore(middleware, passThrough(mock));

  doc.scrollHeight = scrollHeight + 10;
  doc.scrollWidth = scrollWidth + 10;

  store.dispatch(prepare());

  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(prepare());
});

describe('during a drag', () => {
  it('should not update the max viewport scroll if the max scroll position has not changed', () => {
    const mock = jest.fn();
    const store: Store = createStore(middleware, passThrough(mock));

    // now dragging
    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(store.getState().isDragging).toBe(true);
    mock.mockClear();

    // no change in scroll size
    store.dispatch(moveDown());
    expect(mock).toHaveBeenCalledWith(moveDown());
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('should update the max viewport scroll if the max scroll position has changed', () => {
    const mock = jest.fn();
    const store: Store = createStore(middleware, passThrough(mock));

    // now dragging
    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(store.getState().isDragging).toBe(true);
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
    store.dispatch(moveDown());
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock).toHaveBeenCalledWith(moveDown());
    expect(mock).toHaveBeenCalledWith(updateViewportMaxScroll(expected));
  });
});
