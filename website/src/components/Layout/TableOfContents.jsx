// @flow
import React from 'react';
import Link from 'gatsby-link';
import styled from 'styled-components';

class TableOfContents extends React.Component {
  constructor() {
    super();
    this.currentLevel = 0;
  }

  renderUL = ({ node }) => (
    <LessonLIContainer key={node.fields.slug}>
      <Link to={node.fields.slug}>
        <li>
          <h6>{node.frontmatter.title}</h6>
        </li>
      </Link>
    </LessonLIContainer>
  )

  render() {
    console.log(this.props.contents.edges);
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

const ChapterLIContainer = styled.li`
  h5 {
     font-weight: 200;
     font-size: 2.8rem;
     color: ${props => props.theme.brand};
     margin-bottom: 10px;
  }

`;

const SubchapterLIContainer = styled.li`
  h5 {
     font-weight: 600;
     color: black;
     margin-bottom: 5px;
  }
`;

export default TableOfContents;
