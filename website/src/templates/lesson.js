// @flow
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import SiteHeader from '../components/Layout/Header';
import config from '../../data/SiteConfig';
import TableOfContents, { type nodeType } from '../components/Layout/TableOfContents';

type Props = {
  data: {
    postBySlug: { html: string, frontmatter: { title: string } },
    toc: {
      edges: [
        { node: nodeType },
      ]}
  },
  location: string,
}

export default class LessonTemplate extends Component<Props, *> {
  render() {
    const postNode = this.props.data.postBySlug;
    const post = postNode.frontmatter;
    return (
      <div>
        <Helmet>
          <title>{`${post.title} | ${config.siteTitle}`}</title>
        </Helmet>
        <BodyGrid>
          <HeaderContainer>
            <SiteHeader location={this.props.location} />
          </HeaderContainer>
          <ToCContainer>
            <TableOfContents
              contents={this.props.data.toc}
            />
          </ToCContainer>
          <BodyContainer>
            <div>
              <h1>
                {post.title}
              </h1>
              {/* eslint-disable react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: postNode.html }} />
            </div>
          </BodyContainer>
        </BodyGrid>
      </div>
    );
  }
}

const BodyGrid = styled.div`
  height: 100vh;
  display: grid;
  grid-template-columns: 300px 1fr;

  @media screen and (max-width: 600px) {
    display: flex;
    flex-direction: column;
    height: inherit;
  }
`;

const BodyContainer = styled.div`
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  overflow: scroll;
  justify-self: center;
  width: 100%;
  padding: ${props => props.theme.sitePadding};
  @media screen and (max-width: 600px) {
    order: 2;
  }

  & > div {
    max-width: ${props => props.theme.contentWidthLaptop};
    margin: auto;
  }

  & > h1 {
    color: ${props => props.theme.accentDark};
  }
`;

const HeaderContainer = styled.div`
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  z-index: 2;
   @media screen and (max-width: 600px) {
    order: 1;
  }
`;

const ToCContainer = styled.div`
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  background: ${props => props.theme.lightGrey};
  overflow: scroll;
   @media screen and (max-width: 600px) {
    order: 3;
    overflow: inherit;
  }
`;

/* eslint-disable no-undef */
// $FlowFixMe
export const pageQuery = graphql`
  query LessonBySlug($slug: String!, $dir: String!) {
  postBySlug: markdownRemark(fields: { slug: { eq: $slug } }) {
    html
    timeToRead
    excerpt
    frontmatter {
      title
    }
  }
  toc: allMarkdownRemark(
    limit: 2000
    sort: { fields: [fields___slug], order: DESC }
    filter: { fields: { dir: { eq: $dir } } }
  ) {
    edges {
      node {
        fields {
          slug
        }
        excerpt
        timeToRead
        frontmatter {
          title
        }
      }
    }
  }
  }
`;
