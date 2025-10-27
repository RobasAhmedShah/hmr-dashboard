# Status Values Test

## Error Message:
```
'status must be one of the following values: '
```

## What We're Sending:
- "Coming Soon"
- "On Hold"
- "Active"
- "Planning"
- "Construction"
- "Sold Out"
- "Completed"

## Possible Backend Expectations:

### Option 1: Lowercase with hyphens
- "coming-soon"
- "on-hold"
- "active"
- "planning"
- "construction"
- "sold-out"
- "completed"

### Option 2: Lowercase no spaces
- "comingsoon"
- "onhold"
- "active"
- "planning"
- "construction"
- "soldout"
- "completed"

### Option 3: Uppercase
- "COMING_SOON"
- "ON_HOLD"
- "ACTIVE"
- "PLANNING"
- "CONSTRUCTION"
- "SOLD_OUT"
- "COMPLETED"

### Option 4: Single word lowercase
- "pending"
- "active"
- "inactive"
- "completed"

## Solution:
Ask backend team or test different formats to find what works.


