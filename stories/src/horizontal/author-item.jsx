// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import { Draggable } from '../../../src/';
import { colors, grid } from '../constants';
import type { Author } from '../types';
import type { Provided, StateSnapshot } from '../../../src/view/draggable/draggable-types';

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  cursor: grab;
  margin-right: ${grid}px;
  border-color: ${({ isDragging }) => (isDragging ? colors.green : colors.white)};
  border-style: solid;
  border-width: ${grid}px;
  box-shadow: ${({ isDragging }) => (isDragging ? `2px 2px 1px ${colors.shadow}` : 'none')};

  &:focus {
    /* disable standard focus color */
    outline: none;

    /* use our own awesome one */
    border-color: ${({ isDragging }) => (isDragging ? colors.green : colors.blue.deep)};
  }
`;

export default class AuthorItem extends Component {
  props: {|
    author: Author
  |}

  render() {
    const author: Author = this.props.author;
    return (
      <Draggable draggableId={author.id}>
        {(provided: Provided, snapshot: StateSnapshot) => (
          <div>
            <Avatar
              innerRef={ref => provided.innerRef(ref)}
              style={provided.draggableStyle}
              {...provided.dragHandleProps}
              src={author.avatarUrl}
              alt={author.name}
              isDragging={snapshot.isDragging}
            />
            {provided.placeholder}
          </div>
        )}
      </Draggable>
    );
  }
}
