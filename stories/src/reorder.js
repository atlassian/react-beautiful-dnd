// @flow
import type { Quote, QuoteMap } from './types';
import type { DraggableLocation } from '../../src/types';

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

type ReorderQuoteMapArgs = {|
  quoteMap: QuoteMap,
  source: DraggableLocation,
  destination: DraggableLocation,
|}

export type ReorderQuoteMapResult = {|
  quoteMap: QuoteMap,
|}

export const reorderQuoteMap = ({
  quoteMap,
  source,
  destination,
}: ReorderQuoteMapArgs): ReorderQuoteMapResult => {
  const current: Quote[] = [...quoteMap[source.droppableId]];
  const next: Quote[] = [...quoteMap[destination.droppableId]];
  const target: Quote = current[source.index];

  // moving to same list
  if (source.droppableId === destination.droppableId) {
    const reordered: Quote[] = reorder(
      current,
      source.index,
      destination.index,
    );
    const result: QuoteMap = {
      ...quoteMap,
      [source.droppableId]: reordered,
    };
    return {
      quoteMap: result,
    };
  }

  // moving to different list

  // remove from original
  current.splice(source.index, 1);
  // insert into next
  next.splice(destination.index, 0, target);

  const result: QuoteMap = {
    ...quoteMap,
    [source.droppableId]: current,
    [destination.droppableId]: next,
  };

  return {
    quoteMap: result,
  };
};

