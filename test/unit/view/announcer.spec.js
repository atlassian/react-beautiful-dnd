// @flow
import React, { type Node } from 'react';
import invariant from 'tiny-invariant';
import { mount } from 'enzyme';
import type { Announce } from '../../../src/types';
import useAnnouncer from '../../../src/view/use-announcer';
import { getId } from '../../../src/view/use-announcer/use-announcer';

type Props = {|
  uniqueId: number,
  children: (announce: Announce) => Node,
|};

function WithAnnouncer(props: Props) {
  const announce: Announce = useAnnouncer(props.uniqueId);
  return props.children(announce);
}

const getAnnounce = (myMock): Announce => myMock.mock.calls[0][0];
const getMock = () => jest.fn().mockImplementation(() => null);
const getElement = (uniqueId: number): ?HTMLElement =>
  document.getElementById(getId(uniqueId));

it('should create a new element when mounting', () => {
  const wrapper = mount(
    <WithAnnouncer uniqueId={5}>{getMock()}</WithAnnouncer>,
  );

  const el: ?HTMLElement = getElement(5);

  expect(el).toBeTruthy();

  wrapper.unmount();
});

it('should apply the appropriate aria attributes and non visibility styles', () => {
  const wrapper = mount(
    <WithAnnouncer uniqueId={5}>{getMock()}</WithAnnouncer>,
  );

  const el: ?HTMLElement = getElement(5);
  invariant(el, 'Could not find announcer');

  expect(el.getAttribute('aria-live')).toBe('assertive');
  expect(el.getAttribute('role')).toBe('log');
  expect(el.getAttribute('aria-atomic')).toBe('true');

  // not checking all the styles - just enough to know we are doing something
  expect(el.style.overflow).toBe('hidden');

  wrapper.unmount();
});

it('should remove the element when unmounting', () => {
  const wrapper = mount(
    <WithAnnouncer uniqueId={5}>{getMock()}</WithAnnouncer>,
  );

  wrapper.unmount();

  const el: ?HTMLElement = getElement(5);
  expect(el).not.toBeTruthy();
});

it('should set the text content of the announcement element', () => {
  // arrange
  const mock = getMock();
  const wrapper = mount(<WithAnnouncer uniqueId={6}>{mock}</WithAnnouncer>);
  const el: ?HTMLElement = getElement(6);
  invariant(el, 'Could not find announcer');

  // act
  const announce: Announce = getAnnounce(mock);
  announce('test');

  // assert
  expect(el.textContent).toBe('test');

  // cleanup
  wrapper.unmount();
});
