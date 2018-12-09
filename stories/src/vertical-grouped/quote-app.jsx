// @flow
import React, { Component } from 'react';
import styled from 'react-emotion';
import { DragDropContext } from '../../../src';
import QuoteList from '../primatives/quote-list';
import { colors, grid } from '../constants';
import { reorderQuoteMap } from '../reorder';
import type { QuoteMap } from '../types';
import type { DropResult } from '../../../src/types';

const Root = styled('div')`
  background: ${colors.blue.deep};
  display: flex;
`;

const Column = styled('div')`
  background-color: ${colors.blue.light};

  /* make the column a scroll container */
  height: 100vh;
  overflow: auto;

  /* flexbox */
  display: flex;
  flex-direction: column;
`;

const Group = styled('div')`
  margin-top: ${grid * 2}px;
`;

const Title = styled('h4')`
  margin: ${grid}px;
`;

type Props = {|
  initial: QuoteMap,
|};

type State = {|
  quoteMap: QuoteMap,
|};

export default class QuoteApp extends Component<Props, State> {
  /* eslint-disable react/sort-comp */

  state: State = {
    quoteMap: this.props.initial,
  };

  onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const { quoteMap } = reorderQuoteMap({
      quoteMap: this.state.quoteMap,
      source: result.source,
      destination: result.destination,
    });

    this.setState({ quoteMap });
  };

  render() {
    const { quoteMap } = this.state;

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Root>
          <Column>
            {Object.keys(quoteMap).map((key: string) => (
              <Group key={key}>
                <Title>{key}</Title>
                <QuoteList quotes={quoteMap[key]} listId={key} listType={key} />
              </Group>
            ))}
          </Column>
        </Root>
      </DragDropContext>
    );
  }
}
