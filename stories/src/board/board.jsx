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

const ParentContainer = styled.div`
  height: ${({ height }) => height};
  overflow-x: hidden;
  overflow-y: auto;
`;

const Container = styled.div`
  background: ${colors.blue.deep};
  height: ${({ height }) => height};

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
  autoFocusQuoteId: ?string,
  isLifting: boolean,
  boardHeight: string,
|}

export default class Board extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    columns: this.props.initial,
    ordered: Object.keys(this.props.initial),
    autoFocusQuoteId: null,
    isLifting: false,
    boardHeight: 'auto',
  }
  /* eslint-enable react/sort-comp */

  boardRef: ?HTMLElement

  componentDidMount() {
    // eslint-disable-next-line no-unused-expressions
    injectGlobal`
      body.${isDraggingClassName} {
        cursor: grabbing;
        user-select: none;
      }
    `;
  }

  onLiftStart = () => {
    if (!this.props.containerHeight) {
      return;
    }

    if (this.boardRef) {
      this.setState({
        boardHeight: `${this.boardRef.clientHeight}px`,
        isLifting: true,
      });
    }
  }

  onLiftEnd = () => {
    if (!this.props.containerHeight) {
      return;
    }

    this.setState({
      boardHeight: 'auto',
      isLifting: false,
    });
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

    const board = (
      <Droppable
        droppableId="board"
        type="COLUMN"
        direction="horizontal"
      >
        {(provided: DroppableProvided) => (
          <Container
            height={this.state.boardHeight}
            innerRef={(ref) => {
              this.boardRef = ref;
              provided.innerRef(ref);
            }}
          >
            {ordered.map((key: string) => (
              <Column
                key={key}
                title={key}
                quotes={columns[key]}
                autoFocusQuoteId={this.state.autoFocusQuoteId}
                listHeight={this.state.isLifting ? this.props.containerHeight : 'none'}
              />
            ))}
          </Container>
        )}
      </Droppable>
    );

    return (
      <DragDropContext
        onLiftStart={this.onLiftStart}
        onLiftEnd={this.onLiftEnd}
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        {this.props.containerHeight ? (
          <ParentContainer height={this.props.containerHeight}>{board}</ParentContainer>
        ) : (
          board
        )}
      </DragDropContext>
    );
  }
}
