/**
* @jest-environment node
*/
import React, { Component } from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { DragDropContext, Droppable, Draggable } from '../../../src/';
import type { Provided as DroppableProvided } from '../../../src/view/droppable/droppable-types';
import type { Provided as DraggableProvided } from '../../../src/view/draggable/draggable-types';

class App extends Component {
  onDragStart = () => {
    // drag is starting!
  }

  onDragEnd = () => {
    // drag is ending!
  }

  render() {
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Droppable droppableId="drop-1">
          {(provided: DroppableProvided) => (
            <div ref={provided.innerRef}>
              <Draggable draggableId="drag-1">
                {(dragProvided: DraggableProvided) => (
                  <div>
                    <div
                      style={dragProvided.draggableStyle}
                      ref={dragProvided.innerRef}
                      {...dragProvided.dragHandleProps}
                    />
                    {dragProvided.placeholder}
                  </div>
                )}
              </Draggable>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

describe('server side rendering', () => {
  // Checking that the browser globals are not available in this test file
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    throw new Error('browser globals found in node test');
  }

  it('should support rendering to a string', () => {
    const result: string = renderToString(<App />);

    expect(result).toEqual(expect.any(String));
    expect(result).toMatchSnapshot();
  });

  it('should support rendering to static markup', () => {
    const result: string = renderToStaticMarkup(<App />);

    expect(result).toEqual(expect.any(String));
    expect(result).toMatchSnapshot();
  });
});
