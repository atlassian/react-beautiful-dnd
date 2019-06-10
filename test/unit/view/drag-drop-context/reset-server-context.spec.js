// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import DragDropContext from '../../../../src/view/drag-drop-context';
import { resetServerContext } from '../../../../src';
import * as attributes from '../../../../src/view/data-attributes';

const doesStyleElementExist = (uniqueId: number): boolean =>
  Boolean(
    document.querySelector(`[${attributes.prefix}-always="${uniqueId}"]`),
  );

it('should reset the style marshal context', () => {
  expect(doesStyleElementExist(1)).toBe(false);

  const wrapper1: ReactWrapper<*> = mount(
    <DragDropContext onDragEnd={() => {}}>{null}</DragDropContext>,
  );
  expect(doesStyleElementExist(0)).toBe(true);

  const wrapper2: ReactWrapper<*> = mount(
    <DragDropContext onDragEnd={() => {}}>{null}</DragDropContext>,
  );
  expect(doesStyleElementExist(1)).toBe(true);

  // not created yet
  expect(doesStyleElementExist(2)).toBe(false);

  // clearing away the old wrappers
  wrapper1.unmount();
  wrapper2.unmount();
  resetServerContext();

  // a new wrapper after the reset
  const wrapper3: ReactWrapper<*> = mount(
    <DragDropContext onDragEnd={() => {}}>{null}</DragDropContext>,
  );

  // now only '0' exists
  expect(doesStyleElementExist(0)).toBe(true);
  expect(doesStyleElementExist(1)).toBe(false);

  wrapper3.unmount();
});
