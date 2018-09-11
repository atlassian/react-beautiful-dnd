// @flow
import React from 'react';
import { graphql } from 'gatsby';
import styled from 'react-emotion';
import EditIcon from 'react-icons/lib/fa/pencil';
import Layout from '../components/layouts';
import { colors, grid, gutter } from '../constants';
import { smallView } from '../components/media';

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

const EditLink = styled('a')`
  float: right;
  display: flex;
  align-items: center;

  ${smallView.fn(`
    float: none;
    margin-bottom: ${gutter.normal}px;
  `)};
`;

const EditText = styled('span')`
  padding-left: ${grid}px;
`;

export default ({ data, location }: Props) => (
  <Layout location={location}>
    <EditLink href={data.markdownRemark.fields.gitUrl}>
      <EditIcon height={20} width={20} color={colors.dark200} />{' '}
      <EditText>edit these docs</EditText>
    </EditLink>
    {/* eslint-disable-next-line react/no-danger */}
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
