// @flow
import type { ReactWrapper } from 'enzyme';
import type { Provided } from '../../../../src/view/draggable/draggable-types';
import mount from './util/mount';
import getStubber from './util/get-stubber';
import getLastCall from './util/get-last-call';
import { atRestMapProps } from './util/get-props';
import * as attributes from '../../../../src/view/data-attributes';

it('should not create any wrapping elements', () => {
  const wrapper: ReactWrapper<*> = mount();

  const node = wrapper.getDOMNode();

  expect(node.className).toBe('item');
});

it('should attach a data attribute for global styling', () => {
  const myMock = jest.fn();
  const Stubber = getStubber(myMock);
  const styleContext: string = 'this is a cool style context';

  mount({
    mapProps: atRestMapProps,
    WrappedComponent: Stubber,
    styleContext,
  });
  const provided: Provided = getLastCall(myMock)[0].provided;

  expect(provided.draggableProps[attributes.draggable]).toEqual(styleContext);
});
