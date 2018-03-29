// @flow
import React, { Component, type Node } from 'react';
import Link from 'gatsby-link';
import styled from 'styled-components';

export type nodeType = {
    fields: {
      slug: string,
    },
    frontmatter: {
      title: string
    }
  }

type ToC = {
  contents: {
    edges: [
      { node: nodeType },
    ]
  }
}

class TableOfContents extends Component<ToC, *> {
  constructor() {
    super();
    this.currentLevel = 0;
  }

  currentLevel: number

  renderUL: ({ node: nodeType }) => Node = ({ node }) => (
    <LessonLIContainer key={node.fields.slug}>
      <Link href={node.fields.slug} to={node.fields.slug}>
        <li>
          <h6>{node.frontmatter.title}</h6>
        </li>
      </Link>
    </LessonLIContainer>
  )

  render() {
    return (
      <TableOfContentsContainer>
        <ul>
          {this.props.contents.edges.map(this.renderUL)}
        </ul>
      </TableOfContentsContainer>
    );
  }
}

const TableOfContentsContainer = styled.div`
  padding: ${props => props.theme.sitePadding};

  & > ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

`;

const LessonLIContainer = styled.div`

  li {
    margin: 0;
    h6, p {
      display: inline-block;
      font-weight: 200;
      color: black;
      margin: 0;
      line-height: 1.5;
      border-bottom: 1px solid transparent;
    }
  }
  &:hover {
    li {
      h6 {
        border-bottom: 1px solid black;
      }
    }
  }
`;

export default TableOfContents;
