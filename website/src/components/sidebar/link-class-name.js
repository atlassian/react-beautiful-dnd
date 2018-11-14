// @flow
import { css } from 'react-emotion';
import { colors, grid } from '../../constants';

const getBackgroundColor = (isDragging?: boolean) =>
  isDragging ? colors.green400 : 'inherit';

export const linkClassName = (hoverColor: string, isDragging?: boolean) => css`
  background-color: ${getBackgroundColor(isDragging)};
  color: ${isDragging ? colors.dark100 : colors.dark200};
  display: block;
  padding: ${grid}px;
  padding-left: ${grid * 3}px;

  transition: background-color ease-out 0.1s, color ease 0.2s;

  :hover,
  :active,
  :focus {
    color: ${colors.dark100};
    background-color: ${hoverColor};
    text-decoration: none;
  }
`;

export const isActiveClassName = (color: string) => css`
  color: ${colors.dark100};
  background-color: ${color};
`;
