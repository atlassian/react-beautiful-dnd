// @flow
import React from 'react';
import { graphql } from 'gatsby';
import styled from 'react-emotion';
import Layout from '../components/layouts';

type Data = {
  markdownRemark: {
    html: string,
    fields: {
      gitUrl: string,
    },
  },
};

type Props = {
  data: Data,
  location: {
    pathname: string,
  },
};

const Link = styled.a`
  float: right;
`;

export default ({ data, location }: Props) => (
  <Layout location={location}>
    <Link href={data.markdownRemark.fields.gitUrl}>Edit these docs</Link>
    <div dangerouslySetInnerHTML={{ __html: data.markdownRemark.html }} />
  </Layout>
);

/* eslint-disable no-undef */
// $FlowFixMe
export const query = graphql`
  query markdownQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      fields {
        gitUrl
      }
    }
  }
`;
