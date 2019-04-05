// @flow
import React, { type Node } from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import useStyleMarshal from '../../../../src/view/use-style-marshal';
import getStyles, {
  type Styles,
} from '../../../../src/view/use-style-marshal/get-styles';
import type { StyleMarshal } from '../../../../src/view/use-style-marshal/style-marshal-types';
import { prefix } from '../../../../src/view/data-attributes';

const getMarshal = (myMock): StyleMarshal => myMock.mock.calls[0][0];
const getMock = () => jest.fn().mockImplementation(() => null);

type Props = {|
  uniqueId: number,
  children: (marshal: StyleMarshal) => Node,
|};

function WithMarshal(props: Props) {
  const marshal: StyleMarshal = useStyleMarshal(props.uniqueId);
  return props.children(marshal);
}

const getDynamicStyleTagSelector = (uniqueId: number) =>
  `style[${prefix}-dynamic="${uniqueId}"]`;

const getAlwaysStyleTagSelector = (uniqueId: number) =>
  `style[${prefix}-always="${uniqueId}"]`;

const getDynamicStyleFromTag = (uniqueId: number): string => {
  const selector: string = getDynamicStyleTagSelector(uniqueId);
  const el: HTMLStyleElement = (document.querySelector(selector): any);
  return el.innerHTML;
};

const getAlwaysStyleFromTag = (uniqueId: number): string => {
  const selector: string = getAlwaysStyleTagSelector(uniqueId);
  const el: HTMLStyleElement = (document.querySelector(selector): any);
  return el.innerHTML;
};

it('should not mount style tags until mounted', () => {
  const uniqueId: number = 1;
  const dynamicSelector: string = getDynamicStyleTagSelector(uniqueId);
  const alwaysSelector: string = getAlwaysStyleTagSelector(uniqueId);

  // initially there is no style tag
  expect(document.querySelector(dynamicSelector)).toBeFalsy();
  expect(document.querySelector(alwaysSelector)).toBeFalsy();

  // now mounting
  const wrapper: ReactWrapper<*> = mount(
    <WithMarshal uniqueId={uniqueId}>{getMock()}</WithMarshal>,
  );

  // elements should now exist
  expect(document.querySelector(alwaysSelector)).toBeInstanceOf(
    HTMLStyleElement,
  );
  expect(document.querySelector(dynamicSelector)).toBeInstanceOf(
    HTMLStyleElement,
  );

  wrapper.unmount();
});

it('should apply the resting dyanmic styles by default', () => {
  const uniqueId: number = 2;
  const wrapper: ReactWrapper<*> = mount(
    <WithMarshal uniqueId={uniqueId}>{getMock()}</WithMarshal>,
  );

  const active: string = getDynamicStyleFromTag(uniqueId);
  expect(active).toEqual(getStyles(`${uniqueId}`).resting);

  wrapper.unmount();
});

it('should apply the resting always styles by default', () => {
  const uniqueId: number = 2;
  const wrapper: ReactWrapper<*> = mount(
    <WithMarshal uniqueId={uniqueId}>{getMock()}</WithMarshal>,
  );

  const always: string = getAlwaysStyleFromTag(uniqueId);
  expect(always).toEqual(getStyles(`${uniqueId}`).always);

  wrapper.unmount();
});

it('should apply the dragging styles when asked', () => {
  const uniqueId: number = 2;
  const mock = getMock();
  const wrapper: ReactWrapper<*> = mount(
    <WithMarshal uniqueId={uniqueId}>{mock}</WithMarshal>,
  );
  const marshal: StyleMarshal = getMarshal(mock);

  marshal.dragging();

  const active: string = getDynamicStyleFromTag(uniqueId);
  expect(active).toEqual(getStyles(`${uniqueId}`).dragging);

  wrapper.unmount();
});

it('should apply the drop animating styles when asked', () => {
  const uniqueId: number = 2;
  const mock = getMock();
  const wrapper: ReactWrapper<*> = mount(
    <WithMarshal uniqueId={uniqueId}>{mock}</WithMarshal>,
  );
  const marshal: StyleMarshal = getMarshal(mock);

  marshal.dropping('DROP');
  const active: string = getDynamicStyleFromTag(uniqueId);
  expect(active).toEqual(getStyles(`${uniqueId}`).dropAnimating);

  wrapper.unmount();
});

it('should apply the user cancel styles when asked', () => {
  const uniqueId: number = 2;
  const mock = getMock();
  const wrapper: ReactWrapper<*> = mount(
    <WithMarshal uniqueId={uniqueId}>{mock}</WithMarshal>,
  );
  const marshal: StyleMarshal = getMarshal(mock);

  marshal.dropping('CANCEL');
  const active: string = getDynamicStyleFromTag(uniqueId);
  expect(active).toEqual(getStyles(`${uniqueId}`).userCancel);

  wrapper.unmount();
});

it('should remove the style tag from the head when unmounting', () => {
  const uniqueId: number = 2;
  const wrapper: ReactWrapper<*> = mount(
    <WithMarshal uniqueId={uniqueId}>{getMock()}</WithMarshal>,
  );
  const selector1: string = getDynamicStyleTagSelector(uniqueId);
  const selector2: string = getAlwaysStyleTagSelector(uniqueId);

  // the style tag exists
  expect(document.querySelector(selector1)).toBeTruthy();
  expect(document.querySelector(selector2)).toBeTruthy();

  // now unmounted
  wrapper.unmount();

  expect(document.querySelector(selector1)).not.toBeTruthy();
  expect(document.querySelector(selector2)).not.toBeTruthy();
});

it('should allow subsequent updates', () => {
  const uniqueId: number = 10;
  const styles: Styles = getStyles(`${uniqueId}`);
  const mock = getMock();
  const wrapper: ReactWrapper<*> = mount(
    <WithMarshal uniqueId={uniqueId}>{mock}</WithMarshal>,
  );
  const marshal: StyleMarshal = getMarshal(mock);

  Array.from({ length: 4 }).forEach(() => {
    marshal.resting();
    expect(getDynamicStyleFromTag(uniqueId)).toEqual(styles.resting);

    marshal.dragging();
    expect(getDynamicStyleFromTag(uniqueId)).toEqual(styles.dragging);

    marshal.dropping('DROP');
    expect(getDynamicStyleFromTag(uniqueId)).toEqual(styles.dropAnimating);
  });

  wrapper.unmount();
});
