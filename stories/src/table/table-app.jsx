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

// const AuthorCell = styled.td`
//   xwidth: 20%;
// `;

// const QuoteCell = styled.td`
//   xwidth: 80%;
// `;

const Row = styled.tr`
  ${props => (props.isDragging ? 'display: table; table-layout: fixed; background: lightblue;' : '')}
`;

type TableCellProps = {|
  children: Node,
  quoteId: string,
  isDragOccurring: boolean,
|}

type TableCellState = {|
  width: ?number,
  height: ?number,
|}

type TableCellEntry = {|
  quoteId: string,
  state: TableCellState,
|}

type TableCellCache = {
  [quoteId: string]: TableCellState,
}

const cache: TableCellCache = {};

class TableCell extends React.Component<TableCellProps, TableCellState> {
  ref: ?HTMLElement
  state: TableCellState = {
    width: null,
    height: null,
  }

  componentWillMount() {
    // console.log('TableCell: WillMount', this.props.quoteId);
    // const state: ?TableCellState = cache[this.props.quoteId];
    // console.log('cache', cache);

    // if (!state) {
    //   return;
    // }

    // console.log('setting state from state', state);
    // this.state = state;
  }

  componentWillUnmount() {
    console.log('TableCell: WillUnmount', this.props.quoteId);
    // cache[this.props.quoteId] = this.state;
    // console.log('new cache', cache);
  }

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
      boxSizing: this.state.width == null ? null : 'border-box',
    };

    return (
      <td
        ref={this.setRef}
        style={style}
      >
        {this.props.children}
      </td>
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
    const row: Node = (
      <Row
        innerRef={provided.innerRef}
        isDragging={snapshot.isDragging}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <TableCell isDragOccurring={isDragOccurring} quoteId={quote.id}>
          {quote.author.name}
        </TableCell>
        <TableCell isDragOccurring={isDragOccurring} quoteId={quote.id}>
          {quote.content}
        </TableCell>
      </Row>
    );

    if (!snapshot.isDragging) {
      return row;
    }

    return (
      <table>
        <tbody>
          {row}
        </tbody>
      </table>
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
            <thead>
              <tr>
                <th>Author</th>
                <th>Content</th>
              </tr>
            </thead>
            <Droppable droppableId="table">
              {(droppableProvided: DroppableProvided) => (
                <tbody
                  ref={droppableProvided.innerRef}
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
                </tbody>
                )}
            </Droppable>
          </Table>
        </React.Fragment>
      </DragDropContext>
    );
  }
}
