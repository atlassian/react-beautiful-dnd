// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TestUtils from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { DragDropContext } from '../../../src/';
import { storeKey, canLiftContextKey } from '../../../src/view/context-keys';
import canLift from '../../../src/state/can-start-drag';

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
});
