// @flow
import React from 'react';
import { mount } from 'enzyme';
import App from './app';
import DragDropContext from '../../../../src/view/drag-drop-context';

it('should not throw when unmounting', () => {
  const wrapper = mount(
    <DragDropContext onDragEnd={() => {}}>
      <App />
    </DragDropContext>,
  );

  expect(() => wrapper.unmount()).not.toThrow();
});

it('should clean up any window event handlers', () => {
  jest.spyOn(window, 'addEventListener');
  jest.spyOn(window, 'removeEventListener');

  const wrapper = mount(
    <DragDropContext onDragEnd={() => {}}>
      <App />
    </DragDropContext>,
  );

  wrapper.unmount();

  expect(window.addEventListener.mock.calls).toHaveLength(
    window.removeEventListener.mock.calls.length,
  );
  // validation
  expect(window.addEventListener).toHaveBeenCalled();
  expect(window.removeEventListener).toHaveBeenCalled();
});
