// flow
import React from 'react';
import { mount } from 'enzyme';
import { queryElements } from '../../../../src/view/get-elements/query-elements';

const first = jest.fn((e: HTMLElement) => true);
const none = jest.fn((e: HTMLElement) => false);

it('should find element in document', () => {
  const wrapper = mount(
    <div>
      <div id="inner" />
    </div>,
  );
  const container = wrapper.getDOMNode();
  const result = queryElements(container, '#inner', first);
  expect(result).toBe(container.firstChild);
  expect(first).toHaveBeenCalled();
  wrapper.unmount();
});

it('should find element in shadow root', () => {
  const wrapper = mount(<div />);
  const container = wrapper.getDOMNode();
  const root = container.attachShadow({ mode: 'open' });

  const target = document.createElement('div');
  target.id = 'inner';
  root.appendChild(target);

  const result = queryElements(root, '#inner', first);
  expect(result).toBe(target);
  wrapper.unmount();
});

it('should find element in nested shadow root', () => {
  const wrapper = mount(<div />);
  const container = wrapper.getDOMNode();

  const outerShadow = container.attachShadow({ mode: 'open' });
  const outerDiv = document.createElement('div');
  outerShadow.appendChild(outerDiv);

  const root = outerDiv.attachShadow({ mode: 'open' });
  const target = document.createElement('div');
  target.id = 'inner';
  root.appendChild(target);

  const result = queryElements(root, '#inner', first);
  expect(result).toBe(target);
  wrapper.unmount();
});

it('should find element in parent root outside of shadow root', () => {
  const wrapper = mount(<div id="outer" />);
  const container = wrapper.getDOMNode();
  const root = container.attachShadow({ mode: 'open' });

  const inner = document.createElement('div');
  inner.id = 'inner';
  root.appendChild(inner);

  const result = queryElements(root, '#outer', first);
  expect(result).toBe(container);
  wrapper.unmount();
});

it('should return undefined if element not found', () => {
  const wrapper = mount(
    <div>
      <div id="inner" />
    </div>,
  );
  const container = wrapper.getDOMNode();
  const result = queryElements(container, '#inner', none);
  expect(result).not.toBeDefined();
  expect(none).toHaveBeenCalled();
  wrapper.unmount();
});
