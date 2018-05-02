// @flow
import React from 'react';
import styled from 'styled-components';
import QuoteList from '../primatives/quote-list';
import { DragDropContext } from '../../../src/';
import { generateQuoteMap, authors } from '../data';
import reorder from '../reorder';
import type { Quote, QuoteMap, Author } from '../types';
import type { DropResult } from '../../../src/types';
import { grid } from '../constants';

const intial: QuoteMap = generateQuoteMap(20);

const ControlSection = styled.div`
  margin: ${grid * 4}px;
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
  quoteMap: QuoteMap,
|}

const Container = styled.div`
  display: flex;
  align-items: flex-start;
`;

const createQuote = (() => {
  let count: number = 0;

  return (): Quote => {
    const id: string = `generated-${++count}`;
    const author: Author = authors[count % authors.length];

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
    quoteMap: intial,
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onWindowKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onWindowKeyDown);
  }

  onWindowKeyDown = (event: KeyboardEvent) => {
    // Event used as a part of drag and drop
    if (event.defaultPrevented) {
      return;
    }

    const quoteMap: QuoteMap = this.state.quoteMap;

    console.log('event.key', event.key);

    // Add quote to start of list ('before')
    if (event.key === 'b') {
      const map: QuoteMap = Object.keys(quoteMap)
        .reduce((previous: QuoteMap, key: string): QuoteMap => {
          const quotes: Quote[] = quoteMap[key];
          console.log('quotes', quotes);
          previous[key] = [createQuote(), ...quotes];
          return previous;
        }, {});

      console.log('map', map);

      this.setState({
        quoteMap: map,
      });
      return;
    }

    // Add quote to end of list ('after')
    if (event.key === 'a') {
      const map: QuoteMap = Object.keys(quoteMap)
        .reduce((previous: QuoteMap, key: string): QuoteMap => {
          const quotes: Quote[] = quoteMap[key];
          previous[key] = [...quotes, createQuote()];
          return previous;
        }, {});

      this.setState({
        quoteMap: map,
      });
      return;
    }

    // Remove quote from end of list
    if (event.key === 'e') {
      const map: QuoteMap = Object.keys(quoteMap)
        .reduce((previous: QuoteMap, key: string): QuoteMap => {
          const quotes: Quote[] = quoteMap[key];
          previous[key] = quotes.length ? quotes.slice(0, quotes.length - 1) : [];
          return previous;
        }, {});

      this.setState({
        quoteMap: map,
      });
      return;
    }

    // Remove quote from start of list
    if (event.key === 's') {
      const map: QuoteMap = Object.keys(quoteMap)
        .reduce((previous: QuoteMap, key: string): QuoteMap => {
          const quotes: Quote[] = quoteMap[key];
          previous[key] = quotes.length ? quotes.slice(1, quotes.length) : [];
          return previous;
        }, {});

      this.setState({
        quoteMap: map,
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

  render() {
    const { quoteMap } = this.state;
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Controls />
        <Container>
          {Object.keys(quoteMap).map((key: string) => (
            <QuoteList
              listId={key}
              quotes={quoteMap[key]}
            />
          ))}
        </Container>
      </DragDropContext>
    );
  }
}
