// @flow
import React from 'react';
import QuoteList from '../primatives/quote-list';
import { DragDropContext } from '../../../src/';
import type { DropResult, DragUpdate, DragStart, DraggableLocation } from '../../../src/types';
import type { Quote } from '../types';
import { quotes as initial, getQuotes } from '../data';
import reorder from '../reorder';

type State = {|
  quotes: Quote[],
  isLoading: boolean,
|}

export default class LazyLoading extends React.Component<*, State> {
  state: State = {
    quotes: initial,
    isLoading: false,
  }

  onDragStart = (start: DragStart) => {

  }

  onDragUpdate = (update: DragUpdate) => {
    const destination: ?DraggableLocation = update.destination;
    if (!destination) {
      return;
    }

    const lastIndex: number = this.state.quotes.length - 1;
    const startLoadingFrom: number = lastIndex - 2;

    if (destination.index < startLoadingFrom) {
      console.log('not far enough along');
      console.log('destination', destination.index);
      console.log('startLoading from', startLoadingFrom);
      return;
    }

    this.startLazyLoading();
  }

  onDragEnd = (result: DropResult) => {
    // Stop any pending lazy loads
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.setState({
      isLoading: false,
    });

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
      result.destination.index
    );

    this.setState({
      quotes,
    });
  }

  startLazyLoading = () => {
    console.log('starting lazy load');
    if (this.state.isLoading) {
      return;
    }

    this.timerId = setTimeout(() => {
      this.timerId = null;

      const additions: Quote[] = getQuotes(4);
      const quotes: Quote[] = [...this.state.quotes, ...additions];
      this.setState({
        quotes,
        isLoading: false,
      });
    }, 500);

    this.setState({
      isLoading: true,
    });
  }

  render() {
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragUpdate={this.onDragUpdate}
        onDragEnd={this.onDragEnd}
      >
        <QuoteList quotes={this.state.quotes} />
      </DragDropContext>
    );
  }
}
