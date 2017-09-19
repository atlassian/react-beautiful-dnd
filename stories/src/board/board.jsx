// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import Column from './column';
import { colors } from '../constants';
import reorder, { reorderQuoteMap } from '../reorder';
import { DragDropContext, Droppable } from '../../../src/';
import type {
  DropResult,
  DragStart,
  DraggableLocation,
  DroppableProvided,
} from '../../../src/';
import type { QuoteMap } from '../types';

const isDraggingClassName = 'is-dragging';

const publishOnDragStart = action('onDragStart');
const publishOnDragEnd = action('onDragEnd');

const Content = styled.div`
  max-width: 500px;
  overflow: auto;
`;

const Container = styled.div`
  background: ${colors.blue.deep};
  min-height: 100vh;

  /* like display:flex but will allow bleeding over the window width */
  min-width: 100vw;
  display: inline-flex;
`;

type Props = {|
  initial: QuoteMap,
|}

type State = {|
  columns: QuoteMap,
  ordered: string[],
  autoFocusQuoteId: ?string,
|}

export default class Board extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    columns: this.props.initial,
    ordered: Object.keys(this.props.initial),
    autoFocusQuoteId: null,
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
      autoFocusQuoteId: null,
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

    const data = reorderQuoteMap({
      quoteMap: this.state.columns,
      source,
      destination,
    });

    this.setState({
      columns: data.quoteMap,
      autoFocusQuoteId: data.autoFocusQuoteId,
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
        <Content>
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
                    autoFocusQuoteId={this.state.autoFocusQuoteId}
                  />
                ))}
              </Container>
            )}
          </Droppable>
        </Content>
      </DragDropContext>
    );
  }
}
