// @flow
import React from 'react';
import styled from 'styled-components';
import { colors } from '@atlaskit/theme';
import { Draggable } from '../../../../../src';
import { grid } from '../../../layouts/constants';
import type { DraggableProvided, DraggableStateSnapshot } from '../../../../../src';
import type { Quote as QuoteType } from '../../types';

type Props = {|
  quote: QuoteType,
  index: number,
|}

const Container = styled.div`
  background-color: ${props => (
    props.isDragging ? props.author.colors.whileDraggingBackground : colors.N0
  )};
  box-shadow: ${props => (
    props.isDragging ? `1px 1px 1px ${colors.N50}` : 'none'
  )};
  border-width: 1px;
  border-style: solid;
  border-color: ${props => (
    props.isDragging ? props.author.colors.border : 'transparent'
  )};
  margin-bottom: ${grid}px;
  padding: ${grid}px;
  border-radius: 2px;
  font-weight: normal;
  display: flex;

  &:focus {
    outline: 2px solid ${props => props.author.colors.border};
    box-shadow: none;
  }
`;

const Avatar = styled.img`
  border-radius: 50%;
  width: 40px;
  height: 40px;
  xborder: 1px solid ${props => props.author.colors.border};
  margin-right: ${grid}px;
  flex-shrink: 0;
  flex-grow: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const BlockQuote = styled.div`
  &::before {
    content: open-quote;
  }

  &::after {
    content: close-quote;
  }
`;

const Attribution = styled.small`
  margin: 0;
  xmargin-left: ${grid}px;
  margin-top: ${grid}px;
  text-align: right;
  flex-grow: 1;
  background-color: ${props => props.author.colors.whileDraggingBackground};
  border-radius: 2px;
  padding: ${grid / 2}px ${grid}px;
`;

export default class Item extends React.Component<Props> {
  render() {
    const quote: Quote = this.props.quote;
    const index: number = this.props.index;
    const author: Author = quote.author;
    return (
      <Draggable draggableId={quote.id} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
          <Container
            innerRef={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            author={author}
            isDragging={snapshot.isDragging}
          >
            <Avatar
              src={author.avatarUrl}
              title={author.name}
              author={author}
            />
            <Content>
              <BlockQuote>{quote.content}</BlockQuote>
              <Attribution author={author}>-{' '}{author.name}</Attribution>
            </Content>
          </Container>
        )}
      </Draggable>
    );
  }
}
