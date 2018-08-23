// @flow
import React, { type Node } from 'react';
import Helmet from 'react-helmet';
/* eslint-disable-next-line import/extensions */
import '@atlaskit/css-reset';
import styled from 'react-emotion';
import { colors, lineHeight, fontSizeEm, grid } from '../constants';

type Props = {
  children: Node,
};

const BaseStyles = styled.div`
  color: ${colors.dark100};
  background: ${colors.dark500};
  line-height: ${lineHeight};
  font-size: ${fontSizeEm}em;

  blockquote {
    padding: 0 ${grid * 2}px;
    color: ${colors.dark200};
    border-left: ${grid / 2}px solid ${colors.dark300};
    margin: ${grid * 4}px 0;
  }
  blockquote:before,
  blockquote:after {
    content: '';
  }
  pre {
    margin: ${grid * 3}px 0;
  }
`;

const CommonPage = ({ children }: Props) => (
  <BaseStyles>
    <Helmet>
      <title>react-beautiful-dnd</title>
      <meta
        name="description"
        content="react-beautiful-dnd: Beautiful and accessible drag and drop for lists with React"
      />
    </Helmet>
    {children}
  </BaseStyles>
);

export default CommonPage;
