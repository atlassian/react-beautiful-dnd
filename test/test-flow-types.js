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
    {/* $ExpectError doppableId is required */}
    <Droppable>{() => null}</Droppable>
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
    {/* $ExpectError index is required */}
    <Draggable draggableId="">{() => null}</Draggable>
    {/* $ExpectError children as function is required*/}
    <Draggable draggableId="" index={0} />
  </React.Fragment>;
}
