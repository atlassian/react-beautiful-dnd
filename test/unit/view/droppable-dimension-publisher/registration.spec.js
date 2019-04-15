// @flow
/* eslint-disable react/no-multi-comp */
import { mount } from 'enzyme';
import React from 'react';
import type { DimensionMarshal } from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import type { DroppableDescriptor } from '../../../../src/types';
import { getMarshalStub } from '../../../utils/dimension-marshal';
import forceUpdate from '../../../utils/force-update';
import { preset, ScrollableItem, WithAppContext } from './util/shared';
import { setViewport } from '../../../utils/viewport';
import PassThroughProps from '../../../utils/pass-through-props';

setViewport(preset.viewport);

it('should register itself when mounting', () => {
  const marshal: DimensionMarshal = getMarshalStub();

  mount(
    <WithAppContext marshal={marshal}>
      <ScrollableItem />
    </WithAppContext>,
  );

  expect(marshal.registerDroppable).toHaveBeenCalledTimes(1);
  expect(marshal.registerDroppable.mock.calls[0][0]).toEqual(
    preset.home.descriptor,
  );
});

it('should unregister itself when unmounting', () => {
  const marshal: DimensionMarshal = getMarshalStub();

  const wrapper = mount(
    <WithAppContext marshal={marshal}>
      <ScrollableItem />
    </WithAppContext>,
  );
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

  const wrapper = mount(
    <PassThroughProps>
      {extra => (
        <WithAppContext marshal={marshal}>
          <ScrollableItem {...extra} />
        </WithAppContext>
      )}
    </PassThroughProps>,
  );
  // asserting shape of original publish
  expect(marshal.registerDroppable.mock.calls[0][0]).toEqual(
    preset.home.descriptor,
  );
  marshal.registerDroppable.mockClear();

  // updating the index
  wrapper.setProps({
    droppableId: 'some-new-id',
  });
  const updated: DroppableDescriptor = {
    ...preset.home.descriptor,
    id: 'some-new-id',
  };

  // old descriptor removed
  expect(marshal.unregisterDroppable).toHaveBeenCalledTimes(1);
  expect(marshal.unregisterDroppable).toHaveBeenCalledWith(
    preset.home.descriptor,
  );

  // new descriptor added
  expect(marshal.registerDroppable.mock.calls[0][0]).toEqual(updated);
});

it('should not update its registration when a descriptor property does not change on an update', () => {
  const marshal: DimensionMarshal = getMarshalStub();

  const wrapper = mount(
    <WithAppContext marshal={marshal}>
      <ScrollableItem />
    </WithAppContext>,
  );
  expect(marshal.registerDroppable).toHaveBeenCalledTimes(1);
  expect(marshal.unregisterDroppable).not.toHaveBeenCalled();
  marshal.registerDroppable.mockClear();

  forceUpdate(wrapper);
  expect(marshal.unregisterDroppable).not.toHaveBeenCalled();
  expect(marshal.registerDroppable).not.toHaveBeenCalled();
});
