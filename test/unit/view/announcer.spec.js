// @flow
import React, { type Node } from 'react';
import invariant from 'tiny-invariant';
import { mount } from 'enzyme';
import type { Announce, ContextId } from '../../../src/types';
import useAnnouncer from '../../../src/view/use-announcer';
import { getId } from '../../../src/view/use-announcer/use-announcer';

jest.useFakeTimers();

type Props = {|
  contextId: ContextId,
  children: (announce: Announce) => Node,
|};

function WithAnnouncer(props: Props) {
  const announce: Announce = useAnnouncer(props.contextId);
  return props.children(announce);
}

const getAnnounce = (myMock): Announce => myMock.mock.calls[0][0];
const getMock = () => jest.fn().mockImplementation(() => null);
const getElement = (contextId: ContextId): ?HTMLElement =>
  document.getElementById(getId(contextId));

it('should create a new element when mounting', () => {
  const wrapper = mount(
    <WithAnnouncer contextId="5">{getMock()}</WithAnnouncer>,
  );

  const el: ?HTMLElement = getElement('5');

  expect(el).toBeTruthy();

  wrapper.unmount();
});

it('should apply the appropriate aria attributes and non visibility styles', () => {
  const wrapper = mount(
    <WithAnnouncer contextId="5">{getMock()}</WithAnnouncer>,
  );

  const el: ?HTMLElement = getElement('5');
  invariant(el, 'Could not find announcer');

  expect(el.getAttribute('aria-live')).toBe('assertive');
  expect(el.getAttribute('role')).toBe('log');
  expect(el.getAttribute('aria-atomic')).toBe('true');

  // not checking all the styles - just enough to know we are doing something
  expect(el.style.overflow).toBe('hidden');

  wrapper.unmount();
});

it('should remove the element when unmounting after a timeout', () => {
  const wrapper = mount(
    <WithAnnouncer contextId="5">{getMock()}</WithAnnouncer>,
  );

  wrapper.unmount();
  // not unmounted straight away
  expect(getElement('5')).toBeTruthy();

  jest.runOnlyPendingTimers();
  expect(getElement('5')).not.toBeTruthy();
});

it('should set the text content of the announcement element', () => {
  // arrange
  const mock = getMock();
  const wrapper = mount(<WithAnnouncer contextId="6">{mock}</WithAnnouncer>);
  const el: ?HTMLElement = getElement('6');
  invariant(el, 'Could not find announcer');

  // act
  const announce: Announce = getAnnounce(mock);
  announce('test');

  // assert
  expect(el.textContent).toBe('test');

  // cleanup
  wrapper.unmount();
});
