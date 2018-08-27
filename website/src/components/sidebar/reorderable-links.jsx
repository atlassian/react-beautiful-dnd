// @flow
import React from 'react';
import { Link } from 'gatsby';
import reorder from '../reorder';
import type { NavLink } from './sidebar-types';
import { Draggable, Droppable, DragDropContext } from '../../../../src';
import { linkClassName, isActiveClassName } from './link-class-name';
import type {
  DraggableProvided,
  DroppableProvided,
  DropResult,
} from '../../../../src';

type NavLinkItemProps = {|
  link: NavLink,
  index: number,
  hoverColor: string,
|};

class NavLinkItem extends React.PureComponent<NavLinkItemProps> {
  render() {
    const { link, index, hoverColor } = this.props;
    return (
      <Draggable draggableId={link.href} index={index}>
        {(provided: DraggableProvided) => (
          <Link
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            innerRef={provided.innerRef}
            to={link.href}
            className={linkClassName(hoverColor)}
            activeClassName={isActiveClassName(hoverColor)}
          >
            {link.title}
          </Link>
        )}
      </Draggable>
    );
  }
}

type ReorderableLinksProps = {|
  links: NavLink[],
  hoverColor: string,
|};
type ReorderableLinksState = {|
  ordered: NavLink[],
|};

// For performance
class InnerList extends React.PureComponent<ReorderableLinksProps> {
  render() {
    return this.props.links.map((link: NavLink, index: number) => (
      <NavLinkItem
        key={link.href}
        link={link}
        hoverColor={this.props.hoverColor}
        index={index}
      />
    ));
  }
}

export default class ReorderableLinks extends React.Component<
  ReorderableLinksProps,
  ReorderableLinksState,
> {
  state: ReorderableLinksState = {
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
              <InnerList
                links={this.state.ordered}
                hoverColor={this.props.hoverColor}
              />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}
