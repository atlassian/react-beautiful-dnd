// @flow
import React from 'react';
import Media from 'react-media';
import styled from 'styled-components';
import Board from './board';
import CallToAction from './call-to-action';
import SocialIcons from './social-icons';
import DraggableLogo from '../../draggable-logo';
import { grid, gutter } from '../../../constants';
import { smallView } from '../../media';

const Brand = styled.div`
  display: flex;
  align-items: center;
  line-height: 1;

  ${smallView.fn(`
    flex-direction: column;
    margin-bottom: ${gutter.normal}px;
  `)};
`;

const Title = styled.h1`
  font-weight: normal;
  font-size: 40px;
  margin: 0;
  padding-left: ${gutter.normal}px;

  ${smallView.fn(`
    font-size: 8vw;
    white-space: nowrap;
  `)};
`;

const Tagline = styled.p`
  font-size: 20px;
  ${smallView.fn(`text-align: center`)};
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

  ${smallView.fn(`
    flex-direction: column;
    align-items: center;
    padding-top: ${gutter.normal}px;
  `)};
`;

const verticalSpacing = `margin-top: ${gutter.large}px;`;

const VerticalRhythm = styled.div`
  ${verticalSpacing};
`;

const Content = styled.div`
  margin-top: ${grid * 8}px;
  flex-grow: 1;

  display: flex;
  flex-direction: column;

  ${smallView.fn(`
    align-items: center;
  `)};
`;

const Example = styled.div`
  flex-grow: 0;

  ${smallView.fn(`${verticalSpacing}`)};
`;

export default () => (
  <Media query={smallView.negatedQuery}>
    {(isLarge: boolean) => (
      <SideBySide>
        <Content>
          <Brand>
            <DraggableLogo size={90} usePortal={false} />
            <Title>react-beautiful-dnd</Title>
          </Brand>
          <Tagline>
            Beautiful and accessible drag and drop for lists with React
          </Tagline>
          <VerticalRhythm>
            <CallToAction isSmallView={!isLarge} />
          </VerticalRhythm>
          <VerticalRhythm>
            <SocialIcons />
          </VerticalRhythm>
        </Content>
        <Example>{isLarge ? <Board /> : null}</Example>
      </SideBySide>
    )}
  </Media>
);
