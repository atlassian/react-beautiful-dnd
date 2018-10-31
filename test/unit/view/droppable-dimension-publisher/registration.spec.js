// @flow
/* eslint-disable react/no-multi-comp */
import { mount } from 'enzyme';
import React from 'react';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import type { DroppableDimension } from '../../../../src/types';
import getWindowScroll from '../../../../src/view/window/get-window-scroll';
import { getMarshalStub } from '../../../utils/dimension-marshal';
import forceUpdate from '../../../utils/force-update';
import { withDimensionMarshal } from '../../../utils/get-context-options';
import { preset, scheduled, ScrollableItem } from './util/shared';
import { setViewport } from '../../../utils/viewport';

setViewport(preset.viewport);

it('should register itself when mounting', () => {
  const marshal: DimensionMarshal = getMarshalStub();

  mount(<ScrollableItem />, withDimensionMarshal(marshal));

  expect(marshal.registerDroppable).toHaveBeenCalledTimes(1);
  expect(marshal.registerDroppable.mock.calls[0][0]).toEqual(
    preset.home.descriptor,
  );
});

it('should unregister itself when unmounting', () => {
  const marshal: DimensionMarshal = getMarshalStub();

  const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
  expect(marshal.registerDroppable).toHaveBeenCalled();
  expect(marshal.unregisterDroppable).not.toHaveBeenCalled();

  wrapper.unmount();
  expect(marshal.unregisterDroppable).toHaveBeenCalledTimes(1);
  expect(marshal.unregisterDroppable).toHaveBeenCalledWith(
    preset.home.descriptor,
  );
});

it('should update its registration when a descriptor property changes', () => {
  const marshal: DimensionMarshal = getMarshalStub();

  const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
  // asserting shape of original publish
  expect(marshal.registerDroppable.mock.calls[0][0]).toEqual(
    preset.home.descriptor,
  );
  const original: DroppableDimension = marshal.registerDroppable.mock.calls[0][1].getDimensionAndWatchScroll(
    getWindowScroll(),
    scheduled,
  );

  // updating the index
  wrapper.setProps({
    droppableId: 'some-new-id',
  });
  const updated: DroppableDimension = {
    ...original,
    descriptor: {
      ...original.descriptor,
      id: 'some-new-id',
    },
  };
  expect(marshal.updateDroppable).toHaveBeenCalledTimes(1);
  expect(marshal.updateDroppable).toHaveBeenCalledWith(
    preset.home.descriptor,
    updated.descriptor,
    // Droppable callbacks
    expect.any(Object),
  );
  // should now return a dimension with the correct descriptor
  const callbacks: DroppableCallbacks =
    marshal.updateDroppable.mock.calls[0][2];
  callbacks.dragStopped();
  expect(
    callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled),
  ).toEqual(updated);
});

it('should not update its registration when a descriptor property does not change on an update', () => {
  const marshal: DimensionMarshal = getMarshalStub();

  const wrapper = mount(<ScrollableItem />, withDimensionMarshal(marshal));
  expect(marshal.registerDroppable).toHaveBeenCalledTimes(1);

  forceUpdate(wrapper);
  expect(marshal.updateDroppable).not.toHaveBeenCalled();
});
