// @flow
import { mount } from 'enzyme';
import React from 'react';
import invariant from 'tiny-invariant';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import { getMarshalStub } from '../../../utils/dimension-marshal';
import { setViewport } from '../../../utils/viewport';
import {
  App,
  immediate,
  smallFrameClient,
  bigClient,
  preset,
  scheduled,
  ScrollableItem,
  WithAppContext,
} from './util/shared';
import tryCleanPrototypeStubs from '../../../utils/try-clean-prototype-stubs';

setViewport(preset.viewport);

afterEach(() => {
  tryCleanPrototypeStubs();
});

it('should throw if the droppable has no closest scrollable', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  // no scroll parent
  const wrapper = mount(
    <WithAppContext marshal={marshal}>
      <App parentIsScrollable={false} droppableIsScrollable={false} />,
    </WithAppContext>,
  );
  const droppable: ?HTMLElement = wrapper.find('.droppable').getDOMNode();
  invariant(droppable);
  const parent: ?HTMLElement = wrapper.find('.scroll-parent').getDOMNode();
  invariant(parent);
  jest
    .spyOn(droppable, 'getBoundingClientRect')
    .mockImplementation(() => smallFrameClient.borderBox);
  jest
    .spyOn(parent, 'getBoundingClientRect')
    .mockImplementation(() => bigClient.borderBox);

  // validating no initial scroll
  expect(parent.scrollTop).toBe(0);
  expect(parent.scrollLeft).toBe(0);
  expect(droppable.scrollTop).toBe(0);
  expect(droppable.scrollLeft).toBe(0);

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  // request the droppable start listening for scrolling
  callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

  // ask it to scroll
  expect(() => callbacks.scroll({ x: 100, y: 100 })).toThrow();

  // no scroll changes
  expect(parent.scrollTop).toBe(0);
  expect(parent.scrollLeft).toBe(0);
  expect(droppable.scrollTop).toBe(0);
  expect(droppable.scrollLeft).toBe(0);
});

describe('there is a closest scrollable', () => {
  it('should update the scroll of the closest scrollable', () => {
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(
      <WithAppContext marshal={marshal}>
        <ScrollableItem />
      </WithAppContext>,
    );
    const container: ?HTMLElement = wrapper
      .find('.scroll-container')
      .getDOMNode();
    invariant(container);

    expect(container.scrollTop).toBe(0);
    expect(container.scrollLeft).toBe(0);

    // tell the droppable to watch for scrolling
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];
    // watch scroll will only be called after the dimension is requested
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

    callbacks.scroll({ x: 500, y: 1000 });

    expect(container.scrollLeft).toBe(500);
    expect(container.scrollTop).toBe(1000);
  });

  it('should throw if asked to scoll while scroll is not currently being watched', () => {
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper = mount(
      <WithAppContext marshal={marshal}>
        <ScrollableItem />
      </WithAppContext>,
    );

    const container: ?HTMLElement = wrapper
      .find('.scroll-container')
      .getDOMNode();
    invariant(container);
    expect(container.scrollTop).toBe(0);
    expect(container.scrollLeft).toBe(0);

    // dimension not returned yet
    const callbacks: DroppableCallbacks =
      marshal.registerDroppable.mock.calls[0][1];
    expect(() => callbacks.scroll({ x: 500, y: 1000 })).toThrow();

    // now watching scroll
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, immediate);

    // no longer watching scroll
    callbacks.dragStopped();
    expect(() => callbacks.scroll({ x: 500, y: 1000 })).toThrow();
  });
});
