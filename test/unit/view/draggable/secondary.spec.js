// @flow
import type { Position } from 'css-box-model';
import type { DraggableId } from '../../../../src/types';
import type {
  MapProps,
  Provided,
  StateSnapshot,
  NotDraggingStyle,
  OwnProps,
} from '../../../../src/view/draggable/draggable-types';
import { transforms } from '../../../../src/animation';
import getLastCall from './util/get-last-call';
import { atRestMapProps, draggable, preset } from './util/get-props';
import getStubber from './util/get-stubber';
import mount from './util/mount';

const ownProps: OwnProps = {
  draggableId: preset.inHome2.descriptor.id,
  index: preset.inHome2.descriptor.index,
  isDragDisabled: false,
  disableInteractiveElementBlocking: true,
  shouldRespectForcePress: true,
  children: () => null,
  timeForLongPress: 150,
};

const getSecondarySnapshot = (
  combineTargetFor: ?DraggableId,
): StateSnapshot => ({
  isDragging: false,
  isDropAnimating: false,
  dropAnimation: null,
  mode: null,
  draggingOver: null,
  combineTargetFor,
  combineWith: null,
});

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
      mapped: {
        type: 'SECONDARY',
        offset,
        combineTargetFor: null,
        shouldAnimateDisplacement: true,
        snapshot: getSecondarySnapshot(null),
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
      mapped: {
        type: 'SECONDARY',
        offset,
        combineTargetFor: null,
        shouldAnimateDisplacement: false,
        snapshot: getSecondarySnapshot(null),
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
  it('should pass along snapshots - at rest', () => {
    const myMock = jest.fn();

    mount({
      ownProps,
      mapProps: atRestMapProps,
      WrappedComponent: getStubber(myMock),
    });

    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    expect(snapshot).toBe(atRestMapProps.mapped.snapshot);
  });

  it('should pass along snapshots - when moving out the way', () => {
    const myMock = jest.fn();
    const offset: Position = { x: 10, y: 20 };
    const mapProps: MapProps = {
      mapped: {
        type: 'SECONDARY',
        offset,
        combineTargetFor: null,
        shouldAnimateDisplacement: true,
        snapshot: getSecondarySnapshot(null),
      },
    };

    mount({
      ownProps,
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    expect(snapshot).toBe(mapProps.mapped.snapshot);
  });

  it('should pass along snapshots - when being combined with', () => {
    const myMock = jest.fn();
    const offset: Position = { x: 10, y: 20 };
    const mapProps: MapProps = {
      mapped: {
        type: 'SECONDARY',
        offset,
        combineTargetFor: draggable.id,
        shouldAnimateDisplacement: true,
        snapshot: getSecondarySnapshot(null),
      },
    };

    mount({
      ownProps,
      mapProps,
      WrappedComponent: getStubber(myMock),
    });

    const snapshot: StateSnapshot = getLastCall(myMock)[0].snapshot;
    expect(snapshot).toEqual(mapProps.mapped.snapshot);
  });
});
