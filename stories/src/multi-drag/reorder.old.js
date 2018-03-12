// @flow
import type { Column, Entities } from './types';
import type { Task, Id } from '../types';
import type { DraggableLocation } from '../../../src/types';
import reorder from '../reorder';

type Args = {|
  entities: Entities,
  selectedTaskIds: Id[],
  source: DraggableLocation,
  destination: DraggableLocation,
|}

export type Result = {|
  entities: Entities,
  // a drop operations can change the order of the selected task array
  selectedTaskIds: Id[],
|}

type Entry = {|
  task: Task,
  columnId: string,
  index: number,
  selectionIndex: number,
|}

const getColumnById = (columns: Column[], id: string): Column => {
  const column: ?Column = columns.find((col: Column) => col.id === id);
  if (!column) {
    throw new Error('cannot find column');
  }
  return column;
};

const withNewTasks = (column: Column, tasks: Task[]): Column => ({
  id: column.id,
  title: column.title,
  tasks,
});

const reorderMultiDrag = ({
  columns,
  selected,
  source,
  destination,
}): Result => {
  // 1. remove all of the selected tasks from their lists
  // When ordering the collected tasks:
  //  dragged item first
  //  followed by the items with the lowest index
  //  in the event of a tie, use the one that was selected first

  const start: Column = getColumnById(columns, source.droppableId);
  const dragged: Task = start.tasks[source.index];

  const collection: Entry[] = selected.map((task: Task, selectionIndex: number): Entry => {
    const column: ?Column = columns.find((col: Column) => col.tasks.includes(task));

    if (!column) {
      throw new Error('Could not find home for task');
    }

    const index: number = column.tasks.indexOf(task);

    const entry: Entry = {
      task,
      columnId: column.id,
      index,
      selectionIndex,
    };

    return entry;
  });

  collection.sort((a: Entry, b: Entry): number => {
    // moving the dragged item to the top of the list
    if (a === dragged) {
      return -1;
    }
    if (b === dragged) {
      return 1;
    }

    // sorting by the index
    if (a.index !== b.index) {
      return a.index - b.index;
    }

    // if the index is the same then we use the order in which it was selected
    return a.selectionIndex - b.selectionIndex;
  });

  // all tasks will be removed. We need to know how many are before the
  // destination index so we can account for this change when inserting
  // the tasks in the destination list
  const destinationOffset: number = collection.reduce((acc: number, entry: Entry): number => {
    // task is not in the destination column so we do not need to account for it
    if (entry.columnId !== destination.droppableId) {
      return acc;
    }

    // task is after the destination point so we do not need to account for it
    if (entry.index > destination.index) {
      return acc;
    }

    return acc + 1;
  }, 0);
  const insertAtIndex: number = destination.index - destinationOffset;

  // okay, now we are going to remove the tasks from their original locations
  type TaskMap = {
    [columnId: string]: Task[]
  }

  const toRemove: TaskMap = collection.reduce((map: TaskMap, entry: Entry): TaskMap => {
    if (!map[entry.columnId]) {
      map[entry.columnId] = [];
    }

    map[entry.columnId].push(entry.task);
    return map;
  }, {});

  const withRemovedTasks: Column[] = columns.map((column: Column): Column => {
    // no tasks need to be removed from this column
    if (!toRemove[column.id]) {
      return column;
    }

    // remove task from column
    const newTasks: Task[] = [...column.tasks];
    newTasks.splice(source.index, 1);

    return withNewTasks(column, newTasks);
  });

  // okay, at this point we have removed all of the selected tasks from all columns
  // now we need to insert the selected tasks into the destination column
  const final: Column = getColumnById(withRemovedTasks, destination.droppableId);
  const finalIndex: number = columns.indexOf(final);
  const collectedTasks: Task[] = collection.map((entry: Entry): Task => entry.task);

  // insert all of the items in the final index
  const newFinalTasks: Task[] = [...final.tasks];
  newFinalTasks.splice(insertAtIndex, 0, ...collectedTasks);

  const finalWithAddedTasks: Column = withNewTasks(final, newFinalTasks);

  const updated: Column[] = [...withRemovedTasks];
  updated[finalIndex] = finalWithAddedTasks;

  // sorting the selected items based on their new destination index
  const rebalanced: Task[] = selected.sort((a: Task, b: Task): number => {
    const aIndex: number = finalWithAddedTasks.tasks.indexOf(a);
    const bIndex: number = finalWithAddedTasks.tasks.indexOf(b);
    return aIndex - bIndex;
  });

  return {
    columns: updated,
    selected: rebalanced,
  };
};

const replaceColumn = (columns: Column[], newColumn: Column): Column[] => {
  const index: number = columns.findIndex((col: Column) => col.id === newColumn.id);
  const shallow: Column[] = [...columns];
  shallow[index] = newColumn;
  return shallow;
};

const reorderSingleDrag = ({
  columns,
  selected,
  source,
  destination,
}): Result => {
  // moving in same list
  if (source.droppableId === destination.droppableId) {
    const column: Column = getColumnById(columns, source.droppableId);
    const reordered: Task[] = reorder(
      column.tasks,
      source.index,
      destination.index,
    );
    const withReorderedTasks: Column = withNewTasks(column, reordered);
    const updated: Column[] = replaceColumn(columns, withReorderedTasks);

    const result: Result = {
      columns: updated,
      // not updating the selected items
      selected,
    };

    return result;
  }

  const home: Column = getColumnById(columns, source.droppableId);
  const foreign: Column = getColumnById(columns, destination.droppableId);
  const homeIndex: number = columns.indexOf(home);
  const foreignIndex: number = columns.indexOf(foreign);

  // the single task to be moved
  const task: Task = home.tasks[source.index];

  // remove from home column
  const newHomeTasks: Task[] = [...home.tasks];
  newHomeTasks.splice(source.index, 1);

  // add to foreign column
  const newForeignTasks: Task[] = [...foreign.tasks];
  newForeignTasks.splice(destination.index, 0, task);

  const shallow: Column[] = [...columns];
  shallow[homeIndex] = withNewTasks(home, newHomeTasks);
  shallow[foreignIndex] = withNewTasks(foreign, newForeignTasks);

  const result: Result = {
    columns: shallow,
    selected,
  };

  return result;
};

export default (args: Args): Result => {
  if (args.selectedTaskIds.length > 1) {
    return reorderMultiDrag(args);
  }
  return reorderSingleDrag(args);
};
