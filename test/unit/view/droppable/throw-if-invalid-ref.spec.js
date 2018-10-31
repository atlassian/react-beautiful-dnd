// @flow
import React from 'react';
import type { Provided } from '../../../../src/view/droppable/droppable-types';
import mount from './util/mount';

jest.spyOn(console, 'error').mockImplementation(() => {});

it('should warn a consumer if they have not provided a ref', () => {
  class NoRef extends React.Component<{ provided: Provided }> {
    render() {
      const provided: Provided = this.props.provided;

      return (
        <div {...provided.droppableProps}>
          Hello there
          {provided.placeholder}
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
        // $FlowFixMe - flow is correctly stating this is not a HTMLElement
        <svg {...provided.droppableProps} ref={provided.innerRef}>
          Hello there
          {provided.placeholder}
        </svg>
      );
    }
  }

  expect(() => mount({ WrappedComponent: WithSVG })).toThrow();
});
