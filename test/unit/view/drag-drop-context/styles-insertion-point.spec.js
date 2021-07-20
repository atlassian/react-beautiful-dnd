// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import { prefix } from '../../../../src/view/data-attributes';
import DragDropContext from '../../../../src/view/drag-drop-context';
import { resetServerContext } from '../../../../src';
import type { ContextId } from '../../../../src/types';
import * as attributes from '../../../../src/view/data-attributes';

const getDynamicStyleTagSelector = (contextId: ContextId) =>
  `style[${prefix}-dynamic="${contextId}"]`;

const getAlwaysStyleTagSelector = (contextId: ContextId) =>
  `style[${prefix}-always="${contextId}"]`;

it('should append styles to head stylesInsertionPoint is not specified', () => {
  const contextId: ContextId = '0';
  const dynamicSelector: string = getDynamicStyleTagSelector(contextId);
  const alwaysSelector: string = getAlwaysStyleTagSelector(contextId);

  resetServerContext();
  const wrapper: ReactWrapper<*> = mount(
    <DragDropContext onDragEnd={() => {}}>{null}</DragDropContext>,
  );

  // styles should be created in head
  const head = document.head;
  expect(head).toBeDefined();
  if (!head) {
    return;
  }
  expect(head.querySelector(alwaysSelector)).toBeInstanceOf(HTMLStyleElement);
  expect(head.querySelector(dynamicSelector)).toBeInstanceOf(HTMLStyleElement);

  wrapper.unmount();
});

it('should append styles to head if stylesInsertionPoint is undefined', () => {
  const contextId: ContextId = '0';
  const dynamicSelector: string = getDynamicStyleTagSelector(contextId);
  const alwaysSelector: string = getAlwaysStyleTagSelector(contextId);

  resetServerContext();
  const wrapper: ReactWrapper<*> = mount(
    <DragDropContext stylesInsertionPoint={undefined} onDragEnd={() => {}}>
      {null}
    </DragDropContext>,
  );

  // styles should be created in head
  const head = document.head;
  expect(head).toBeDefined();
  if (!head) {
    return;
  }
  expect(head.querySelector(alwaysSelector)).toBeInstanceOf(HTMLStyleElement);
  expect(head.querySelector(dynamicSelector)).toBeInstanceOf(HTMLStyleElement);

  wrapper.unmount();
});

it('should append styles to stylesInsertionPoint', () => {
  const contextId: ContextId = '0';
  const dynamicSelector: string = getDynamicStyleTagSelector(contextId);
  const alwaysSelector: string = getAlwaysStyleTagSelector(contextId);

  const stylesRootWrapper = mount(<div />);
  const stylesRoot = stylesRootWrapper.getDOMNode();
  expect(stylesRoot).toBeInstanceOf(HTMLDivElement);

  resetServerContext();
  const wrapper: ReactWrapper<*> = mount(
    <DragDropContext stylesInsertionPoint={stylesRoot} onDragEnd={() => {}}>
      {null}
    </DragDropContext>,
  );

  // styles should be created in styles root
  expect(stylesRoot.querySelector(alwaysSelector)).toBeInstanceOf(
    HTMLStyleElement,
  );
  expect(stylesRoot.querySelector(dynamicSelector)).toBeInstanceOf(
    HTMLStyleElement,
  );

  wrapper.unmount();

  // styles should be removed from styles root
  expect(stylesRoot.querySelector(alwaysSelector)).toBeFalsy();
  expect(stylesRoot.querySelector(dynamicSelector)).toBeFalsy();

  stylesRootWrapper.unmount();
});
