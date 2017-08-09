// @flow
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import Draggable from '../../src/view/draggable/connected-draggable';
import { borderRadius, colors, grid } from './constants';
import type { Quote } from './types';
import type { Provided, StateSnapshot } from '../../src/view/draggable/draggable-types';

const Container = styled.a`
  border-radius: ${borderRadius}px;
  border: 1px solid grey;
  background-color: ${({ isDragging }) => (isDragging ? 'rgb(185, 244, 188)' : 'white')};

  cursor: ${({ isDragging }) => (isDragging ? 'grabbing' : 'grab')};
  box-shadow: ${({ isDragging }) => (isDragging ? `2px 2px 1px ${colors.shadow}` : 'none')};
  padding: ${grid}px;
  min-height: 40px;
  margin-bottom: ${grid}px;
  user-select: none;
  transition: background-color 0.1s ease;

  /* anchor overrides */
  color: ${colors.black};

  &:hover {
    color: ${colors.black};
    text-decoration: none;
  }

  /* flexbox */
  display: flex;
  align-items: center;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: ${grid}px;
  flex-shrink: 0;
  flex-grow: 0;
`;

const Content = styled.div`
  /* flex child */
  flex-grow: 1;

  /* Needed to wrap text in ie11 */
  /* https://stackoverflow.com/questions/35111090/why-ie11-doesnt-wrap-the-text-in-flexbox */
  flex-basis: 100%

  /* flex parent */
  display: flex;
  flex-direction: column;
`;

const BlockQuote = styled.div`
  &::before {
    content: open-quote;
  }

  &::after {
    content: close-quote;
  }
`;

const Footer = styled.div`
  display: flex;
  margin-top: ${grid}px;
`;

const QuoteId = styled.small`
  flex-grow: 0;
  margin: 0;
`;

const Attribution = styled.small`
  margin: 0;
  margin-left: ${grid}px;
  text-align: right;
  flex-grow: 1;
`;

type Props = {|
  quote: Quote
|}

export default class QuoteItem extends PureComponent {
  props: Props

  render() {
    const { quote } = this.props;
    return (
      <Draggable draggableId={quote.id}>
        {(provided: Provided, snapshot: StateSnapshot) => (
          <div>
            {/* This draggable also happens to be an anchor! */}
            <Container
              href={quote.author.url}
              innerRef={ref => provided.innerRef(ref)}
              isDragging={snapshot.isDragging}
              style={provided.draggableStyle}
              {...provided.dragHandleProps}
            >
              <Avatar src={quote.author.avatarUrl} alt={quote.author.name} />
              <Content>
                <BlockQuote>{quote.content}</BlockQuote>
                <Footer>
                  <QuoteId>(id: {quote.id})</QuoteId>
                  <Attribution>{quote.author.name}</Attribution>
                </Footer>
              </Content>
            </Container>
            {provided.placeholder}
          </div>
        )
      }
      </Draggable>
    );
  }
}
