# Crystal

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
// Create a database
const DB = new Crystal.Database('my_db');

// Define a class
const User = new DB.Class({
    schema: ['id', 'name', 'display_name'],
    pulls: [
        {
            from: 'id', to: ['name', 'display_name'],
            func: async function() {
                let user = await retrieveFromDatabase();
                this.name = user.name;
                this.display_name = user.display_name;
            }
        }
    ]
});

// Create an instance of that class
const adminUser = new User({
    id: 0
});

// Dynamically retrieve data
(async () => {
    await adminUser.pull('name');
    console.log(adminUser.name); // 'admin'
})()
```

## Creating a database

A database is the core of every Crystal project. It stores all your class types, allowing them to interact with each other, similar to a relational database.

```js
const DB = new Crystal.Database('database_name');
```

## Creating a class

We create a class as part of a database, like so:

```js
const ClassName = new DB.Class(o);
```

Here, `o` is our options object. 

### Schema

We define all our fields, or columns, through the schema property. There are several ways to do this.
```js
// as an array of strings
const o1 = {
    schema: ['field1', 'field2', 'field3',...]
    ...
}

// as an object, with field names as property names
const o2 = {
    schema: {
        // only specifying a type
        field1: Object,
        
        // specifying extra options
        field2: {
            type: Number,
            primary: true, // will be used as a primary key
            ...
        },
        ...
    }
    ...
}
```
A field's options object can be given several parameters.

Parameter | Function | Type / Inputs | Default
- | - | - | -
type | Specifies a type to check for when setting this property. |  Can be `Number`, `Boolean`, `String`, `Symbol`, `Function`, or any constructor. | n/a
primary | Specifies this field as a primary key. If multiple fields have this set to `true`, they must all be specified to retrieve this value from a `Table`. | `Boolean` | `false` 
default | Sets a default value if the value has not been retrieved yet. | Must have the type specified in `type`. If none are specified, then any input is valid. | n/a
errorIfMissing | Throws an error if this value ever does not exist. Often used in conjunction with primary keys. | `Boolean` | `false`
errorIfImpossible | Throws an error if one attempts to pull the value, but is unsuccessful. | `Boolean` | `false`

### Pulls

These are methods which take a subset of properties of a given object, and retrieve the values of properties outside the set. `o.pulls` must be an array of objects, like so.

```js
const o = {
    ...
    pulls: [
        {
            from: 'field1', to: 'field2',

            // this cannot be an arrow function, or 'this' cannot be accessed
            func: async function() {
                // set this.field2 somewhere here
            }
        },
        {
            // all of 'from', 'to', and 'func' can be arrays of values.
            from: ['field1', 'field2'], to: ['field3', 'field4'],
            func: [
                async function() { ... }, // run this
                async function() { ... }, // then this, in series
                ...
            ]
        }
    ],
    ...
}
```
 
If a property `field1` does not exist, but there exists some order of pulls such that we can retrieve it, then `obj.pull('field1')` will determine this path, and do so. For example, if in the above example, only `field1` exists, then `field3` and `field4` may be retrieved after pulls 0 and 1 are performed. This may only happen should there exist a path from currently existing fields to the one attempted.

Each pull has a series of parameters which can be specified. `func` and `to` must exist, but not `from`.

Parameter | Function | Type | Default
- | - | - | -
func | A function, or series of functions, which are performed to retrieve `from`. | `Function`, or `Array<Function>` | User value is required.
from | The properties of an object that `func` must be able to access to retrieve `to`. | `String`, or `Array<String>` | `[]`
to | The properties of an object that are retrieved after `func` is run. | `String`, or `Array<String>` | User value is required.
name | Specifying this value means that the pull may performed as the function `obj[name]`. | `String` | n/a

### Methods

These are functions which allow the user to mutate, add and delete properties of the object at will. 

They are formatted like so.
```js
const o = {
    ...
    methods: {
        // cannot be an arrow function
        push1: async function() {
            ...
        },
        ...
    },
    ...
}
```
For any objects produced by this class, we may run `obj['push1']` as a regular method.

### Computed Properties

These are properties which may be calculated from properties which already exist on the object. They can read existing properties, as well as whether their value is accurate, but cannot mutate or delete them.

They are formatted like so.
```js
const o = {
    ...
    computed: {
        // cannot be an arrow function
        value1: function () {
            ...
        },
        ...
    },
    ...
}
```
We may access `value1` through `obj['value1']`.

## Creating an object

We've seen this already, but as a quick reminder:

```js
const DB = new Crystal.Database('my_db');

const MyClass = new DB.Class({
    schema: ['field1', 'field2', 'field3'],
    pulls: ... ,
    methods: ... ,
    computed: ...
});

const myObject = new MyClass({
    field1: ... ,
    field2: ... ,
    // not all fields are required here, we can get em later
});
```
Once we have our class, we can create an object as easily as we can with a regular constructor.