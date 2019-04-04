# Crystal

**Note**: This project is a WIP and many features have yet to be implemented. Do not use this in any production code.

## Installing

```
npm i crystaljs --save
```

## Importing to a project

For node.js environments:
```js
const Crystal = require('crystaljs');
```
For ESNext:
```js
import Crystal from 'crystaljs';
```

## Quick Start

```js
// create a class
class User {
    ...
}

// extend it with Crystal
User = Crystal.extend(User, [
    {
        from: ..., to: ...
        func: 
    }
])

```