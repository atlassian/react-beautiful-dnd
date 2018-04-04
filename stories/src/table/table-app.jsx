// @flow
/* eslint-disable react/no-multi-comp, react/sort-comp */
import React, { Component } from 'react';
import type { Node } from 'react';
import styled from 'styled-components';
import { DragDropContext, Droppable, Draggable } from '../../../src';
import reorder from '../reorder';
import type { Quote } from '../types';
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from '../../../src';

// const Row = styled.tr`
//   xvertical-align: middle;
// `;

const Table = styled.table`
  width: 500px;
  margin: 0 auto;
  table-layout: ${props => props.layout};
`;

const TBody = styled.tbody`
  border: 0;
`;

const THead = styled.thead`
  border: 0;
`;

// const AuthorCell = styled.td`
//   xwidth: 20%;
// `;

// const QuoteCell = styled.td`
//   xwidth: 80%;
// `;

const Row = styled.tr`
  ${props => (props.isDragging ? 'display: table; table-layout: fixed; background: lightblue;' : '')}
`;

const Cell = styled.td`
  box-sizing: border-box;
`;

type TableCellProps = {|
  children: Node,
  isDragOccurring: boolean,
|}

type TableCellState = {|
  width: ?number,
  height: ?number,
|}
class TableCell extends React.Component<TableCellProps, TableCellState> {
  ref: ?HTMLElement
  state: TableCellState = {
    width: null,
    height: null,
  }

  // TODO: use different lifecycle method
  componentWillReceiveProps(nextProps: TableCellProps) {
    const isDragStarting: boolean = nextProps.isDragOccurring && !this.props.isDragOccurring;
    const isDragEnding: boolean = !nextProps.isDragOccurring && this.props.isDragOccurring;

    if (isDragStarting) {
      if (!this.ref) {
        throw new Error('Cannot set width and height without a ref');
      }
      const { width, height } = this.ref.getBoundingClientRect();

      this.setState({
        width,
        height,
      });
      return;
    }

    if (isDragEnding) {
      this.setState({
        width: null,
        height: null,
      });
    }
  }

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  }

  render() {
    const style = {
      width: this.state.width,
      height: this.state.height,
    };

    return (
      <Cell
        innerRef={this.setRef}
        style={style}
      >
        {this.props.children}
      </Cell>
    );
  }
}

type TableRowProps = {|
  quote: Quote,
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  isDragOccurring: boolean,
|}

class TableRow extends Component<TableRowProps> {
  render() {
    const { snapshot, quote, provided, isDragOccurring } = this.props;
    return (
      <Row
        innerRef={provided.innerRef}
        isDragging={snapshot.isDragging}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <TableCell isDragOccurring={isDragOccurring}>
          {quote.author.name}
        </TableCell>
        <TableCell isDragOccurring={isDragOccurring}>
          {quote.content}
        </TableCell>
      </Row>
    );
  }
}

type AppProps = {|
  initial: Quote[],
|}

type AppState = {|
  quotes: Quote[],
  layout: 'fixed' | 'auto',
  isDragging: boolean,
|}

export default class TableApp extends Component<AppProps, AppState> {
  state: AppState = {
    quotes: this.props.initial,
    layout: 'auto',
    isDragging: false,
  };

  onDragStart = () => {
    this.setState({
      isDragging: true,
    });
  }

  onDragEnd = (result: DropResult) => {
    this.setState({
      isDragging: false,
    });

    // dropped outside the list
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    // no movement
    if (result.destination.index === result.source.index) {
      return;
    }

    const quotes = reorder(
      this.state.quotes,
      result.source.index,
      result.destination.index
    );

    this.setState({
      quotes,
    });
  }

  toggleTableLayout = () => {
    this.setState({
      layout: this.state.layout === 'auto' ? 'fixed' : 'auto',
    });
  }

  render() {
    return (
      <DragDropContext onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
        <React.Fragment>
          <button onClick={this.toggleTableLayout}>
            Toggle table layout
          </button>
          <code>table-layout: {this.state.layout}</code>
          <Table layout={this.state.layout}>
            <THead>
              <tr>
                <th>Author</th>
                <th>Content</th>
              </tr>
            </THead>
            <Droppable droppableId="table">
              {(droppableProvided: DroppableProvided) => (
                <TBody
                  innerRef={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                >
                  {this.state.quotes.map((quote: Quote, index: number) => (
                    <Draggable draggableId={quote.id} index={index} key={quote.id}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <TableRow
                          provided={provided}
                          snapshot={snapshot}
                          quote={quote}
                          isDragOccurring={this.state.isDragging}
                        />
                    )}
                    </Draggable>
                  ))}
                </TBody>
                )}
            </Droppable>
          </Table>
        </React.Fragment>
      </DragDropContext>
    );
  }
}
