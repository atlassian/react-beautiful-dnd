// @flow

type Args = {|
  isInHomeList: boolean,
  proposedIndex: number,
  startIndexInHome: number,
|};

export default ({
  isInHomeList,
  proposedIndex,
  startIndexInHome,
}: Args): boolean =>
  isInHomeList
    ? // items will be displaced forward when moving backwards in a home list
      proposedIndex < startIndexInHome
    : // always displacing forward when in a foreign list
      true;
