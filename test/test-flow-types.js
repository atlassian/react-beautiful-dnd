// @flow
/* eslint-disable */

import * as React from 'react';
import { DragDropContext, Droppable, Draggable } from '../src';

// DragDropContext
{
  <React.Fragment>
    <DragDropContext onDragEnd={() => {}}>{null}</DragDropContext>
    {/* $ExpectError onDragEnd is required */}
    <DragDropContext>{null}</DragDropContext>
    {/* $ExpectError children is required */}
    <DragDropContext onDragEnd={() => {}} />
  </React.Fragment>;
}

// Droppable
{
  <React.Fragment>
    <Droppable droppableId="">{() => null}</Droppable>
    {/* $ExpectError droppableId is required */}
    <Droppable>{() => null}</Droppable>
    {/* $ExpectError droppableId must be a string */}
    <Droppable droppableId={3}>{() => null}</Droppable>
    {/* $ExpectError children as function is required*/}
    <Droppable droppableId="" />
  </React.Fragment>;
}

// Draggable
{
  <React.Fragment>
    <Draggable draggableId="" index={0}>
      {() => null}
    </Draggable>
    {/* $ExpectError draggableId is required */}
    <Draggable index={0}>{() => null}</Draggable>
    {/* $ExpectError draggableId must be a string */}
    <Draggable draggableId={2} index={0}>{() => null}</Draggable>
    {/* $ExpectError index is required */}
    <Draggable draggableId="">{() => null}</Draggable>
    {/* $ExpectError children as function is required*/}
    <Draggable draggableId="" index={0} />
  </React.Fragment>;
}
