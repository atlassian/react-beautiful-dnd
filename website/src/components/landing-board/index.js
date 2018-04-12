// @flow
import React from 'react';
import { DragDropContext } from '../../../../src';

export default class LandingBoard extends React.Component<*> {
  onDragEnd = () => {

  }

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        Board goes here
      </DragDropContext>
    );
  }
}
