// @flow
import React from 'react';
import type { Provided } from '../../../../../src/view/draggable/draggable-types';

export default class Item extends React.Component<{ provided: Provided }> {
  render() {
    const provided: Provided = this.props.provided;

    return (
      <div
        className="item"
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        Hello there!
      </div>
    );
  }
}
