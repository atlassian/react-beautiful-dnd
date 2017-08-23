// @flow
import type { AuthorWithQuotes } from './types';
import type { DropResult, DraggableLocation } from '../../src/types';

// a little function to help us with reordering the result
const reorder = (
  list: any[],
  startIndex: number,
  endIndex: number): any[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export default reorder;

export const reorderGroup = (
  groups: AuthorWithQuotes[],
  result: DropResult
): ?AuthorWithQuotes[] => {
  if (!result.destination) {
    return null;
  }

  const source: DraggableLocation = result.source;
  const destination: DraggableLocation = result.destination;

  const group: ?AuthorWithQuotes = groups.filter(
    (item: AuthorWithQuotes) => item.author.id === result.type
  )[0];

  if (!group) {
    console.error('could not find group', result.type, groups);
    return null;
  }

  const quotes = reorder(
    group.quotes,
    source.index,
    destination.index
  );

  const updated: AuthorWithQuotes = {
    author: group.author,
    quotes,
  };

  const newGroups: AuthorWithQuotes[] = Array.from(groups);
  newGroups[groups.indexOf(group)] = updated;

  return newGroups;
};
