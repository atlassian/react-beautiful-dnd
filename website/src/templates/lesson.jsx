import React from "react"
import Helmet from "react-helmet"
import styled from "styled-components"
import Link from 'gatsby-link'

import SEO from "../components/SEO"
import SiteHeader from '../components/Layout/Header'
import config from "../../data/SiteConfig"
import TableOfContents from "../components/Layout/TableOfContents"

export default class LessonTemplate extends React.Component {
  render() {
    const {slug} = this.props.pathContext
    const postNode = this.props.data.postBySlug
    const post = postNode.frontmatter
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
        <SEO postPath={slug} postNode={postNode} postSEO/>
        <BodyGrid>
          <HeaderContainer>
            <SiteHeader location={this.props.location}/>
          </HeaderContainer>
          <ToCContainer>
            <TableOfContents
              posts={this.props.data.tableOfContents}
            />
          </ToCContainer>
          <BodyContainer>
            <div>
              <h1>
                {post.title}
              </h1>
              <div dangerouslySetInnerHTML={{__html: postNode.html}}/>
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
  grid-template-rows: 75px 1fr;
  grid-template-columns: 300px 1fr;
  
  @media screen and (max-width: 600px) {
    display: flex;
    flex-direction: column;
    height: inherit;
  }
`

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
`

const HeaderContainer = styled.div`
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  z-index: 2;
   @media screen and (max-width: 600px) {
    order: 1;
  }
`

const ToCContainer = styled.div`
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  background: ${props => props.theme.lightGrey};
  overflow: scroll;
   @media screen and (max-width: 600px) {
    order: 3;
    overflow: inherit;
  }
`

/* eslint no-undef: "off"*/
export const pageQuery = graphql`
  query LessonBySlug($slug: String!) {
  postBySlug: markdownRemark(fields: { slug: { eq: $slug } }) {
    html
    timeToRead
    excerpt
    frontmatter {
      title
      cover
      date
      category
      tags
    }
  }
  tableOfContents: lessonsJson {
      coolness
      chapters {
        one {
          subchapter_one_one {
            post {
              id
              childMarkdownRemark {
                fields {
                  slug
                }
                frontmatter {
                  title
                }
              }
            }
          }
          subchapter_one_two {
            post {
              id
              childMarkdownRemark {
                fields {
                  slug
                }
                frontmatter {
                  title
                }
              }
            }
          }
        }
        two {
          subchapter_two_one {
            post {
              id
              childMarkdownRemark {
                fields {
                  slug
                }
                frontmatter {
                  title
                }
              }
            }
          }
        }
        three {
          post {
            id
            childMarkdownRemark {
              fields {
                slug
              }
              frontmatter {
                title
              }
            }
          }
        }
      }
    }
  }
`;
