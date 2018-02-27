// @flow
/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TestUtils from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';
import { Droppable, Draggable, DragDropContext, resetServerContext } from '../../../src/';
import type { DraggableProvided, DroppableProvided } from '../../../src/';
import { storeKey, canLiftContextKey } from '../../../src/view/context-keys';
// Imported as wildcard so we can mock `resetStyleContext` using spyOn
import * as StyleMarshal from '../../../src/view/style-marshal/style-marshal';

class App extends Component<*> {
  // Part of reacts api is to use flow types for this.
  // Sadly cannot use flow
  static contextTypes = {
    [storeKey]: PropTypes.shape({
      dispatch: PropTypes.func.isRequired,
      subscribe: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
    }).isRequired,
    [canLiftContextKey]: PropTypes.func.isRequired,
  };

  render() {
    return <div>Hi there</div>;
  }
}

describe('DragDropContext', () => {
  it('should put a store on the context', () => {
    // using react test utils to allow access to nested contexts
    const tree = TestUtils.renderIntoDocument(
      <DragDropContext
        onDragEnd={() => { }}
      >
        <App />
      </DragDropContext>,
    );

    const app = TestUtils.findRenderedComponentWithType(tree, App);

    expect(app.context[storeKey]).toHaveProperty('dispatch');
    expect(app.context[storeKey].dispatch).toBeInstanceOf(Function);
    expect(app.context[storeKey]).toHaveProperty('getState');
    expect(app.context[storeKey].getState).toBeInstanceOf(Function);
    expect(app.context[storeKey]).toHaveProperty('subscribe');
    expect(app.context[storeKey].subscribe).toBeInstanceOf(Function);
  });

  it('should not throw when unmounting', () => {
    const wrapper = mount(
      <DragDropContext
        onDragEnd={() => { }}
      >
        <App />
      </DragDropContext>,
    );

    expect(() => wrapper.unmount()).not.toThrow();
  });

  describe('can start drag', () => {
    // behavior of this function is tested in can-start-drag.spec.js
    it('should put a can lift function on the context', () => {
      // using react test utils to allow access to nested contexts
      const tree = TestUtils.renderIntoDocument(
        <DragDropContext
          onDragEnd={() => { }}
        >
          <App />
        </DragDropContext>,
      );

      const app = TestUtils.findRenderedComponentWithType(tree, App);

      expect(app.context[canLiftContextKey]).toBeInstanceOf(Function);
    });
  });

  describe('Playing with other redux apps', () => {
    type ExternalState = {|
      foo: string,
    |}
    const original: ExternalState = {
      foo: 'bar',
    };
    // super boring reducer that always returns the same thing
    const reducer = (state: ExternalState = original) => state;
    const store = createStore(reducer);

    class Unconnected extends Component<ExternalState> {
      render() {
        return <div>{this.props.foo}</div>;
      }
    }

    const Connected = connect((state: ExternalState): ExternalState => state)(Unconnected);

    it('should avoid clashes with parent redux applications', () => {
      class Container extends Component<*> {
        render() {
          return (
            <Provider store={store}>
              <DragDropContext onDragEnd={() => { }}>
                <Droppable droppableId="droppable">
                  {(droppableProvided: DroppableProvided) => (
                    <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                      <Draggable draggableId="draggableId">
                        {(draggableProvided: DraggableProvided) => (
                          <div>
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.dragHandleProps}
                              {...draggableProvided.draggableProps}
                            >
                              <Connected />
                            </div>
                            {draggableProvided.placeholder}
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
            <DragDropContext onDragEnd={() => { }}>
              <Droppable droppableId="droppable">
                {(droppableProvided: DroppableProvided) => (
                  <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                    <Draggable draggableId="draggableId">
                      {(draggableProvided: DraggableProvided) => (
                        <div>
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.dragHandleProps}
                            {...draggableProvided.draggableProps}
                          >
                            <Provider store={store}>
                              <Connected />
                            </Provider>
                          </div>
                          {draggableProvided.placeholder}
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
  });
});

describe('resetServerContext', () => {
  it('should reset the style marshal context', () => {
    const spy = jest.spyOn(StyleMarshal, 'resetStyleContext');
    expect(spy).not.toHaveBeenCalled();
    resetServerContext();
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
