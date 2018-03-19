import React from "react"
import Link from 'gatsby-link'
import styled from 'styled-components'


class TableOfContents extends React.Component {
  constructor() {
    super();
    this.nodeListItemsToRender = [];
    this.currentLevel = 0;
  }

  formatChapterTitle(title) {
    return title.split('_').map(word => word[0].toUpperCase() + word.substring(1)).join(' ');
  }

  addSubchapterJSX(node) {
    this.nodeListItemsToRender.push(
      <SubchapterLIContainer key={node}>
        <h5>
          {this.formatChapterTitle(node)}
        </h5>
      </SubchapterLIContainer>
    );
  }

  addChapterJSX(node) {
    this.nodeListItemsToRender.push(
      <ChapterLIContainer key={node}>
        <h5>
          {this.formatChapterTitle(node)}
        </h5>
      </ChapterLIContainer>
    )
  }

  buildLessonItemNodes(nodeArray) {
    nodeArray.forEach(node => {
      this.nodeListItemsToRender.push(
        <LessonLIContainer key={node.post.id}>
          <Link to={node.post.childMarkdownRemark.fields.slug}>
            <li>
              <h6>{node.post.childMarkdownRemark.frontmatter.title}</h6>
            </li>
          </Link>
        </LessonLIContainer>
      )
    })
  }

  buildChapterNodes(node) {
    // If this is a Chapter (and not a subchapter)
    if (this.currentLevel === 0) {
      this.addChapterJSX(node);
      // Else it's a SubChapter
    } else {
      this.addSubchapterJSX(node);
    }
  }


  // Level matters because sub-chapter <li> and chapter <li>s are styled differently
  //
  // If the node is an Array, it holds the actual page nodes itself,
  // 1. Add the node's value as either a chapter <li> or subchapter <li> - based on level
  // 2. Build the lesson <li> links
  //
  // Else, its an object, so it must be a chapter or sub-chapter
  // 1. build the Chapter <li>
  // 2. Recursively restart on the child node
  //
  // For level, if we've hit an array, then we must be as deeply nested as possible.
  // So the next node we hit will be a top level chapter node, so we're back to level 0.
  //
  buildNodes(nodes) {
    function getNextNode(postNodes, node) {
      const keys = Object.keys(nodes);
      const nextIndex = keys.indexOf(node) +1;
      return keys[nextIndex];
    }

    Object.keys(nodes).forEach(node => {
      const nextNode = getNextNode(nodes, node);
      if (Array.isArray(nodes[node])) {
        // Add the Lowest Level Chapter Name (Title of Array):
        this.buildChapterNodes(node);
        this.buildLessonItemNodes(nodes[node]);
        if (nextNode === undefined) {
          this.currentLevel -= 1;
        }
      } else {
        this.buildChapterNodes(node)
        this.currentLevel += 1;
        this.buildNodes(nodes[node])
      }
    });
  }

  render() {
    const posts = this.props.posts.chapters;
    this.nodeListItemsToRender = [];
    this.buildNodes(posts);
    return (
      <TableOfContentsContainer>
        <ul>
          {this.nodeListItemsToRender}
        </ul>
      </TableOfContentsContainer>
    )
  }
}

const TableOfContentsContainer = styled.div`
  padding: ${props => props.theme.sitePadding};

  & > ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
`

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
`

const ChapterLIContainer = styled.li`
  h5 {
     font-weight: 200;
     font-size: 2.8rem;
     color: ${props => props.theme.brand};
     margin-bottom: 10px;
  }

`

const SubchapterLIContainer = styled.li`
  h5 {
     font-weight: 600;
     color: black;
     margin-bottom: 5px;
  }
`

export default TableOfContents

