// @flow
import { type Position } from 'css-box-model';
import type {
  MapProps,
  DraggingStyle,
  Provided,
  StateSnapshot,
} from '../../../../src/view/draggable/draggable-types';
import mount from './util/mount';
import getStubber from './util/get-stubber';
import { whileDragging, preset, atRestMapProps } from './util/get-props';
import getLastCall from './util/get-last-call';
import { zIndexOptions } from '../../../../src/view/draggable/get-style';
import { transitions, combine } from '../../../../src/animation';

it('should move to the provided offset', () => {
  const myMock = jest.fn();
  const offset: Position = { x: 10, y: 20 };
  const mapProps: MapProps = {
    mapped: {
      type: 'DRAGGING',
      ...whileDragging.mapped,
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
      mapped: {
        type: 'DRAGGING',
        ...whileDragging.mapped,
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
    mapped: {
      type: 'DRAGGING',
      ...whileDragging.mapped,
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

it('should update the opacity when combining with another item', () => {
  const myMock = jest.fn();
  const offset: Position = { x: 10, y: 20 };
  const mapProps: MapProps = {
    mapped: {
      type: 'DRAGGING',
      ...whileDragging.mapped,
      offset,
      draggingOver: preset.home.descriptor.id,
      combineWith: preset.inHome2.descriptor.id,
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
    // key line
    opacity: combine.opacity.combining,
    transition: transitions.fluid,
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  };

  const provided: Provided = getLastCall(myMock)[0].provided;
  expect(provided.draggableProps.style).toEqual(expected);
});

it('should pass on the snapshot', () => {
  const myMock = jest.fn();

  mount({
    mapProps: whileDragging,
    WrappedComponent: getStubber(myMock),
  });

  const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
  expect(snapshot).toBe(whileDragging.mapped.snapshot);
});
