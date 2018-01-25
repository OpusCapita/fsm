# Business Object History

![badge-npm-version](https://img.shields.io/npm/v/@opuscapita/fsm-workflow-task-manager.svg)
![NPM Downloads](https://img.shields.io/npm/dm/@opuscapita/fsm-workflow-task-manager.svg)

Business Object History is an extension to FSM Core.  It provies server-side API for storing and extracting Business Object lifecycle history.

## Installation

Install package

```
npm install --save @opuscapita/filemanager-server
```

## Basic Usage

```javascript
const Sequelize = require('sequelize');
const businessObjectHistory = require('@opuscapita/filemanager-server');
const dbConfig = require('./config/db.js');

const sequelize = new Sequelize(dbConfig);

businessObjectHistory(sequelize).then(handlers => {
  const { add, search } = handlers;

  add({
    from: 'from-state',
    to: 'to-state',
    event: 'transition-event',
    businessObjectType: 'invoice',
    businessObjectId: 'ew153-7210',
    initiator: 'user-id-46270e',
    description: 'Optional business object transition description text'
  }).
    then(obj => console.log('The following obj has been added to history', obj)).
    catch(err => console.log('Error adding obj to histofy', err));

  search({

    // Optional.
    // Its format is the same as "where" in sequelize.model().findAll
    where: {
      from: 'from-state',
      to: 'to-state'
    },

    // Optional.
    // Its format is the same as "order" in sequelize.model().findAll
    order: ['executedOn', 'DESC']

  }).
    then(objList => console.log('The following objects array has been extracted from history', objList)).
    catch(err => console.log('Error extracting objects from history', err));
})
```

