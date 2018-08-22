// @flow
import React from 'react';
import { graphql } from 'gatsby';
import Layout from '../components/layouts';

type Props = {
  data: {
    markdownRemark: {
      html: string,
    },
  },
};

export default ({ data }: Props) => (
  <Layout>
    <div dangerouslySetInnerHTML={{ __html: data.markdownRemark.html }} />
  </Layout>
);

/* eslint-disable no-undef */
// $FlowFixMe
export const query = graphql`
  query markdownQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
    }
  }
`;
