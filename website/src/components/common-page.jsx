// @flow
import React, { type Node } from 'react';
import Helmet from 'react-helmet';
/* eslint-disable-next-line import/extensions */
import '@atlaskit/css-reset';
import styled from 'react-emotion';
import { colors, lineHeight, fontSizeEm } from '../constants';

type Props = {
  children: Node,
};

const BaseStyles = styled.div`
  color: ${colors.dark100};
  background: ${colors.dark400};
  line-height: ${lineHeight};
  font-size: ${fontSizeEm}em;
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
