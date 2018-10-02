// @flow
import React from 'react';
import styled from 'react-emotion';
import { borderRadius, colors, grid } from '../constants';
import type { Quote } from '../types';
import type { DraggableProvided } from '../../../src';

type Props = {
  quote: Quote,
  isDragging: boolean,
  provided: DraggableProvided,
  isGroupedOver?: boolean,
};

const getBackgroundColor = (isDragging: boolean, isGroupedOver: boolean) => {
  if (isDragging) {
    return colors.green;
  }
  if (isGroupedOver) {
    return colors.orange;
  }
  return colors.white;
};

const Container = styled('a')`
  border-radius: ${borderRadius}px;
  border: 1px solid grey;
  background-color: ${props =>
    getBackgroundColor(props.isDragging, props.isGroupedOver)};
  box-shadow: ${({ isDragging }) =>
    isDragging ? `2px 2px 1px ${colors.shadow}` : 'none'};
  padding: ${grid}px;
  min-height: 40px;
  margin-bottom: ${grid}px;
  margin-left: ${grid}px;
  margin-right: ${grid}px;
  user-select: none;

  /* anchor overrides */
  color: ${colors.black};

  &:hover {
    color: ${colors.black};
    text-decoration: none;
  }

  &:focus {
    outline: 2px solid ${colors.purple};
    box-shadow: none;
  }

  /* flexbox */
  display: flex;
  align-items: center;
`;

const Avatar = styled('img')`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: ${grid}px;
  flex-shrink: 0;
  flex-grow: 0;
`;

const Content = styled('div')`
  /* flex child */
  flex-grow: 1;

  /*
    Needed to wrap text in ie11
    https://stackoverflow.com/questions/35111090/why-ie11-doesnt-wrap-the-text-in-flexbox
  */
  flex-basis: 100%;

  /* flex parent */
  display: flex;
  flex-direction: column;
`;

const BlockQuote = styled('div')`
  &::before {
    content: open-quote;
  }

  &::after {
    content: close-quote;
  }
`;

const Footer = styled('div')`
  display: flex;
  margin-top: ${grid}px;
`;

const QuoteId = styled('small')`
  flex-grow: 0;
  margin: 0;
`;

const Attribution = styled('small')`
  margin: 0;
  margin-left: ${grid}px;
  text-align: right;
  flex-grow: 1;
`;

// Previously this extended React.Component
// That was a good thing, because using React.PureComponent can hide
// issues with the selectors. However, moving it over does can considerable
// performance improvements when reordering big lists (400ms => 200ms)
// Need to be super sure we are not relying on PureComponent here for
// things we should be doing in the selector as we do not know if consumers
// will be using PureComponent
export default class QuoteItem extends React.PureComponent<Props> {
  render() {
    const { quote, isDragging, isGroupedOver, provided } = this.props;

    return (
      <Container
        href={quote.author.url}
        isDragging={isDragging}
        isGroupedOver={isGroupedOver}
        innerRef={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <Avatar src={quote.author.avatarUrl} alt={quote.author.name} />
        <Content>
          <BlockQuote>{quote.content}</BlockQuote>
          <Footer>
            <QuoteId>({quote.id})</QuoteId>
            <Attribution>TEMP</Attribution>
          </Footer>
        </Content>
      </Container>
    );
  }
}
