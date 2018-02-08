// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import QuoteList from '../primatives/quote-list';
import { colors, grid } from '../constants';
import reorder from '../reorder';
import type { Quote } from '../types';
import type { DropResult, DragStart, DragUpdate, Announce } from '../../../src/types';

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

  onDragStart = (initial: DragStart, announce: Announce) => {
    announce(`
      Item lifted. ${initial.source.index + 1} of ${this.state.quotes.length} in the list.
      Use the arrow keys to move, space bar to drop, and escape to cancel.
    `);
    publishOnDragStart(initial);
    // Add a little vibration if the browser supports it.
    // Add's a nice little physical feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  }

  onDragUpdate = (update: DragUpdate, announce: Announce) => {
    if (!update.destination) {
      announce('You are currently not dragging over any droppable area');
      return;
    }
    announce(`Now ${update.destination.index + 1} of ${this.state.quotes.length} in the list`);
  }

  onDragEnd = (result: DropResult, announce: Announce) => {
    if (result.reason === 'CANCEL') {
      announce('drop cancelled');
      return;
    }

    if (!result.destination) {
      announce(`
        Item has been dropped while not over a location.
        It has been returned to its original position of ${result.source.index + 1} of ${this.state.quotes.length}
      `);
      return;
    }

    announce(`Item dropped. It has moved from position ${result.source.index + 1} to ${result.destination.index + 1}`);

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
        onDragUpdate={this.onDragUpdate}
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
