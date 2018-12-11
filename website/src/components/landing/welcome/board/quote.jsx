// @flow
import React from 'react';
import styled from 'styled-components';
import { Draggable } from '../../../../../../src';
import { grid } from '../../../../constants';
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from '../../../../../../src';
import type { Quote as QuoteType, Author as AuthorType } from '../../../types';

type Props = {|
  quote: QuoteType,
  index: number,
|};

const Container = styled.div`
  background-color: ${props =>
    props.isDragging ? props.author.colors.soft : 'red'};
  box-shadow: ${props => (props.isDragging ? `1px 1px 1px red` : 'none')};
  border-width: 1px;
  border-style: solid;
  border-color: ${props =>
    props.isDragging ? props.author.colors.medium : 'transparent'};
  margin-bottom: ${grid}px;
  padding: ${grid}px;
  border-radius: 2px;
  font-weight: normal;
  display: flex;

  &:focus {
    outline: 2px solid ${props => props.author.colors.medium};
    box-shadow: none;
  }
`;

const Avatar = styled.img`
  border-radius: 50%;
  width: 40px;
  height: 40px;
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
  margin-top: ${grid}px;
  text-align: right;
  flex-grow: 1;
  background-color: ${props => {
    const author: AuthorType = props.author;
    return author.colors.soft;
  }};
  border-radius: 2px;
  padding: ${grid / 2}px ${grid}px;
`;

export default class Item extends React.Component<Props> {
  render() {
    const quote: QuoteType = this.props.quote;
    const index: number = this.props.index;
    const author: AuthorType = quote.author;
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
              <Attribution author={author} isDragging={snapshot.isDragging}>
                - {author.name}
              </Attribution>
            </Content>
          </Container>
        )}
      </Draggable>
    );
  }
}
