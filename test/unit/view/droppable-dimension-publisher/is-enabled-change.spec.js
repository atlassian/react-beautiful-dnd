// @flow
import { mount } from 'enzyme';
import React from 'react';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import { getMarshalStub } from '../../../utils/dimension-marshal';
import { setViewport } from '../../../utils/viewport';
import {
  preset,
  scheduled,
  ScrollableItem,
  WithAppContext,
} from './util/shared';
import forceUpdate from '../../../utils/force-update';
import PassThroughProps from '../../../utils/pass-through-props';

setViewport(preset.viewport);

it('should publish updates to the enabled state when dragging', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(
    <PassThroughProps>
      {extra => (
        <WithAppContext marshal={marshal}>
          <ScrollableItem isDropDisabled={false} {...extra} />
        </WithAppContext>
      )}
    </PassThroughProps>,
  );
  // not called yet
  expect(marshal.updateDroppableIsEnabled).not.toHaveBeenCalled();

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

  const isDropDisabled: boolean = true;
  wrapper.setProps({
    isDropDisabled,
  });

  expect(marshal.updateDroppableIsEnabled).toHaveBeenCalledTimes(1);
  expect(marshal.updateDroppableIsEnabled).toHaveBeenCalledWith(
    preset.home.descriptor.id,
    !isDropDisabled,
  );
});

it('should not publish updates to the enabled state when there is no drag', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(
    <PassThroughProps>
      {extra => (
        <WithAppContext marshal={marshal}>
          <ScrollableItem isDropDisabled={false} {...extra} />
        </WithAppContext>
      )}
    </PassThroughProps>,
  );

  // not called yet
  expect(marshal.updateDroppableIsEnabled).not.toHaveBeenCalled();

  // no yet dragging

  wrapper.setProps({
    isDropDisabled: true,
  });

  expect(marshal.updateDroppableIsEnabled).not.toHaveBeenCalled();
});

it('should not publish updates when there is no change', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(
    <PassThroughProps>
      {extra => (
        <WithAppContext marshal={marshal}>
          <ScrollableItem isDropDisabled={false} {...extra} />
        </WithAppContext>
      )}
    </PassThroughProps>,
  );

  // not called yet
  expect(marshal.updateDroppableIsEnabled).not.toHaveBeenCalled();
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

  // no change
  wrapper.setProps({
    isDropDisabled: false,
  });

  expect(marshal.updateDroppableIsEnabled).not.toHaveBeenCalled();
  marshal.updateDroppableIsEnabled.mockReset();

  forceUpdate(wrapper);
  expect(marshal.updateDroppableIsEnabled).not.toHaveBeenCalled();
});
