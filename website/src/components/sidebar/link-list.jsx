// @flow
import React from 'react';
import { Link } from 'gatsby';
import type { NavLink } from './sidebar-types';
import { linkClassName, isActiveClassName } from './link-class-name';

type Props = {|
  links: NavLink[],
  hoverColor: string,
|};
export default class LinkList extends React.Component<Props> {
  render() {
    const { links, hoverColor } = this.props;
    return links.map((link: NavLink) => (
      <Link
        to={link.href}
        className={linkClassName(hoverColor)}
        activeClassName={isActiveClassName(hoverColor)}
      >
        {link.title}
      </Link>
    ));
  }
}
