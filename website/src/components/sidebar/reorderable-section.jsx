// @flow
import React from 'react';
import styled, { css } from 'react-emotion';
import { Link } from 'gatsby';
import { grid, gutter, colors } from '../../constants';
import reorder from '../reorder';
import type { NavLink } from './sidebar-types';
import { Draggable, Droppable, DragDropContext } from '../../../../src';
import type {
  DraggableProvided,
  DroppableProvided,
  DropResult,
} from '../../../../src';

const base = ({ isActive, hoverColor }) => css`
  color: ${colors.dark200};
  display: block;
  padding: ${grid}px;
  padding-left: ${grid * 3}px;

  background-color: ${isActive ? hoverColor : 'inherit'};
  transition: background-color ease 0.2s, color ease 0.2s;

  :hover,
  :active,
  :focus {
    color: ${colors.dark100};
    background-color: ${hoverColor};
    text-decoration: none;
  }
`;

type NavLinkItemProps = {|
  link: NavLink,
  index: number,
  isActive: boolean,
  hoverColor: string,
|};

class NavLinkItem extends React.Component<NavLinkItemProps> {
  render() {
    const { link, isActive, index, hoverColor } = this.props;
    return (
      <Draggable draggableId={link.href} index={index}>
        {(provided: DraggableProvided) => (
          <Link
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            innerRef={provided.innerRef}
            to={link.href}
            className={base({ isActive, hoverColor })}
          >
            {link.title}
          </Link>
        )}
      </Draggable>
    );
  }
}

type SectionProps = {|
  title: string,
  hoverColor: string,
  links: NavLink[],
|};

const Title = styled.h3`
  font-size: 20px;
  padding: ${grid}px;
  padding-left: ${gutter.normal}px;
`;

type LinkListProps = {|
  links: NavLink[],
  hoverColor: string,
|};

type LinkListState = {|
  ordered: NavLink[],
|};

class LinkList extends React.Component<LinkListProps, LinkListState> {
  state: LinkListState = {
    ordered: this.props.links,
  };

  onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    this.setState({
      ordered: reorder(
        this.state.ordered,
        result.source.index,
        result.destination.index,
      ),
    });
  };

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="section">
          {(provided: DroppableProvided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {this.state.ordered.map((link: NavLink, index: number) => (
                <NavLinkItem
                  key={link.href}
                  link={link}
                  isActive={window.location.pathname === link.href}
                  hoverColor={this.props.hoverColor}
                  index={index}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

export default class ReorderableSection extends React.Component<SectionProps> {
  render() {
    return (
      <React.Fragment>
        <Title>{this.props.title}</Title>
        <LinkList links={this.props.links} hoverColor={this.props.hoverColor} />
      </React.Fragment>
    );
  }
}
