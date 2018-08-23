// @flow
import React from 'react';
import styled from 'react-emotion';
import Media from 'react-media';
import Board from './board';
import CommonPage from '../CommonPage';
import CallToAction from './call-to-action';
import SocialIcons from './social-icons';
import { grid } from '../../constants';
import { smallView } from '../media';
import Logo from '../logo';

const Title = styled.h1`
  font-weight: normal;
  font-size: 50px;

  ${smallView.fn`
    text-align: center;
    font-size: 10vw;
    white-space: nowrap;
  `};
`;

const Tagline = styled.p`
  font-size: 20px;
  ${smallView.fn`text-align: center`};
`;

const Landing = styled.div`
  min-height: 100vh;
`;

const SideBySide = styled.div`
  padding-top: ${grid * 10}px;
  padding-left: ${grid * 6}px;
  padding-right: ${grid * 6}px;
  max-width: 1400px;
  margin: 0 auto;

  display: flex;
  /* wrap early if we need it (hopefully not!) */
  /* flex-wrap: wrap; */

  ${smallView.fn`
    flex-direction: column;
    align-items: center;
  `};
`;

const verticalSpacing = `margin-top: ${grid * 4}px;`;

const VerticalRhythm = styled.div`
  ${verticalSpacing};
`;

const Content = styled.div`
  margin-top: ${grid * 8}px;
  flex-grow: 1;

  display: flex;
  flex-direction: column;

  ${smallView.fn`
    align-items: center;
  `};
`;

const Example = styled.div`
  flex-grow: 0;

  ${smallView.fn`${verticalSpacing}`};
`;

const IndexPage = () => (
  <CommonPage>
    <Landing>
      <SideBySide>
        <Content>
          <Logo width={90} />
          <Title>react-beautiful-dnd</Title>
          <Tagline>
            Beautiful and accessible drag and drop for lists with React{' '}
          </Tagline>
          <VerticalRhythm>
            <CallToAction />
          </VerticalRhythm>
          <VerticalRhythm>
            <SocialIcons />
          </VerticalRhythm>
        </Content>
        <Example>
          <Media query={smallView.negatedQuery}>
            {(matches: boolean) => <Board numberOfColumns={matches ? 2 : 1} />}
          </Media>
        </Example>
      </SideBySide>
    </Landing>
  </CommonPage>
);

export default IndexPage;
