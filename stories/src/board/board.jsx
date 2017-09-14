// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import Column from '../primatives/column';
import { colors } from '../constants';
import reorder from '../reorder';
import { DragDropContext, Droppable } from '../../../src/';
import type {
  DropResult,
  DragStart,
  DraggableLocation,
  DroppableProvided,
} from '../../../src/';
import type { Quote, QuoteMap } from '../types';

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
  initial: QuoteMap,
|}

type State = {|
  columns: QuoteMap,
  ordered: string[],
  lastMovedQuoteId: ?string,
|}

export default class Board extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    columns: this.props.initial,
    ordered: Object.keys(this.props.initial),
    lastMovedQuoteId: null,
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

    this.setState({
      lastMovedQuoteId: null,
    });
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
    if (result.type === 'COLUMN') {
      const ordered: string[] = reorder(
        this.state.ordered,
        source.index,
        destination.index
      );

      this.setState({
        ordered,
      });

      return;
    }

    const current: Quote[] = [...this.state.columns[source.droppableId]];

    // reordering within the same column
    if (source.droppableId === destination.droppableId) {
      const reordered: Quote[] = reorder(
        current,
        source.index,
        destination.index,
      );
      const columns: QuoteMap = {
        ...this.state.columns,
        [source.droppableId]: reordered,
      };
      this.setState({
        columns,
      });
      return;
    }

    const target: Quote = current[source.index];
    const next: Quote[] = [...this.state.columns[destination.droppableId]];

    // remove from original
    current.splice(source.index, 1);
    // insert into next
    next.splice(destination.index, 0, target);

    const columns: QuoteMap = {
      ...this.state.columns,
      [source.droppableId]: current,
      [destination.droppableId]: next,
    };

    this.setState({
      columns,
      lastMovedQuoteId: source.droppableId,
    });
  }

  render() {
    const columns: QuoteMap = this.state.columns;
    const ordered: string[] = this.state.ordered;

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Droppable
          droppableId="board"
          type="COLUMN"
          direction="horizontal"
        >
          {(provided: DroppableProvided) => (
            <Container innerRef={provided.innerRef}>
              {ordered.map((key: string) => (
                <Column
                  key={key}
                  title={key}
                  quotes={columns[key]}
                  autoFocusQuoteId={this.state.lastMovedQuoteId}
                />
              ))}
            </Container>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}
