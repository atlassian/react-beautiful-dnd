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
          <ScrollableItem isCombineEnabled {...extra} />
        </WithAppContext>
      )}
    </PassThroughProps>,
  );
  // not called yet
  expect(marshal.updateDroppableIsCombineEnabled).not.toHaveBeenCalled();

  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

  // changing to false
  wrapper.setProps({
    isCombineEnabled: false,
  });
  expect(marshal.updateDroppableIsCombineEnabled).toHaveBeenCalledTimes(1);
  expect(marshal.updateDroppableIsCombineEnabled).toHaveBeenCalledWith(
    preset.home.descriptor.id,
    false,
  );
  marshal.updateDroppableIsCombineEnabled.mockClear();

  // now setting to true
  wrapper.setProps({
    isCombineEnabled: true,
  });
  expect(marshal.updateDroppableIsCombineEnabled).toHaveBeenCalledTimes(1);
  expect(marshal.updateDroppableIsCombineEnabled).toHaveBeenCalledWith(
    preset.home.descriptor.id,
    true,
  );
});

it('should not publish updates to the enabled state when there is no drag', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(
    <PassThroughProps>
      {extra => (
        <WithAppContext marshal={marshal}>
          <ScrollableItem isCombineEnabled {...extra} />,
        </WithAppContext>
      )}
    </PassThroughProps>,
  );

  // not called yet
  expect(marshal.updateDroppableIsCombineEnabled).not.toHaveBeenCalled();

  // no yet dragging

  wrapper.setProps({
    isCombineEnabled: false,
  });

  expect(marshal.updateDroppableIsCombineEnabled).not.toHaveBeenCalled();
});

it('should not publish updates when there is no change', () => {
  const marshal: DimensionMarshal = getMarshalStub();
  const wrapper = mount(
    <PassThroughProps>
      {extra => (
        <WithAppContext marshal={marshal}>
          <ScrollableItem isCombineEnabled {...extra} />,
        </WithAppContext>
      )}
    </PassThroughProps>,
  );

  // not called yet
  expect(marshal.updateDroppableIsCombineEnabled).not.toHaveBeenCalled();
  const callbacks: DroppableCallbacks =
    marshal.registerDroppable.mock.calls[0][1];
  callbacks.getDimensionAndWatchScroll(preset.windowScroll, scheduled);

  // no change
  wrapper.setProps({
    isCombineEnabled: true,
  });

  expect(marshal.updateDroppableIsCombineEnabled).not.toHaveBeenCalled();
  marshal.updateDroppableIsCombineEnabled.mockReset();

  forceUpdate(wrapper);
  expect(marshal.updateDroppableIsCombineEnabled).not.toHaveBeenCalled();
});
