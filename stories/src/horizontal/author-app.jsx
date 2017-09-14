// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import type {
  DropResult,
  DragStart,
} from '../../../src';
import type { Quote } from '../types';
import AuthorList from '../primatives/author-list';
import reorder from '../reorder';
import { colors, grid } from '../constants';

const isDraggingClassName = 'is-dragging';
const publishOnDragStart = action('onDragStart');
const publishOnDragEnd = action('onDragEnd');

type Props = {|
  initial: Quote[],
  internalScroll?: boolean,
|}

type State = {|
  quotes: Quote[],
|}

const Root = styled.div`
  padding: ${grid}px;
  background: ${colors.blue.light};
`;

export default class AuthorApp extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    quotes: this.props.initial,
  }
  /* eslint-enable react/sort-comp */

  componentDidMount() {
    // eslint-disable-next-line no-unused-expressions
    injectGlobal`
      body.${isDraggingClassName} {
        cursor: grabbing;
        user-select: none;
      }
    `;
  }

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
    // $ExpectError - body wont be null
    document.body.classList.add(isDraggingClassName);
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);
    // $ExpectError - body wont be null
    document.body.classList.remove(isDraggingClassName);

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
