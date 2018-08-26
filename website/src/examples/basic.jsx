// // @flow
import React, { Component } from 'react';
import styled from 'react-emotion';
import { DragDropContext } from '../../../src';
import QuoteList from '../components/examples/primatives/quote-list';
import { grid, colors } from '../constants';
import reorder from '../components/examples/reorder';
import type { Quote } from '../components/examples/types';
import { quotes as initialQuotes } from '../components/examples/data';
import type { DropResult, DragStart } from '../../../src/types';

/* eslint-disable no-console */
const publishOnDragStart = (v?: any) => console.log('onDragStart', v);
const publishOnDragEnd = (v?: any) => console.log('onDragEnd', v);
/* eslint-enable no-console */

const Root = styled('div')`
  background-color: ${colors.dark300};
  box-sizing: border-box;
  padding: ${grid * 2}px;
  min-height: 100vh;

  /* flexbox */
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

type Props = {|
  listStyle?: Object,
  location: {
    pathname: string,
  },
|};

type State = {|
  quotes: Quote[],
|};

export default class QuoteApp extends Component<Props, State> {
  /* eslint-disable react/sort-comp */

  state: State = {
    quotes: initialQuotes,
  };

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
    // Add a little vibration if the browser supports it.
    // Add's a nice little physical feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  };

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);

    // dropped outside the list
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const quotes = reorder(
      this.state.quotes,
      result.source.index,
      result.destination.index,
    );

    this.setState({
      quotes,
    });
  };

  render() {
    const { quotes } = this.state;

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <QuoteList
            listId="list"
            style={this.props.listStyle}
            quotes={quotes}
          />
        </Root>
      </DragDropContext>
    );
  }
}
