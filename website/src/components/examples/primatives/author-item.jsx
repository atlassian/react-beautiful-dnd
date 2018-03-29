// @flow
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { colors, grid } from '../constants';
import type { DraggableProvided, DraggableStateSnapshot } from '../../../../../src/';
import type { Author } from '../types';

type HTMLElement = any;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
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

type Props = {|
  author: Author,
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  autoFocus?: boolean,
|}

export default class AuthorItem extends Component<Props> {
  componentDidMount() {
    if (!this.props.autoFocus) {
      return;
    }

    // eslint-disable-next-line react/no-find-dom-node
    const node: HTMLElement = ReactDOM.findDOMNode(this);
    node.focus();
  }

  render() {
    const author: Author = this.props.author;
    const provided: DraggableProvided = this.props.provided;
    const snapshot: DraggableStateSnapshot = this.props.snapshot;

    return (
      <Avatar
        innerRef={ref => provided.innerRef(ref)}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        src={author.avatarUrl}
        alt={author.name}
        isDragging={snapshot.isDragging}
      />
    );
  }
}
