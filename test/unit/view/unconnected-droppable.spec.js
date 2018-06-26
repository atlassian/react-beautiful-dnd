// @flow
import React, { Component } from 'react';
import { mount } from 'enzyme';
// eslint-disable-next-line no-duplicate-imports
import type { ReactWrapper } from 'enzyme';
import Droppable from '../../../src/view/droppable/droppable';
import Placeholder from '../../../src/view/placeholder/';
import { withStore, combine, withDimensionMarshal, withStyleContext } from '../../utils/get-context-options';
import { getPreset } from '../../utils/dimension';
import type {
  DraggableId,
  DroppableId,
  DraggableDimension,
} from '../../../src/types';
import type {
  MapProps,
  OwnProps,
  Provided,
  StateSnapshot,
} from '../../../src/view/droppable/droppable-types';

const getStubber = (mock: Function) =>
  class Stubber extends Component<{provided: Provided, snapshot: StateSnapshot}> {
    render() {
      const { provided, snapshot } = this.props;
      mock({
        provided,
        snapshot,
      });
      return (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          Hey there
          {provided.placeholder}
        </div>
      );
    }
  };
const defaultDroppableId: DroppableId = 'droppable-1';
const draggableId: DraggableId = 'draggable-1';
const notDraggingOverMapProps: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  placeholder: null,
};
const isDraggingOverHomeMapProps: MapProps = {
  isDraggingOver: true,
  draggingOverWith: draggableId,
  placeholder: null,
};

const data = getPreset();
const inHome1: DraggableDimension = data.inHome1;

const isDraggingOverForeignMapProps: MapProps = {
  isDraggingOver: true,
  draggingOverWith: 'draggable-1',
  placeholder: inHome1.placeholder,
};

const defaultOwnProps: OwnProps = {
  droppableId: defaultDroppableId,
  isDropDisabled: false,
  type: 'TYPE',
  direction: 'vertical',
  ignoreContainerClipping: false,
  children: () => null,
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
  </Droppable>,
  combine(
    withStore(),
    withDimensionMarshal(),
    withStyleContext(),
  )
);

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
      expect(snapshot.draggingOverWith).toBe(draggableId);
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
      expect(snapshot.draggingOverWith).toBe(draggableId);
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
        expect(snapshot.draggingOverWith).toBe(null);
        expect(provided.placeholder).toBe(null);
      });
    });
  });

  class WithConditionalPlaceholder extends Component<{| provided: Provided |}> {
    render() {
      return (
        <div
          ref={this.props.provided.innerRef}
          {...this.props.provided.droppableProps}
        >
          Not rendering placeholder
        </div>
      );
    }
  }

  describe('should log a warning if a placeholder is not mounted by a consumer', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => { });
    });
    afterEach(() => {
      console.warn.mockRestore();
    });

    it('should log a warning when mounting', () => {
      mountDroppable({
        mapProps: isDraggingOverForeignMapProps,
        WrappedComponent: WithConditionalPlaceholder,
      });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Droppable setup issue: DroppableProvided > placeholder could not be found.')
      );
    });

    it('should log a warning when updating', () => {
      const wrapper = mountDroppable({
        mapProps: notDraggingOverMapProps,
        WrappedComponent: WithConditionalPlaceholder,
      });

      wrapper.setProps(isDraggingOverForeignMapProps);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Droppable setup issue: DroppableProvided > placeholder could not be found.')
      );
    });
  });
});

