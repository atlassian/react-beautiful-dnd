// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import QuoteList from '../primatives/quote-list';
import { colors, grid } from '../constants';
import reorder from '../reorder';
import type { Quote } from '../types';
import type { DropResult, DragStart } from '../../../src/types';

const publishOnDragStart = action('onDragStart');
const publishOnDragEnd = action('onDragEnd');

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
  listStyle?: Object,
|}

type State = {|
  quotes: Quote[],
|}

export default class QuoteApp extends Component<Props, State> {
  /* eslint-disable react/sort-comp */

  state: State = {
    quotes: this.props.initial,
  };

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
    // Add a little vibration if the browser supports it.
    // Add's a nice little physical feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);

    // dropped outside the list
    if (!result.destination) {
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
