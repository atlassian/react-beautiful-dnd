// disabling flowtype to keep this example super simple
/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react';
import { DragDropContext, Droppable, Draggable } from '../../../src';
import { ShadowRootContext } from './inside-shadow-root';

// fake data generator
const getItems = (count) =>
  Array.from({ length: count }, (v, k) => k).map((k) => ({
    id: `item-${k}`,
    content: `item ${k}`,
  }));

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
  display: 'block',

  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : 'red',

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? 'lightblue' : 'grey',
  padding: grid,
  width: 250,
});

class SomeCustomElement extends HTMLElement {
  childComponent;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    this.childComponent = document.createElement('div');
    root.appendChild(this.childComponent);
  }

  connectedCallback() {
    this.childComponent.textContent = this.getAttribute('content');
  }
}

customElements.define('some-custom-element', SomeCustomElement);

export default class App extends Component {
  constructor(props, context) {
    super(props, context);
    // eslint-disable-next-line react/state-in-constructor
    this.state = {
      items: getItems(10),
    };
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index,
    );

    this.setState({
      items,
    });
  }

  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
  render() {
    return (
      <ShadowRootContext.Consumer>
        {(stylesRoot) => (
          <DragDropContext
            onDragEnd={this.onDragEnd}
            stylesInsertionPoint={stylesRoot}
          >
            <Droppable droppableId="droppable">
              {(droppableProvided, droppableSnapshot) => (
                <div
                  ref={droppableProvided.innerRef}
                  style={getListStyle(droppableSnapshot.isDraggingOver)}
                >
                  {this.state.items.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
                      {(draggableProvided, draggableSnapshot) => (
                        <some-custom-element
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...draggableProvided.dragHandleProps}
                          style={getItemStyle(
                            draggableSnapshot.isDragging,
                            draggableProvided.draggableProps.style,
                            false,
                          )}
                          content={item.content}
                        />
                      )}
                    </Draggable>
                  ))}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </ShadowRootContext.Consumer>
    );
  }
}
