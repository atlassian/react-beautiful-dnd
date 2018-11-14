// @flow
import React from 'react';
import logo from '../assets/logo-with-border.svg';

type Props = {|
  size: number,
|};

export default (props: Props) => (
  <img
    src={logo}
    alt="react-beautiful-dnd logo"
    width={props.size}
    height={props.size}
  />
);
