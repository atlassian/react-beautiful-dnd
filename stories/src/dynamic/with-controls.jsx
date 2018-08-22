// @flow
import React from 'react';
import styled from 'react-emotion';
import QuoteList from '../primatives/quote-list';
import { DragDropContext } from '../../../src';
import { generateQuoteMap, authors } from '../data';
import { reorderQuoteMap } from '../reorder';
import { grid } from '../constants';
import type { Quote, QuoteMap, Author } from '../types';
import type { DropResult, DragUpdate } from '../../../src/types';

const initial: QuoteMap = generateQuoteMap(0);

const ControlSection = styled.div`
  margin: ${grid * 4}px;
`;

class Controls extends React.Component<{|
  changeBy: number,
  onChange: (changeBy: number) => void,
|}> {
  render() {
    return (
      <ControlSection>
        <h2>Controls</h2>
        <ul>
          <li>
            <strong>
              <kbd>b</kbd>
            </strong>
            : add to <strong>start</strong> of list
          </li>
          <li>
            <strong>
              <kbd>a</kbd>
            </strong>
            : add to <strong>end</strong> of list
          </li>
          <li>
            <strong>
              <kbd>s</kbd>
            </strong>
            : remove from <strong>start</strong> of list
          </li>
          <li>
            <strong>
              <kbd>d</kbd>
            </strong>
            : remove from <strong>end</strong> of list
          </li>
        </ul>
        <br />
        Change by:{' '}
        <input
          type="number"
          min="1"
          max="10"
          value={this.props.changeBy}
          onChange={(event: SyntheticInputEvent<HTMLInputElement>) =>
            this.props.onChange(Number(event.target.value))
          }
        />
      </ControlSection>
    );
  }
}

type State = {|
  quoteMap: QuoteMap,
  changeBy: number,
|};

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

export default class WithControls extends React.Component<*, State> {
  state: State = {
    quoteMap: {
      // simple for now
      BMO: initial.BMO,
    },
    changeBy: 2,
  };

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

    // Add quote to start of list ('before')
    if (event.key === 'b') {
      console.log(`Adding ${this.state.changeBy} to start`);
      const map: QuoteMap = Object.keys(quoteMap).reduce(
        (previous: QuoteMap, key: string): QuoteMap => {
          const quotes: Quote[] = quoteMap[key];
          const additions: Quote[] = Array.from(
            { length: this.state.changeBy },
            () => createQuote(),
          );
          previous[key] = [...additions, ...quotes];
          return previous;
        },
        {},
      );

      this.setState({
        quoteMap: map,
      });
      return;
    }

    // Add quote to end of list ('after')
    if (event.key === 'a') {
      console.log(`Adding ${this.state.changeBy} to end`);
      const map: QuoteMap = Object.keys(quoteMap).reduce(
        (previous: QuoteMap, key: string): QuoteMap => {
          const quotes: Quote[] = quoteMap[key];
          const additions: Quote[] = Array.from(
            { length: this.state.changeBy },
            () => createQuote(),
          );
          previous[key] = [...quotes, ...additions];
          return previous;
        },
        {},
      );

      this.setState({
        quoteMap: map,
      });
      return;
    }

    // Remove quote from end of list
    if (event.key === 'd') {
      console.log(`Removing ${this.state.changeBy} from end`);
      const map: QuoteMap = Object.keys(quoteMap).reduce(
        (previous: QuoteMap, key: string): QuoteMap => {
          const quotes: Quote[] = quoteMap[key];
          previous[key] = quotes.length
            ? quotes.slice(0, quotes.length - this.state.changeBy)
            : [];
          return previous;
        },
        {},
      );

      this.setState({
        quoteMap: map,
      });
      return;
    }

    // Remove quote from start of list
    if (event.key === 's') {
      console.log(`Removing ${this.state.changeBy} from start`);
      const map: QuoteMap = Object.keys(quoteMap).reduce(
        (previous: QuoteMap, key: string): QuoteMap => {
          const quotes: Quote[] = quoteMap[key];
          previous[key] = quotes.length
            ? quotes.slice(this.state.changeBy, quotes.length)
            : [];
          return previous;
        },
        {},
      );

      this.setState({
        quoteMap: map,
      });
    }
  };

  onDragUpdate = (update: DragUpdate) => {
    console.log(
      'Update: current index =>',
      update.destination ? update.destination.index : null,
    );
  };

  onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    this.setState(
      reorderQuoteMap({
        quoteMap: this.state.quoteMap,
        source: result.source,
        destination: result.destination,
      }),
    );
  };

  render() {
    const { quoteMap } = this.state;
    return (
      <DragDropContext
        onDragEnd={this.onDragEnd}
        onDragUpdate={this.onDragUpdate}
      >
        <Controls
          changeBy={this.state.changeBy}
          onChange={(changeBy: number) => this.setState({ changeBy })}
        />
        <Container>
          {Object.keys(quoteMap).map((key: string) => (
            <QuoteList
              key={key}
              listId={key}
              quotes={quoteMap[key]}
              style={{ border: '3px solid blue', paddingBottom: grid }}
              scrollContainerStyle={{ height: 300, border: '3px solid green' }}
              internalScroll
            />
          ))}
        </Container>
      </DragDropContext>
    );
  }
}
