// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { grid, colors, borderRadius } from '../constants';
import { Draggable } from '../../../src/';
import type { DraggableProvided, DraggableStateSnapshot } from '../../../src/';
import QuoteList from '../primatives/quote-list';
import Title from '../primatives/title';
import type { Quote } from '../types';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Container = styled.div`
  margin: ${grid}px;
  // max-height: ${({ height, isDragging }) => (height && !isDragging ? height : 'auto')};
  display: flex;
  flex-direction: column;
  overflow-y: hidden;

  ${({ isDragging }) => (
    isDragging && false ? (
      `&:after {
        content: '';
        display: block;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 20px;
        background-color: #000;
      }`
    ) : null
  )}
`;

const Header = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-top-left-radius: ${borderRadius}px;
  border-top-right-radius: ${borderRadius}px;
  background-color: ${({ isDragging }) => (isDragging ? colors.blue.lighter : colors.blue.light)};
  transition: background-color 0.1s ease;

  &:hover {
    background-color: ${colors.blue.lighter};
  }
`;

export default class Column extends Component {
  // eslint-disable-next-line react/sort-comp
  props: {|
    title: string,
    quotes: Quote[],
    autoFocusQuoteId: ?string,
    listHeight?: string,
  |}

  render() {
    const title: string = this.props.title;
    const quotes: Quote[] = this.props.quotes;
    return (
      <Draggable draggableId={title} type="COLUMN">
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
          <Wrapper>
            <Container
              height={this.props.listHeight}
              isDragging={!!provided.placeholder}
              innerRef={provided.innerRef}
              style={{
                ...provided.draggableStyle,
                height: 'auto',
                maxHeight: this.props.listHeight,
              }}
            >
              <Header isDragging={snapshot.isDragging}>
                <Title
                  isDragging={snapshot.isDragging}
                  {...provided.dragHandleProps}
                >
                  {title}
                </Title>
              </Header>
              <QuoteList
                listId={title}
                listType="QUOTE"
                quotes={quotes}
                autoFocusQuoteId={this.props.autoFocusQuoteId}
              />
            </Container>
            {provided.placeholder}
          </Wrapper>
        )}

      </Draggable>
    );
  }
}
