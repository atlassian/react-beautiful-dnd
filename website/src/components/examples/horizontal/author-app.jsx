// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { DragDropContext } from '../../../../../src';
import type { DropResult, DragStart } from '../../../../../src';
import type { Quote } from '../types';
import AuthorList from '../primatives/author-list';
import reorder from '../reorder';
import { colors, grid } from '../constants';

/* eslint-disable no-console */
const publishOnDragStart = (v?: any) => console.log('onDragStart', v);
const publishOnDragEnd = (v?: any) => console.log('onDragEnd', v);
/* eslint-enable no-console */

type Props = {|
  initial: Quote[],
  internalScroll?: boolean,
|};

type State = {|
  quotes: Quote[],
|};

const Root = styled.div`
  padding: ${grid}px;
  background: ${colors.blue.light};
`;

export default class AuthorApp extends Component<Props, State> {
  /* eslint-disable react/sort-comp */

  state: State = {
    quotes: this.props.initial,
  };
  /* eslint-enable react/sort-comp */

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
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
    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <AuthorList
            listId="AUTHOR"
            internalScroll={this.props.internalScroll}
            quotes={this.state.quotes}
          />
        </Root>
      </DragDropContext>
    );
  }
}
