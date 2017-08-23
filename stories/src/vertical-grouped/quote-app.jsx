// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import QuoteList from '../vertical/quote-list';
import { colors, grid } from '../constants';
import { reorderGroup } from '../reorder';
import type { AuthorWithQuotes } from '../types';
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
  initial: AuthorWithQuotes[],
|}

type State = {|
  groups: AuthorWithQuotes[],
|}

export default class QuoteApp extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    groups: this.props.initial,
  };
  /* eslint-enable react/sort-comp */

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
    // $ExpectError - body could be null?
    document.body.classList.add(isDraggingClassName);
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);
    // $ExpectError - body could be null?
    document.body.classList.remove(isDraggingClassName);

    const groups: ?AuthorWithQuotes[] = reorderGroup(
      this.state.groups, result
    );

    if (!groups) {
      return;
    }

    this.setState({
      groups,
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

  render() {
    const { groups } = this.state;

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <Column>
            {groups.map((group: AuthorWithQuotes) => (
              <Group>
                <Title>{group.author.name}</Title>
                <QuoteList
                  quotes={group.quotes}
                  listId={group.author.id}
                  listType={group.author.id}
                />
              </Group>
            ))}
          </Column>
        </Root>
      </DragDropContext>
    );
  }
}
