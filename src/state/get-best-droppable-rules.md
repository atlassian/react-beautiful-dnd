
## Rules for finding the best Droppable:

### 1. Find lists on the cross axis

Find the list(s) that are closest on the cross axis

Conditions
1. The list must have one corner with the size (height: vertical) of the source list
2. The list must be visible to the user

If more than one list is as close on the cross axis, then:

### 2. Find the closest corner

Based on the draggable items current center position, we need to find the list that
has the closest corner point. That is the closest list.

We do not need to consider the conditions in step 1 as they have already been applied

## Rules for finding the best location within a Droppable

### If moving on the main axis
Move into the first / last position depending on if you are leaving the front / back of the Droppable

nice

### If moving on the cross axis

#### Moving to empty list

Move to the top (vertical list) / left (horizontal list) of the list

#### Moving to populated list

1. Find the draggable with the closest center position

If there is more than one with the closest - choose the the one closest to the top left corner of the page

2. Move below the item if the Draggables current center position is less than the destination. Otherwise, move above
Below = go below
Above = go above
Equal = go above