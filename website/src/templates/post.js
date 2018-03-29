// @flow
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import UserInfo from '../components/UserInfo';
import SocialLinks from '../components/SocialLinks/SocialLinks';
import SEO from '../components/SEO';
import config from '../../data/SiteConfig';
import './b16-tomorrow-dark.css';
import SiteHeader from '../components/Layout/Header';

type Props = {
  pathContext: { slug: string },
  data: {
    markdownRemark: any
  },
  location: string,
}

export default class PostTemplate extends Component<Props, *> {
  render() {
    const { slug } = this.props.pathContext;
    const postNode = this.props.data.markdownRemark;
    const post = postNode.frontmatter;
    if (!post.id) {
      post.id = slug;
    }
    if (!post.id) {
      post.category_id = config.postDefaultCategoryID;
    }
    return (
      <div>
        <Helmet>
          <title>{`${post.title} | ${config.siteTitle}`}</title>
        </Helmet>
        <SEO postPath={slug} postNode={postNode} postSEO />
        <BodyGrid>
          <HeaderContainer>
            <SiteHeader location={this.props.location} />
          </HeaderContainer>
          <BodyContainer>
            <h1>
              {post.title}
            </h1>
            {/* eslint-disable react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: postNode.html }} />
            <div className="post-meta">
              <SocialLinks postPath={slug} postNode={postNode} />
            </div>
            <UserInfo config={config} />
          </BodyContainer>
        </BodyGrid>
      </div>
    );
  }
}

const BodyGrid = styled.div`
  height: 100vh;
  display: grid;
  grid-template-rows: 75px 1fr;
`;

const BodyContainer = styled.div`
  grid-row: 2 / 3;
  overflow: scroll;
  justify-self: center;
  width: 100%;
  padding: ${props => props.theme.sitePadding};

  & > div {
    max-width: ${props => props.theme.contentWidthLaptop};
    margin: auto;
  }

  & > h1 {
    color: ${props => props.theme.accentDark};
  }
`;

const HeaderContainer = styled.div`
  grid-row: 1 / 2;
  z-index: 2;
`;

/* eslint-disable no-undef */
// $FlowFixMe
export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      timeToRead
      excerpt
      frontmatter {
        title
      }
      fields {
        slug
      }
    }
  }
`;
