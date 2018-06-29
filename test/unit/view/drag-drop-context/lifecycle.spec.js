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
