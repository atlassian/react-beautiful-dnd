// @flow
import React from 'react';
import { graphql } from 'gatsby';
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

export default ({ data, location }: Props) => (
  <Layout location={location}>
    <a href={data.markdownRemark.fields.gitUrl}>Edit these docs</a>
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
