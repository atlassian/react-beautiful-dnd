// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import Column from './column';
import { DragDropContext, Droppable } from '../../../src/';
import { colors } from '../constants';
import reorder from '../reorder';
import type { AuthorWithQuotes } from '../types';
import type { Provided } from '../../../src/view/droppable/droppable-types';
import type { DropResult, DragStart, DraggableLocation } from '../../../src/types';

const isDraggingClassName = 'is-dragging';

const publishOnDragStart = action('onDragStart');
const publishOnDragEnd = action('onDragEnd');

const Container = styled.div`
  background: ${colors.blue.deep};
  display: flex;
  min-height: 100vh;

  /* add a scroll bar if the list is too wide */
  overflow-x: auto;
`;

type Props = {|
  initial: AuthorWithQuotes[],
|}

type State = {|
  columns: AuthorWithQuotes[],
|}

export default class Board extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    columns: this.props.initial,
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

    // dropped nowhere
    if (!result.destination) {
      return;
    }

    const source: DraggableLocation = result.source;
    const destination: DraggableLocation = result.destination;

    // reordering column
    if (result.type === 'AUTHOR') {
      const columns: AuthorWithQuotes[] = reorder(
        this.state.columns,
        source.index,
        destination.index
      );

      this.setState({
        columns,
      });

      return;
    }

    // reordering a quote
    const column: ?AuthorWithQuotes = this.state.columns.filter(
      (item: AuthorWithQuotes) => item.author.id === result.type
    )[0];

    if (!column) {
      console.error('could not find column', result.type, this.state.columns);
      return;
    }

    const quotes = reorder(
      column.quotes,
      source.index,
      destination.index
    );

    const updated: AuthorWithQuotes = {
      author: column.author,
      quotes,
    };

    const columns = Array.from(this.state.columns);
    columns[this.state.columns.indexOf(column)] = updated;

    this.setState({
      columns,
    });
  }

  render() {
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Droppable
          droppableId="board"
          type="AUTHOR"
          direction="horizontal"
        >
          {(provided: Provided) => (
            <Container innerRef={provided.innerRef}>
              {this.state.columns.map((column: AuthorWithQuotes) => (
                <Column key={column.author.id} column={column} />
              ))}
            </Container>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}
