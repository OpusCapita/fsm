## FSM workflow (for Node.js)

### Introduction
Workflow is based on Finite State Machine implemented in JS using promises.

- state is stored in the business object related to workflow, not in an extra
workflow object. Multiple workflows could be defined for one business object,
it means that for each workflow owns state field should be use
- one state per workflow execution (no parallelism)
- action is executed in the transition, not in the node/state
- no event sending inside the workflow itself (in action)
- no variables in state workflow: all variables/data need to be stored in
the business objects (e.g. invoice)
- events: visible/available in UI as action buttons for the user
- workflow definition stored as JSON
- guard support (transition/event availability is defined via
condition/expression/function = guard)

#### Notes

The following things will be implemented later as extensions/helpers (separate sibling library) or in specific application:
- task list is based on domain object
- graphical editor
- logging
- analysis
- automatic (times) transitions

## How To Use

### Installation and Setup (in Node)

Run ```npm install fsm-workflow``` to get uo and running. Then:

```javascript
import {MachineDefinition, Machine} from 'fsm-workflow';
```

## Machine definition

Machine definition consist of:
- schema
- actions
- guards
- (auto)

```javascript
const machineDefinition = new MachineDefinition({
  schema: {
    "name": "invoice approval",               
    "initialState": "open",                   
    "finalStates": ["approved"],
    "objectStateFieldName": "status",         
    "transitions": [
      {
          "from": "open",                    
          "event": "approve",                 
          "guards": [                       
            {                               
              "name": "validate",
              "arguments": {
                "argument1": "value1",
                "argument2": "value2"
              }
            }
          ],
          "to": "approved",                   
          "actions": [                       
            {                                
              "name": "archive",
              "arguments": {
                "argument1": "value1",
                "argument2": "value2"
              }
            }
          ],
          "auto": [                          
            {                                
                "name": "lastlyUpdatedMoreThan24hAgo",
                "arguments": {
                  "argument1": "value1",
                  "argument2": "value2"
                }
            }
          ]
      }
    ]
  },
  actions: {
    'archive': function({argument1, argument1}) {}
  },
  guards: {
    'validate': function({argument1, argument1}) {}
  }
  auto: {
    'lastlyUpdatedMoreThan24hAgo': function({argument1, argument1}) {}
  }
});
```

### Schema

Defines machine transitions and initialization options

#### Transitions

In schema you needs to define an array of available machine transitions.
Typically a transition is triggered by an _event_ and happens between
_from_ and _to_ states. Optionally in each transition you can define list(array) of:
- actions
- guards
- (auto)

##### Action

Actions are executed during transition (not during existing/or entering states). Action references specific function by name. Action implemented separately from schema. Each action accepts named arguments explicitly defined in transition and implicit things like _object_, _from_, _to_, _event_. During transition machine executes each action in specified order. Each action gets _actionExecutionResutls_ argument as a result accumulator from perviously called actions, where each property is an action name and value is value returned by action.

##### Guard

Guards are used to protect transitions. Guard could be treated as a condition.
Guards defines the same way like an Action but it should return boolean result (true or false).

Note: Very similar to [Spring State Machine Guards|http://docs.spring.io/spring-statemachine/docs/current/reference/htmlsingle/#configuring-guards]

##### Auto (requires discussion)

Transition could be marked as automatic using _auto_ property. It defines array of
conditions(functions, each return true or false). Could be evaluated/called by external task manager to take a decision if transition/event could be send automatically without user interaction.

#### Initial state

You can define the initial state by setting the _initialState_ property:

```javascript
var machineDefinition = new MachineDefinition({

  initial: 'start'
  transitions: [
    {from: 'start', event: 'run', to: 'finish'}
  ]
});

const object = {status: 'none'};
const machine = new Machine(machineDefinition);
machine.start(object).then(({object}) => {
  console.log(machine.currentState({object}));
  // start  
});
```

if initial state is not specified, then 'none' will be used (TBD)

#### Final states

You can define the final states (one or many) by setting the _finalStates_ property:

```javascript
var machineDefinition = new MachineDefinition({
  initial: 'start',
  finalStates: ['finish'],
  transitions: [
    {from: 'start', event: 'run', to: 'finish'}
  ]
});
```

## Stateful object as a process

Machine does not have own state, all the transitions are performed over object which state is changed by machine. Object is used by Machine as a mutable parameter passed to guards and actions.

```javascript
var machineDefinition = new MachineDefinition({
  initial: 'start'
  finalStates: ['finish'],
  transitions: [
    {from: 'start', event: 'run', to: 'finish'}
  ]
});

const object = {status: 'none'};
const machine = new Machine(machineDefinition);
machine.start(object).then(({object}) => {
  console.log(machine.currentState({object}));
  // start
  return machine.sendEvent({object, event: 'start'})
}).then(({object}) => {
  console.log(machine.currentState({object}));
  // finish
});
```

## Machine
### API

```javascript
var machineDefinition = new MachineDefinition({schema, guards, actions})
// register workflow
var machine = new Machine(machineDefinition, context);

// start/initialize machine/workflow
machine.start({object})

// list of available events: {event, auto}, e.g. event
// and auto(matic) functions for checking if event should/could be sent automatically
machine.availableTransitions({object})

// send 'event' and pass addition 'request' data that is posted by user/app
// returns promise, in case of successful transition then function will be called
// with one parameter that is an JSON with the following structure:
// - object - object in new state (the same reference that is passed as parameter)
machine.sendEvent({object, event, request})

machine.currentState({ object })     // gets current state
machine.is({ object, state})         // is object in state
machine.isFinal({ state })           // state is final or not
machine.can({ object, event })       // whether event is available
machine.cannot({ object, event })    // whether event is not available

// hooks (tbd)
machine.onStartTransition()   // returns promise
machine.onFinishTransition()  // returns promise
```

Note: basic ideas on how API looks like are taken from [fsm-as-promised](https://github.com/vstirbu/fsm-as-promised)

#### [Existing FSM libs review](existingFsmLibsReview.md)
