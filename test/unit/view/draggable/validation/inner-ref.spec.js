// @flow
import React from 'react';
import type { Provided } from '../../../../../src/view/draggable/draggable-types';
import mount from '../util/mount';

jest.spyOn(console, 'error').mockImplementation(() => {});

it('should warn a consumer if they have not provided a ref', () => {
  class NoRef extends React.Component<{ provided: Provided }> {
    render() {
      const provided: Provided = this.props.provided;

      return (
        <div
          className="item"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          Hello there!
        </div>
      );
    }
  }

  expect(() => mount({ WrappedComponent: NoRef })).toThrow();
});

it('should throw a consumer if they have provided an SVGElement', () => {
  class WithSVG extends React.Component<{ provided: Provided }> {
    render() {
      const provided: Provided = this.props.provided;

      return (
        <svg
          className="item"
          // $FlowFixMe - invalid ref type
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          Hello there!
        </svg>
      );
    }
  }

  expect(() => mount({ WrappedComponent: WithSVG })).toThrow();
});
