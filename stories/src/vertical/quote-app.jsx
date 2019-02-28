// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import type { Quote } from '../types';
import type { DropResult } from '../../../src/types';
import { DragDropContext } from '../../../src';
import QuoteList from '../primatives/quote-list';
import { colors, grid } from '../constants';
import reorder from '../reorder';

const Root = styled.div`
  background-color: ${colors.blue.deep};
  box-sizing: border-box;
  padding: ${grid * 2}px;
  min-height: 100vh;

  /* flexbox */
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

type Props = {|
  initial: Quote[],
  isCombineEnabled?: boolean,
  isSortDisabled?: boolean,
  listStyle?: Object,
|};

type State = {|
  quotes: Quote[],
|};

export default class QuoteApp extends Component<Props, State> {
  /* eslint-disable react/sort-comp */
  static defaultProps = {
    isCombineEnabled: false,
    isSortDisabled: false,
  };

  state: State = {
    quotes: this.props.initial,
  };

  onDragStart = () => {
    // Add a little vibration if the browser supports it.
    // Add's a nice little physical feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  };

  onDragEnd = (result: DropResult) => {
    // combining item
    if (result.combine) {
      // super simple: just removing the dragging item
      const quotes: Quote[] = [...this.state.quotes];
      quotes.splice(result.source.index, 1);
      this.setState({ quotes });
      return;
    }

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
            isCombineEnabled={this.props.isCombineEnabled}
            isSortDisabled={this.props.isSortDisabled}
          />
        </Root>
      </DragDropContext>
    );
  }
}
