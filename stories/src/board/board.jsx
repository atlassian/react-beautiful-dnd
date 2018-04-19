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

const publishOnDragStart = action('onDragStart');
const publishOnDragEnd = action('onDragEnd');

const ParentContainer = styled.div`
  height: ${({ height }) => height};
  overflow-x: hidden;
  overflow-y: auto;
`;

const Container = styled.div`
  min-height: 100vh;

  /* like display:flex but will allow bleeding over the window width */
  min-width: 100vw;
  display: inline-flex;
`;

type Props = {|
  initial: QuoteMap,
  containerHeight?: string,
|}

type State = {|
  columns: QuoteMap,
  ordered: string[],
|}

export default class Board extends Component<Props, State> {
  /* eslint-disable react/sort-comp */

  state: State = {
    columns: this.props.initial,
    ordered: Object.keys(this.props.initial),
  }

  boardRef: ?HTMLElement

  componentDidMount() {
    // eslint-disable-next-line no-unused-expressions
    injectGlobal`
      body {
        background: ${colors.blue.deep};
      }
    `;
  }

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);

    // dropped nowhere
    if (!result.destination) {
      return;
    }

    const source: DraggableLocation = result.source;
    const destination: DraggableLocation = result.destination;

    // did not move anywhere - can bail early
    if (source.droppableId === destination.droppableId &&
      source.index === destination.index) {
      return;
    }

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
    });
  }

  render() {
    const columns: QuoteMap = this.state.columns;
    const ordered: string[] = this.state.ordered;
    const { containerHeight } = this.props;

    const board = (
      <Droppable
        droppableId="board"
        type="COLUMN"
        direction="horizontal"
        ignoreContainerClipping={Boolean(containerHeight)}
      >
        {(provided: DroppableProvided) => (
          <Container innerRef={provided.innerRef} {...provided.droppableProps}>
            {ordered.map((key: string, index: number) => (
              <Column
                key={key}
                index={index}
                title={key}
                quotes={columns[key]}
              />
            ))}
          </Container>
        )}
      </Droppable>
    );

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        {this.props.containerHeight ? (
          <ParentContainer height={containerHeight}>{board}</ParentContainer>
        ) : (
          board
        )}
      </DragDropContext>
    );
  }
}
