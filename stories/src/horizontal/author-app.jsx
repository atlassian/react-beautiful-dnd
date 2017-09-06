// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import type { DropResult, DragStart } from '../../../src';
import AuthorList from './author-list';
import AuthorItem from '../primatives/author-item';
import { Draggable } from '../../../src/';
import reorder from '../reorder';
import { colors, grid } from '../constants';
import type { Author } from '../types';
import type { Overflow } from './types';

const isDraggingClassName = 'is-dragging';
const publishOnDragStart = action('onDragStart');
const publishOnDragEnd = action('onDragEnd');

type Props = {|
  initial: Author[],
  overflow?: Overflow,
|}

type State = {|
  authors: Author[],
|}

const Root = styled.div`
  padding: ${grid}px;
  background: ${colors.blue.light};
`;

export default class AuthorApp extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    authors: this.props.initial,
  }
  /* eslint-enable react/sort-comp */

  componentDidMount() {
    // eslint-disable-next-line no-unused-expressions
    injectGlobal`
      body.${isDraggingClassName} {
        cursor: grabbing;
        user-select: none;
      }
    `;
  }

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
    // $ExpectError - body wont be null
    document.body.classList.add(isDraggingClassName);
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);
    // $ExpectError - body wont be null
    document.body.classList.remove(isDraggingClassName);

    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const authors = reorder(
      this.state.authors,
      result.source.index,
      result.destination.index
    );

    this.setState({
      authors,
    });
  }

  render() {
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <AuthorList listId="list" overflow={this.props.overflow}>
            {this.state.authors.map((author: Author) => (
              <Draggable
                key={author.id}
                draggableId={author.id}
                type="list"
              >
                {(provided, snapshot) => (
                  <div>
                    <AuthorItem
                      author={author}
                      provided={provided}
                      snapshot={snapshot}
                    />
                    {provided.placeholder}
                  </div>
                )}

              </Draggable>
            ))}
          </AuthorList>
        </Root>
      </DragDropContext>
    );
  }
}
