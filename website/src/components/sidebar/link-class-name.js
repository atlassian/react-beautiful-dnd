// @flow
import { css } from 'react-emotion';
import { colors, grid } from '../../constants';

export const linkClassName = (color: string) => css`
  color: ${colors.dark200};
  display: block;
  padding: ${grid}px;
  padding-left: ${grid * 3}px;

  transition: background-color ease 0.2s, color ease 0.2s;

  :hover,
  :active,
  :focus {
    color: ${colors.dark100};
    background-color: ${color};
    text-decoration: none;
  }
`;

export const isActiveClassName = (color: string) => css`
  background-color: ${color};
`;
