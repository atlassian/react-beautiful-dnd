// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import { colors, grid } from '../constants';
import QuoteList from './quote-list';
import reorder from '../reorder';
import { getQuotes } from '../data';
import type { Quote } from '../types';
import type { NestedQuoteList } from './types';
import type { DropResult, DragStart } from '../../../src/types';

const quotes: Quote[] = getQuotes(10);

const initialList: NestedQuoteList = {
  id: 'first-level',
  title: 'top level',
  children: [
    ...quotes.slice(0, 2),
    {
      id: 'second-level',
      title: 'second level',
      children: quotes.slice(3, 5),
    },
    ...quotes.slice(6, 9),
  ],
};

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

type State = {|
  list: NestedQuoteList,
|}

export default class QuoteApp extends Component<*, State> {
  /* eslint-disable react/sort-comp */
  state: State = {
    list: initialList,
  };
  /* eslint-enable */

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);

    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const destId: String = result.destination.droppableId;
    const srcId: String = result.source.droppableId;
    const list: NestedQuoteList = this.state.list;
    const nestedList: NestedQuoteList = list.children.find(item => item.children);
    let destList: NestedQuoteList = destId === 'first-level' ? list : nestedList;
    let srcList: NestedQuoteList = srcId === 'first-level' ? list : nestedList;

    const setList = (newList) => {
      if (newList.id === 'first-level') {
        debugger
        this.setState({ list: newList });
      } else {
        this.setState((prevState) => {
          debugger
          const prevList: NestedQuoteList = prevState.list;
          const prevNestedList: NestedQuoteList = prevList.children.find(item => item.children);
          const children = prevList.children.slice();
          const index = children.indexOf(prevNestedList);
          children[index] = newList;
          return { list: { ...prevList, children } };
        });
      }
    };

    if (destId === srcId) {
      const children = reorder(
        destList.children,
        result.source.index,
        result.destination.index,
      );

      // $ExpectError - using spread
      destList = { ...destList, children };
      setList(destList);
    } else {
      debugger
      const srcChildren = srcList.children.slice();
      const [child] = srcChildren.splice(result.source.index, 1);
      srcList = { ...srcList, children: srcChildren };

      const destChildren = destList.children.slice();
      destChildren.splice(result.destination.index, 0, child);
      destList = { ...destList, children: destChildren };

      if (destId !== 'first-level') {
        setList(srcList);
        setList(destList);
      } else {
        setList(destList);
        setList(srcList);
      }
    }
  }

  render() {
    const { list } = this.state;

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <QuoteList list={list} />
        </Root>
      </DragDropContext>
    );
  }
}
