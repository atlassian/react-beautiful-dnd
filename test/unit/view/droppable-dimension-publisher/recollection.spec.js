// @flow
import { mount } from 'enzyme';
import React from 'react';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import type { DroppableDimension } from '../../../../src/types';
import { getDroppableDimension } from '../../../utils/dimension';
import { getMarshalStub } from '../../../utils/dimension-marshal';
import { withDimensionMarshal } from '../../../utils/get-context-options';
import tryCleanPrototypeStubs from '../../../utils/try-clean-prototype-stubs';
import { setViewport } from '../../../utils/viewport';
import {
  App,
  bigClient,
  border,
  descriptor,
  immediate,
  margin,
  padding,
  preset,
  smallFrameClient,
} from './util/shared';

beforeEach(() => {
  setViewport(preset.viewport);
});

afterEach(() => {
  tryCleanPrototypeStubs();
});

const expected: DroppableDimension = getDroppableDimension({
  descriptor,
  // as expected
  borderBox: bigClient.borderBox,
  margin,
  padding,
  border,
  windowScroll: preset.windowScroll,
  closest: {
    // we are using the smallFrameClient as a stand in for the elements
    // actual borderBox which is cut off when it is a scroll container
    borderBox: smallFrameClient.borderBox,
    margin,
    padding,
    border,
    // scroll width and height are based on the padding box
    scrollSize: {
      scrollWidth: bigClient.paddingBox.width,
      scrollHeight: bigClient.paddingBox.height,
    },
    scroll: { x: 0, y: 0 },
    shouldClipSubject: true,
  },
});

it('should recollect a dimension if requested', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // both the droppable and the parent are scrollable
  const wrapper = mount(
    <App droppableIsScrollable />,
    withDimensionMarshal(marshal),
  );
  const el: HTMLElement = wrapper.instance().getRef();
  // returning smaller border box as this is what occurs when the element is scrollable
  jest
    .spyOn(el, 'getBoundingClientRect')
    .mockImplementation(() => smallFrameClient.borderBox);
  // scrollWidth / scrollHeight are based on the paddingBox of an element
  Object.defineProperty(el, 'scrollWidth', {
    value: bigClient.paddingBox.width,
  });
  Object.defineProperty(el, 'scrollHeight', {
    value: bigClient.paddingBox.height,
  });

  // pull the get dimension function out
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  // execute it to get the dimension
  const initial: DroppableDimension = callbacks.getDimensionAndWatchScroll(
    preset.windowScroll,
    immediate,
  );

  expect(initial).toEqual(expected);

  // recollection
  const recollection: DroppableDimension = callbacks.recollect();
  expect(recollection.client).toEqual(initial.client);
  // not considering window scroll when recollecting
  expect(recollection.page).toEqual(initial.client);
});

it('should hide any placeholder when recollecting dimensions', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // both the droppable and the parent are scrollable
  const wrapper = mount(
    <App droppableIsScrollable showPlaceholder />,
    withDimensionMarshal(marshal),
  );
  const el: HTMLElement = wrapper.instance().getRef();
  const placeholderEl: HTMLElement = wrapper.instance().getPlaceholderRef();
  // returning smaller border box as this is what occurs when the element is scrollable
  jest
    .spyOn(el, 'getBoundingClientRect')
    .mockImplementation(() => smallFrameClient.borderBox);
  // scrollWidth / scrollHeight are based on the paddingBox of an element
  Object.defineProperty(el, 'scrollWidth', {
    value: bigClient.paddingBox.width,
  });
  Object.defineProperty(el, 'scrollHeight', {
    value: bigClient.paddingBox.height,
  });

  // will be called when unhiding the element
  jest.spyOn(placeholderEl.style, 'removeProperty');

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);

  expect(placeholderEl.style.removeProperty).not.toHaveBeenCalled();

  callbacks.recollect();
  expect(placeholderEl.style.removeProperty).toHaveBeenCalled();
});

it('should throw if there is no drag occurring when a recollection is requested', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // both the droppable and the parent are scrollable
  mount(
    <App droppableIsScrollable showPlaceholder />,
    withDimensionMarshal(marshal),
  );

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  expect(() => callbacks.recollect()).toThrow();
});

it('should throw if there if recollecting from droppable that is not a scroll container', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // both the droppable and the parent are scrollable
  mount(<App />, withDimensionMarshal(marshal));

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];

  callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);

  expect(() => callbacks.recollect()).toThrow();
});
