// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import QuoteList from '../primatives/quote-list';
import { colors, grid } from '../constants';
import { reorderQuoteMap } from '../reorder';
import type { QuoteMap } from '../types';
import type { DropResult, DragStart } from '../../../src/types';

const publishOnDragStart = action('onDragStart');
const publishOnDragEnd = action('onDragEnd');

const Root = styled.div`
  background: ${colors.blue.deep};
  display: flex;
`;

const Column = styled.div`
  background-color: ${colors.blue.light};

  /* make the column a scroll container */
  height: 100vh;
  overflow: auto;

  /* flexbox */
  display: flex;
  flex-direction: column;
`;

const Group = styled.div`
  margin-top: ${grid * 2}px;
`;

const Title = styled.h4`
  margin: ${grid}px;
`;

const isDraggingClassName = 'is-dragging';

type Props = {|
  initial: QuoteMap,
|}

type State = {|
  quoteMap: QuoteMap,
|}

export default class QuoteApp extends Component<Props, State> {
  /* eslint-disable react/sort-comp */

  state: State = {
    quoteMap: this.props.initial,
  };

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
    // $ExpectError - body could be null?
    document.body.classList.add(isDraggingClassName);
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);
    // $ExpectError - body could be null?
    document.body.classList.remove(isDraggingClassName);

    if (!result.destination) {
      return;
    }

    const { quoteMap } = reorderQuoteMap({
      quoteMap: this.state.quoteMap,
      source: result.source,
      destination: result.destination,
    });

    this.setState({ quoteMap });
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

  render() {
    const { quoteMap } = this.state;

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <Column>
            {Object.keys(quoteMap).map((key: string) => (
              <Group key={key}>
                <Title>{key}</Title>
                <QuoteList
                  quotes={quoteMap[key]}
                  listId={key}
                  listType={key}
                />
              </Group>
            ))}
          </Column>
        </Root>
      </DragDropContext>
    );
  }
}
