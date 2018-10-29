// @flow
import type { ReactWrapper } from 'enzyme';
import { type Position } from 'css-box-model';
import type {
  MapProps,
  DraggingStyle,
  Provided,
  StateSnapshot,
} from '../../../../src/view/draggable/draggable-types';
import mount from './util/mount';
import getStubber from './util/get-stubber';
import {
  whileDragging,
  preset,
  atRestMapProps,
  droppable,
} from './util/get-props';
import Placeholder from '../../../../src/view/placeholder';
import getLastCall from './util/get-last-call';
import { zIndexOptions } from '../../../../src/view/draggable/draggable';
import { transitions } from '../../../../src/view/animation';

it('should render a placeholder', () => {
  const myMock = jest.fn();

  const wrapper: ReactWrapper = mount({
    mapProps: whileDragging,
    WrappedComponent: getStubber(myMock),
  });

  expect(wrapper.find(Placeholder).exists()).toBe(true);
  expect(wrapper.find(Placeholder).props().placeholder).toBe(
    preset.inHome1.placeholder,
  );
});

it('should move to the provided offset', () => {
  const myMock = jest.fn();
  const offset: Position = { x: 10, y: 20 };
  const mapProps: MapProps = {
    ...whileDragging,
    dragging: {
      ...whileDragging.dragging,
      offset,
    },
  };

  mount({
    mapProps,
    WrappedComponent: getStubber(myMock),
  });

  const expected: DraggingStyle = {
    position: 'fixed',
    zIndex: zIndexOptions.dragging,
    boxSizing: 'border-box',
    width: preset.inHome1.client.borderBox.width,
    height: preset.inHome1.client.borderBox.height,
    top: preset.inHome1.client.marginBox.top,
    left: preset.inHome1.client.marginBox.left,
    pointerEvents: 'none',
    opacity: null,
    transition: transitions.fluid,
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  };

  const provided: Provided = getLastCall(myMock)[0].provided;
  expect(provided.draggableProps.style).toEqual(expected);
});

it('should move to the provided offset on update', () => {
  const myMock = jest.fn();
  const Stubber = getStubber(myMock);
  const offsets: Position[] = [
    { x: 12, y: 3 },
    { x: 20, y: 100 },
    { x: -100, y: 20 },
  ];

  // initial render
  const wrapper = mount({
    mapProps: atRestMapProps,
    WrappedComponent: Stubber,
  });
  myMock.mockClear();

  offsets.forEach((offset: Position) => {
    const mapProps: MapProps = {
      ...whileDragging,
      dragging: {
        ...whileDragging.dragging,
        offset,
      },
    };

    wrapper.setProps(mapProps);

    const expected = `translate(${offset.x}px, ${offset.y}px)`;
    const provided: Provided = getLastCall(myMock)[0].provided;
    const style: DraggingStyle = (provided.draggableProps.style: any);
    expect(style.transform).toBe(expected);
  });
});

it('should animate snap movements', () => {
  const myMock = jest.fn();
  const offset: Position = { x: 10, y: 20 };
  const mapProps: MapProps = {
    ...whileDragging,
    dragging: {
      ...whileDragging.dragging,
      mode: 'SNAP',
      offset,
    },
  };

  mount({
    mapProps,
    WrappedComponent: getStubber(myMock),
  });

  const expected: DraggingStyle = {
    position: 'fixed',
    zIndex: zIndexOptions.dragging,
    boxSizing: 'border-box',
    width: preset.inHome1.client.borderBox.width,
    height: preset.inHome1.client.borderBox.height,
    top: preset.inHome1.client.marginBox.top,
    left: preset.inHome1.client.marginBox.left,
    pointerEvents: 'none',
    opacity: null,
    transition: transitions.snap,
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  };

  const provided: Provided = getLastCall(myMock)[0].provided;
  expect(provided.draggableProps.style).toEqual(expected);
});

describe('snapshot', () => {
  it('should tell a consumer what is currently being dragged over', () => {
    const mapProps: MapProps = {
      ...whileDragging,
      dragging: {
        ...whileDragging.dragging,
        draggingOver: 'foobar',
        mode: 'SNAP',
      },
    };

    const myMock = jest.fn();

    mount({
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    const expected: StateSnapshot = {
      isDragging: true,
      draggingOver: 'foobar',
      isDropAnimating: false,
      dropAnimation: null,
      combineWith: null,
      combineTargetFor: null,
      mode: 'SNAP',
    };
    expect(snapshot).toEqual(expected);
  });

  it('should let consumers know if dragging and not over a droppable', () => {
    const mapProps: MapProps = {
      ...whileDragging,
      dragging: {
        ...whileDragging.dragging,
        draggingOver: null,
      },
    };

    const myMock = jest.fn();

    mount({
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    const expected: StateSnapshot = {
      isDragging: true,
      draggingOver: null,
      isDropAnimating: false,
      dropAnimation: null,
      combineWith: null,
      combineTargetFor: null,
      mode: 'FLUID',
    };
    expect(snapshot).toEqual(expected);
  });

  it('should tell a consumer what is being combined with', () => {
    const mapProps: MapProps = {
      ...whileDragging,
      dragging: {
        ...whileDragging.dragging,
        draggingOver: preset.home.descriptor.id,
        combineWith: preset.inHome2.descriptor.id,
      },
    };

    const myMock = jest.fn();

    mount({
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    const expected: StateSnapshot = {
      isDragging: true,
      draggingOver: droppable.id,
      isDropAnimating: false,
      dropAnimation: null,
      combineWith: preset.inHome2.descriptor.id,
      combineTargetFor: null,
      mode: 'FLUID',
    };
    expect(snapshot).toEqual(expected);
  });
});
