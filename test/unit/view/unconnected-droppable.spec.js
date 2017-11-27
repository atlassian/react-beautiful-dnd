// @flow
import React, { Component } from 'react';
import { mount } from 'enzyme';
// eslint-disable-next-line no-duplicate-imports
import type { ReactWrapper } from 'enzyme';
import Droppable from '../../../src/view/droppable/droppable';
import Placeholder from '../../../src/view/placeholder/';
import { withStore } from '../../utils/get-context-options';
import { getPreset } from '../../utils/dimension';
import type { DroppableId, DraggableDimension } from '../../../src/types';
import type { MapProps, OwnProps, Provided, StateSnapshot } from '../../../src/view/droppable/droppable-types';

const getStubber = (mock: Function) =>
  class Stubber extends Component<{provided: Provided, snapshot: StateSnapshot}> {
    render() {
      mock({
        provided: this.props.provided,
        snapshot: this.props.snapshot,
      });
      return (
        <div>Hey there</div>
      );
    }
  };
const defaultDroppableId: DroppableId = 'droppable-1';
const notDraggingOverMapProps: MapProps = {
  isDraggingOver: false,
  placeholder: null,
};
const isDraggingOverHomeMapProps: MapProps = {
  isDraggingOver: true,
  placeholder: null,
};

const data = getPreset();
const inHome1: DraggableDimension = data.inHome1;

const isDraggingOverForeignMapProps: MapProps = {
  isDraggingOver: true,
  placeholder: inHome1.placeholder,
};

// $ExpectError - not providing children
const defaultOwnProps: OwnProps = {
  droppableId: defaultDroppableId,
  isDropDisabled: false,
};

type MountArgs = {|
  WrappedComponent: any,
  ownProps?: OwnProps,
  mapProps?: MapProps,
|}

const mountDroppable = ({
  WrappedComponent,
  ownProps = defaultOwnProps,
  mapProps = notDraggingOverMapProps,
}: MountArgs = {}): ReactWrapper => mount(
  // $ExpectError - using spread
  <Droppable
    {...ownProps}
    {...mapProps}
  >
    {(provided: Provided, snapshot: StateSnapshot) => (
      <WrappedComponent provided={provided} snapshot={snapshot} />
    )}
  </Droppable>
  , withStore());

describe('Droppable - unconnected', () => {
  describe('dragging over home droppable', () => {
    it('should provide the props to its children', () => {
      const myMock = jest.fn();
      mountDroppable({
        mapProps: isDraggingOverHomeMapProps,
        WrappedComponent: getStubber(myMock),
      });

      const provided: Provided = myMock.mock.calls[0][0].provided;
      const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;
      expect(provided.innerRef).toBeInstanceOf(Function);
      expect(snapshot.isDraggingOver).toBe(true);
      expect(provided.placeholder).toBe(null);
    });
  });

  describe('dragging over foreign droppable', () => {
    it('should provide the props to its children', () => {
      const myMock = jest.fn();
      mountDroppable({
        mapProps: isDraggingOverForeignMapProps,
        WrappedComponent: getStubber(myMock),
      });

      const provided: Provided = myMock.mock.calls[0][0].provided;
      const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;
      expect(provided.innerRef).toBeInstanceOf(Function);
      expect(snapshot.isDraggingOver).toBe(true);
      // $ExpectError - type property of placeholder
      expect(provided.placeholder.type).toBe(Placeholder);
      // $ExpectError - props property of placeholder
      expect(provided.placeholder.props.placeholder)
        .toEqual(isDraggingOverForeignMapProps.placeholder);
    });

    describe('not dragging over droppable', () => {
      it('should provide the props to its children', () => {
        const myMock = jest.fn();
        mountDroppable({
          mapProps: notDraggingOverMapProps,
          WrappedComponent: getStubber(myMock),
        });

        const provided: Provided = myMock.mock.calls[0][0].provided;
        const snapshot: StateSnapshot = myMock.mock.calls[0][0].snapshot;
        expect(provided.innerRef).toBeInstanceOf(Function);
        expect(snapshot.isDraggingOver).toBe(false);
        expect(provided.placeholder).toBe(null);
      });
    });
  });
});

