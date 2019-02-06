// @flow
import { type Position } from 'css-box-model';
import type {
  MapProps,
  DraggingStyle,
  Provided,
  StateSnapshot,
  DropAnimation,
} from '../../../../src/view/draggable/draggable-types';
import mount from './util/mount';
import getStubber from './util/get-stubber';
import {
  whileDragging,
  preset,
  atRestMapProps,
  getDispatchPropsStub,
  whileDropping,
  droppable,
} from './util/get-props';
import getLastCall from './util/get-last-call';
import { zIndexOptions } from '../../../../src/view/draggable/draggable';
import {
  transitions,
  curves,
  combine,
  transforms,
} from '../../../../src/view/animation';

it('should animate a drop to a provided offset', () => {
  const myMock = jest.fn();
  const offset: Position = { x: 10, y: 20 };
  const duration: number = 1;
  const dropping: DropAnimation = {
    duration,
    curve: curves.drop,
    moveTo: offset,
    opacity: null,
    scale: null,
  };
  const mapProps: MapProps = {
    ...whileDragging,
    dragging: {
      ...whileDragging.dragging,
      offset,
      dropping,
    },
  };

  mount({
    mapProps,
    WrappedComponent: getStubber(myMock),
  });

  const expected: DraggingStyle = {
    position: 'fixed',
    zIndex: zIndexOptions.dropAnimating,
    boxSizing: 'border-box',
    width: preset.inHome1.client.borderBox.width,
    height: preset.inHome1.client.borderBox.height,
    top: preset.inHome1.client.marginBox.top,
    left: preset.inHome1.client.marginBox.left,
    pointerEvents: 'none',
    opacity: null,
    transition: transitions.drop(duration),
    transform: transforms.drop(offset, false),
  };

  const provided: Provided = getLastCall(myMock)[0].provided;
  expect(provided.draggableProps.style).toEqual(expected);
});

it('should animate opacity and scale when combining', () => {
  const myMock = jest.fn();
  const offset: Position = { x: 10, y: 20 };
  const duration: number = 1;
  const dropping: DropAnimation = {
    duration,
    curve: curves.drop,
    moveTo: offset,
    opacity: 0,
    scale: combine.scale.drop,
  };
  const mapProps: MapProps = {
    ...whileDragging,
    dragging: {
      ...whileDragging.dragging,
      combineWith: preset.inHome2.descriptor.id,
      offset,
      dropping,
    },
  };

  mount({
    mapProps,
    WrappedComponent: getStubber(myMock),
  });

  const expected: DraggingStyle = {
    position: 'fixed',
    zIndex: zIndexOptions.dropAnimating,
    boxSizing: 'border-box',
    width: preset.inHome1.client.borderBox.width,
    height: preset.inHome1.client.borderBox.height,
    top: preset.inHome1.client.marginBox.top,
    left: preset.inHome1.client.marginBox.left,
    pointerEvents: 'none',
    opacity: combine.opacity.drop,
    transition: transitions.drop(duration),
    transform: transforms.drop(offset, true),
  };

  const provided: Provided = getLastCall(myMock)[0].provided;
  expect(provided.draggableProps.style).toEqual(expected);
});

it('should trigger a drop animation finished action when the transition is finished', () => {
  const myMock = jest.fn();
  const dispatchPropsStub = getDispatchPropsStub();
  const offset: Position = { x: 10, y: 20 };
  const duration: number = 1;
  const dropping: DropAnimation = {
    duration,
    curve: curves.drop,
    moveTo: offset,
    opacity: null,
    scale: null,
  };
  const mapProps: MapProps = {
    ...whileDragging,
    dragging: {
      ...whileDragging.dragging,
      offset,
      dropping,
    },
  };

  const wrapper = mount({
    mapProps,
    dispatchProps: dispatchPropsStub,
    WrappedComponent: getStubber(myMock),
  });

  expect(dispatchPropsStub.dropAnimationFinished).not.toHaveBeenCalled();

  wrapper.simulate('transitionEnd');

  expect(dispatchPropsStub.dropAnimationFinished).toHaveBeenCalled();
});

it('should only trigger a drop animation finished event if a transition end occurs while dropping', () => {
  const myMock = jest.fn();
  const dispatchPropsStub = getDispatchPropsStub();

  // not trigger at rest
  const wrapper = mount({
    mapProps: atRestMapProps,
    dispatchProps: dispatchPropsStub,
    WrappedComponent: getStubber(myMock),
  });
  wrapper.simulate('transitionEnd');
  expect(dispatchPropsStub.dropAnimationFinished).not.toHaveBeenCalled();

  // not triggered during drag
  wrapper.setProps(whileDragging);
  wrapper.simulate('transitionEnd');
  expect(dispatchPropsStub.dropAnimationFinished).not.toHaveBeenCalled();

  // triggered during drop
  wrapper.setProps(whileDropping);
  wrapper.simulate('transitionEnd');
  expect(dispatchPropsStub.dropAnimationFinished).toHaveBeenCalled();
});

describe('snapshot', () => {
  it('should let consumers know a drop is occuring and provide drop animation information', () => {
    const offset: Position = { x: 10, y: 20 };
    const duration: number = 1;
    const dropping: DropAnimation = {
      duration,
      curve: curves.drop,
      moveTo: offset,
      opacity: null,
      scale: null,
    };
    const mapProps: MapProps = {
      ...whileDragging,
      dragging: {
        ...whileDragging.dragging,
        offset,
        dropping,
      },
    };
    const myMock = jest.fn();

    mount({
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    const expected: StateSnapshot = {
      // still set to true while dropping
      isDragging: true,
      isDropAnimating: true,
      dropAnimation: dropping,
      draggingOver: droppable.id,
      combineWith: null,
      combineTargetFor: null,
      mode: 'FLUID',
    };
    expect(snapshot).toEqual(expected);
  });
});
