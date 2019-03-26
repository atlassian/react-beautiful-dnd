// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { mount } from 'enzyme';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';
import { Droppable, Draggable, DragDropContext } from '../../../../src';
import type { DraggableProvided, DroppableProvided } from '../../../../src';
// Imported as wildcard so we can mock `resetStyleContext` using spyOn

type AppState = {|
  foo: string,
|};
const original: AppState = {
  foo: 'bar',
};
// super boring reducer that always returns the same thing
const reducer = (state: AppState = original) => state;
const store = createStore(reducer);

class Unconnected extends Component<AppState> {
  render() {
    return <div>{this.props.foo}</div>;
  }
}

function mapStateToProps(state: AppState): AppState {
  return state;
}

const Connected = connect(mapStateToProps)(Unconnected);

it('should avoid clashes with parent redux applications', () => {
  class Container extends Component<*> {
    render() {
      return (
        <Provider store={store}>
          <DragDropContext onDragEnd={() => {}}>
            <Droppable droppableId="droppable">
              {(droppableProvided: DroppableProvided) => (
                <div
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                >
                  <Draggable draggableId="draggableId" index={0}>
                    {(draggableProvided: DraggableProvided) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.dragHandleProps}
                        {...draggableProvided.draggableProps}
                      >
                        {/* $FlowFixMe - not sure why this requires foo */}
                        <Connected />
                      </div>
                    )}
                  </Draggable>
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Provider>
      );
    }
  }
  const wrapper = mount(<Container />);

  expect(wrapper.find(Container).text()).toBe(original.foo);
});

it('should avoid clashes with child redux applications', () => {
  class Container extends Component<*> {
    render() {
      return (
        <DragDropContext onDragEnd={() => {}}>
          <Droppable droppableId="droppable">
            {(droppableProvided: DroppableProvided) => (
              <div
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
              >
                <Draggable draggableId="draggableId" index={0}>
                  {(draggableProvided: DraggableProvided) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.dragHandleProps}
                      {...draggableProvided.draggableProps}
                    >
                      <Provider store={store}>
                        {/* $FlowFixMe - not sure why this requires foo */}
                        <Connected />
                      </Provider>
                    </div>
                  )}
                </Draggable>
                {droppableProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      );
    }
  }
  const wrapper = mount(<Container />);

  expect(wrapper.find(Container).text()).toBe(original.foo);
});
