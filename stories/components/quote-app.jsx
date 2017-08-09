// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { DragDropContext } from '../../src/';
import QuoteItem from './quote-item';
import QuoteList from './quote-list';
import { colors, grid } from './constants';
import type { Quote } from './types';
import type { DropResult, DraggableLocation } from '../../src/types';

const Root = styled.div`
  background-color: ${colors.blue};
  box-sizing: border-box;
  padding: ${grid * 2}px;
  min-height: 100vh;

  /* flexbox */
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const isDraggingClassName = 'is-dragging';

type Props = {|
  initial: Quote[],
  listStyle?: Object,
|}

type State = {|
  quotes: Quote[],
  isQuoteDragging: boolean
|}

export default class QuoteApp extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    quotes: this.props.initial,
    isQuoteDragging: false,
  };
  /* eslint-enable */

  onDragStart = () => {
    // $ExpectError - body could be null?
    document.body.classList.add(isDraggingClassName);
  }

  onDragEnd = (result: DropResult) => {
    // remove drag styles
    // $ExpectError - body could be null?
    document.body.classList.remove(isDraggingClassName);

    const source: DraggableLocation = result.source;
    const destination: ?DraggableLocation = result.destination;

    // nothing to do here!
    if (destination == null) {
      return;
    }

    if (source.droppableId !== destination.droppableId) {
      console.error('unsupported use case');
      return;
    }

    const quotes: Quote[] = [...this.state.quotes];
    const target: ?Quote = quotes.find(
      (quote: Quote): boolean => quote.id === result.draggableId
    );

    if (!target) {
      console.error('cannot find quote in list');
      return;
    }

    // remove target from the array
    quotes.splice(source.index, 1);

    // put into correct spot
    quotes.splice(destination.index, 0, target);

    this.setState({
      quotes,
    });
  }

  componentDidMount() {
    // eslint-disable-next-line no-unused-expressions
    injectGlobal`
      body.${isDraggingClassName} {
        cursor: grabbing;
        user-select: none;
      }
    `;
  }

  render() {
    const { quotes } = this.state;

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <QuoteList listId="list" style={this.props.listStyle}>
            {quotes.map((quote: Quote) => (
              <QuoteItem
                quote={quote}
                key={quote.id}
              />
          ))}
          </QuoteList>
        </Root>
      </DragDropContext>
    );
  }
}
