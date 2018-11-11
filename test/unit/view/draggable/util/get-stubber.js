// @flow
import React from 'react';
import type {
  Provided,
  StateSnapshot,
} from '../../../../../src/view/draggable/draggable-types';

export default (stub: Function) =>
  class Stubber extends React.Component<{
    provided: Provided,
    snapshot: StateSnapshot,
  }> {
    render() {
      const provided: Provided = this.props.provided;
      const snapshot: StateSnapshot = this.props.snapshot;
      stub({ provided, snapshot });
      return (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          Drag me!
        </div>
      );
    }
  };
