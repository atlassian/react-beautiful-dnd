// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import QuoteList from './quote-list';
import { colors, grid } from '../constants';
import type { Quote } from '../types';
import type { DropResult, DragStart, DraggableLocation } from '../../../src/types';

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

const Column = styled.div`
  margin: 0 ${grid * 2}px;
`;

const PushDown = styled.div`
  height: 200px;
`;

const isDraggingClassName = 'is-dragging';

type GroupedQuotes = {
  alpha: Quote[],
  beta: Quote[],
  gamma: Quote[],
  delta: Quote[],
}

type Props = {|
  initial: GroupedQuotes,
|}

type State = {|
  disabledDroppable: ?string,
  quotes: GroupedQuotes,
|}

const resolveDrop = (quotes: GroupedQuotes,
  source: DraggableLocation,
  destination: DraggableLocation
): GroupedQuotes => {
  const newQuotes: GroupedQuotes = { ...quotes };

  const movedQuote = quotes[source.droppableId][source.index];

  Object.entries(newQuotes).forEach(([listId, listQuotes]: [string, Quote[]]) => {
    let newListQuotes = [...listQuotes];

    if (listId === source.droppableId) {
      newListQuotes = [
        ...newListQuotes.slice(0, source.index),
        ...newListQuotes.slice(source.index + 1),
      ];
    }

    if (listId === destination.droppableId) {
      newListQuotes = [
        ...newListQuotes.slice(0, destination.index),
        movedQuote,
        ...newListQuotes.slice(destination.index),
      ];
    }

    newQuotes[listId] = newListQuotes;
  });

  return newQuotes;
};

export default class QuoteApp extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    disabledDroppable: null,
    quotes: this.props.initial,
  };
  /* eslint-enable react/sort-comp */

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
    this.setState({
      disabledDroppable: this.getDisabledDroppable(initial.source.droppableId),
    });
    // $ExpectError - body could be null?
    document.body.classList.add(isDraggingClassName);
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);
    // $ExpectError - body could be null?
    document.body.classList.remove(isDraggingClassName);

    const quotes = result.destination ? (
      resolveDrop(this.state.quotes, result.source, result.destination)
    ) : (
      this.state.quotes
    );

    this.setState({
      disabledDroppable: null,
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

  getDisabledDroppable = (sourceDroppable: ?string) => {
    if (!sourceDroppable) {
      return null;
    }
    return null;

    const droppables: string[] = ['alpha', 'beta', 'gamma', 'delta'];
    const sourceIndex = droppables.indexOf(sourceDroppable);
    // const disabledDroppableIndex = (sourceIndex + 1) % droppables.length;
    const disabledDroppableIndex = sourceIndex;

    return droppables[disabledDroppableIndex];
  }

  render() {
    const { quotes, disabledDroppable } = this.state;

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <Column>
            <QuoteList
              listId="alpha"
              internalScroll
              listType="card"
              isDropDisabled={disabledDroppable === 'alpha'}
              quotes={quotes.alpha}
            />
          </Column>
          <Column>
            <PushDown />
            <QuoteList
              listId="beta"
              listType="card"
              isDropDisabled={disabledDroppable === 'beta'}
              quotes={quotes.beta}
            />
            <QuoteList
              listId="gamma"
              listType="card"
              internalScroll
              isDropDisabled={disabledDroppable === 'gamma'}
              quotes={quotes.gamma}
            />
          </Column>
          <Column>
            <QuoteList
              listId="delta"
              listType="card"
              internalScroll
              isDropDisabled={disabledDroppable === 'delta'}
              quotes={quotes.delta}
            />
          </Column>
        </Root>
      </DragDropContext>
    );
  }
}
