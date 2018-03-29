// @flow
import React from 'react';
import Link from 'gatsby-link';

export type ListItemType = {
  fields: {
    slug: string,
  },
  frontmatter: {
    title: string
  }
}

const ListItem = ({ fields, frontmatter }: ListItemType) => (
  <ul key={fields.slug}><Link href={fields.slug} to={fields.slug}>{frontmatter.title}</Link></ul>
);

export default ListItem;
