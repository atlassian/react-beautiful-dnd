// @flow
import type { Position } from 'css-box-model';
import { transforms } from '../../../../src/view/animation';
import getLastCall from './util/get-last-call';
import { atRestMapProps, draggable, preset } from './util/get-props';
import getStubber from './util/get-stubber';
import mount from './util/mount';
import type {
  MapProps,
  Provided,
  StateSnapshot,
  NotDraggingStyle,
  OwnProps,
} from '../../../../src/view/draggable/draggable-types';

const ownProps: OwnProps = {
  draggableId: preset.inHome2.descriptor.id,
  index: preset.inHome2.descriptor.index,
  isDragDisabled: false,
  disableInteractiveElementBlocking: true,
  children: () => null,
};

describe('provided', () => {
  const atRestStyle: NotDraggingStyle = {
    transform: null,
    transition: null,
  };

  it('should not move anywhere when at rest', () => {
    const myMock = jest.fn();

    mount({
      ownProps,
      mapProps: atRestMapProps,
      WrappedComponent: getStubber(myMock),
    });

    const provided: Provided = getLastCall(myMock)[0].provided;
    expect(provided.draggableProps.style).toEqual(atRestStyle);
  });

  it('should should move out of the way when requested', () => {
    const myMock = jest.fn();
    const offset: Position = { x: 10, y: 20 };
    const mapProps: MapProps = {
      dragging: null,
      secondary: {
        offset,
        combineTargetFor: null,
        shouldAnimateDisplacement: true,
      },
    };

    mount({
      ownProps,
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const expected: NotDraggingStyle = {
      transform: transforms.moveTo(offset),
      // will use global transition
      transition: null,
    };
    const provided: Provided = getLastCall(myMock)[0].provided;
    expect(provided.draggableProps.style).toEqual(expected);
  });

  it('should should move immediately out of the way if requested', () => {
    const myMock = jest.fn();
    const offset: Position = { x: 10, y: 20 };
    const mapProps: MapProps = {
      dragging: null,
      secondary: {
        offset,
        combineTargetFor: null,
        shouldAnimateDisplacement: false,
      },
    };

    mount({
      ownProps,
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const expected: NotDraggingStyle = {
      transform: transforms.moveTo(offset),
      // skip global transition
      transition: 'none',
    };
    const provided: Provided = getLastCall(myMock)[0].provided;
    expect(provided.draggableProps.style).toEqual(expected);
  });
});

describe('snapshot', () => {
  const empty: StateSnapshot = {
    isDragging: false,
    isDropAnimating: false,
    dropAnimation: null,
    draggingOver: null,
    combineWith: null,
    combineTargetFor: null,
    mode: null,
  };

  it('should give a empty snapshot when at rest', () => {
    const myMock = jest.fn();

    mount({
      ownProps,
      mapProps: atRestMapProps,
      WrappedComponent: getStubber(myMock),
    });

    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    expect(snapshot).toEqual(empty);
  });

  it('should give an empty snapshot when moving out of the way', () => {
    const myMock = jest.fn();
    const offset: Position = { x: 10, y: 20 };
    const mapProps: MapProps = {
      dragging: null,
      secondary: {
        offset,
        combineTargetFor: null,
        shouldAnimateDisplacement: true,
      },
    };

    mount({
      ownProps,
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    expect(snapshot).toEqual(empty);
  });

  it('should let a consumer know when it is being combined with', () => {
    const myMock = jest.fn();
    const offset: Position = { x: 10, y: 20 };
    const mapProps: MapProps = {
      dragging: null,
      secondary: {
        offset,
        combineTargetFor: draggable.id,
        shouldAnimateDisplacement: true,
      },
    };

    mount({
      ownProps,
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const expected: StateSnapshot = {
      isDragging: false,
      isDropAnimating: false,
      dropAnimation: null,
      draggingOver: null,
      combineWith: null,
      combineTargetFor: draggable.id,
      mode: null,
    };
    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    expect(snapshot).toEqual(expected);
  });
});
