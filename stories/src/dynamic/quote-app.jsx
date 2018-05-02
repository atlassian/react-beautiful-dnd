// @flow
import React from 'react';
import styled from 'styled-components';
import QuoteList from '../primatives/quote-list';
import { DragDropContext } from '../../../src/';
import { quotes as initial } from '../data';
import reorder from '../reorder';
import type { Quote, Author } from '../types';
import type { DropResult } from '../../../src/types';
import { grid } from '../constants';

const ControlSection = styled.div`
  margin-left: ${grid * 4}px;
`;

class Controls extends React.Component<*> {
  render() {
    return (
      <ControlSection>
        <h2>Controls</h2>
        <ul>
          <li><kbd>b</kbd>: add Draggable to <strong>start</strong> of list</li>
          <li><kbd>a</kbd>: add Draggable to <strong>end</strong> of list</li>
          <li><kbd>s</kbd>: remove Draggable from <strong>start</strong> of list</li>
          <li><kbd>e</kbd>: remove Draggable from <strong>end</strong> of list</li>
        </ul>
      </ControlSection>
    );
  }
}

type State = {|
  quotes: Quote[],
|}

const Container = styled.div`
  display: flex;
`;

const createQuote = (() => {
  let count: number = 0;

  return (): Quote => {
    const id: string = `generated-${++count}`;
    const author: Author = initial[count % (initial.length - 1)].author;

    const quote: Quote = {
      id,
      content: 'Generated',
      author,
    };

    return quote;
  };
})();

export default class QuoteApp extends React.Component<*, State> {
  state: State = {
    quotes: initial,
  }

  onWindowKeyDown = (event: KeyboardEvent) => {
    // Event used as a part of drag and drop
    if (event.defaultPrevented) {
      return;
    }

    const quotes: Quote[] = this.state.quotes;

    console.log('event.key', event.key);

    // Add quote to start of list ('before')
    if (event.key === 'b') {
      this.setState({
        quotes: [createQuote(), ...quotes],
      });
      return;
    }

    // Add quote to end of list ('after')
    if (event.key === 'a') {
      this.setState({
        quotes: [...quotes, createQuote()],
      });
      return;
    }

    // Remove quote from end of list
    if (event.key === 'e') {
      if (!quotes.length) {
        return;
      }
      console.log('Remove quote from end of list');
      this.setState({
        quotes: quotes.slice(0, quotes.length - 1),
      });
      return;
    }

    // Remove quote from start of list
    if (event.key === 's') {
      if (!quotes.length) {
        return;
      }
      console.log('Remove quote from start of list');
      this.setState({
        quotes: quotes.slice(1, quotes.length),
      });
    }
  }

  onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

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

  componentDidMount() {
    window.addEventListener('keydown', this.onWindowKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onWindowKeyDown);
  }

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Container>
          <QuoteList
            listId="list"
            quotes={this.state.quotes}
          />
          <Controls />
        </Container>
      </DragDropContext>
    );
  }
}
