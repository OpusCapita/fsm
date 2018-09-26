import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import find from 'lodash/find';
import Table from 'react-bootstrap/lib/Table';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import statePropTypes from './statePropTypes';
import StateEditor from './StateEditor.react';
import { isDef } from '../utils';
import withConfirmDialog from '../ConfirmDialog';
import DeleteStateDialogBody from './DeleteStateDialogBody.react';

export const DELETE_STATE_TRANSITIONS = 'deleteStateTransitions';
export const SWAP_STATE_IN_TRANSITIONS = 'swapStateInTransitions';

@withConfirmDialog
export default class StatesTable extends PureComponent {
  static propTypes = {
    states: PropTypes.arrayOf(statePropTypes),
    initialState: PropTypes.string.isRequired,
    finalStates: PropTypes.arrayOf(PropTypes.string).isRequired,
    onDelete: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    statesInTransitions: PropTypes.arrayOf(PropTypes.string),
    stateConfig: PropTypes.shape({
      availableNames: PropTypes.arrayOf(PropTypes.string)
    })
  }

  static contextTypes = {
    i18n: PropTypes.object.isRequired
  }

  constructor(...args) {
    super(...args);

    this.state = {
      states: this.statesFromProps(this.props),
      currentState: null,
      showModal: false
    }
  }

  componentWillReceiveProps = props => this.setState({ states: this.statesFromProps(props) })

  statesFromProps = ({ states, initialState, finalStates }) => states.map(state => ({
    ...state,
    isInitial: state.name === initialState,
    isFinal: finalStates.indexOf(state.name) > -1
  }))

  _deleteStateSideEffect = {
    name: DELETE_STATE_TRANSITIONS
  }

  handleDelete = name => {
    const { i18n } = this.context;
    const { statesInTransitions } = this.props;
    const { states } = this.state;

    return this._triggerDialog({
      confirmHandler: _ => this.props.onDelete({
        name,
        ...(statesInTransitions.indexOf(name) > -1 && { sideEffect: this._deleteStateSideEffect })
      }),
      ...(
        statesInTransitions.indexOf(name) > -1 ? {
          BodyComponent: _ => (
            <DeleteStateDialogBody
              i18n={i18n}
              states={states}
              stateName={name}
              onSelect={
                ({ index, alternative }) => {
                  this._deleteStateSideEffect = {
                    name: index === 0 ? DELETE_STATE_TRANSITIONS : SWAP_STATE_IN_TRANSITIONS,
                    alternative
                  }
                }
              }
            />
          )
        } : {
          message: `Do you really want to delete this state?`
        }
      )
    })
  }

  handleEdit = name => _ => this.setState({
    currentState: name,
    showModal: true
  })

  handleAdd = this.handleEdit()

  handleClose = _ => this.setState({
    currentState: null,
    showModal: false
  })

  handleSave = (...args) => {
    this.handleClose();
    this.props.onEdit(...args);
  }

  render() {
    const { i18n } = this.context;
    const { stateConfig } = this.props;
    const { states, currentState, showModal } = this.state;

    let modal;

    if (showModal) {
      let currentStateObject;

      if (isDef(currentState)) {
        currentStateObject = find(states, ({ name }) => name === currentState)
      }

      modal = (
        <StateEditor
          value={currentStateObject}
          onClose={this.handleClose}
          onSave={this.handleSave}
          usedNames={states.map(({ name }) => name)}
          availableNames={(stateConfig || {}).availableNames}
        />
      )
    }

    return (
      <div className="oc-fsm-crud-editor--states-editor">
        <Table className="oc-fsm-crud-editor--table">
          <thead>
            <tr>
              <th>{i18n.getMessage('fsmWorkflowEditor.states.name.label')}</th>
              <th>{i18n.getMessage('fsmWorkflowEditor.states.description.label')}</th>
              <th style={{ width: '60px' }} className='text-center'>
                {i18n.getMessage('fsmWorkflowEditor.states.initial.label')}
              </th>
              <th style={{ width: '60px' }} className='text-center'>
                {i18n.getMessage('fsmWorkflowEditor.states.final.label')}
              </th>
              <th className='text-right'>
                <Button
                  bsSize='sm'
                  onClick={this.handleAdd}
                >
                  {i18n.getMessage('fsmWorkflowEditor.buttons.add.label')}
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {
              states.map(({ name, description, isInitial, isFinal }) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{description}</td>
                  <td className='text-center'>
                    {
                      isInitial && (<i className='fa fa-check'></i>)
                    }
                  </td>
                  <td className='text-center'>
                    {
                      isFinal && (<i className='fa fa-check'></i>)
                    }
                  </td>
                  <td className='text-right'>
                    <ButtonGroup bsStyle='sm'>
                      <Button onClick={this.handleEdit(name)}>
                        <Glyphicon glyph='edit'/>
                        {'\u2000'}
                        {i18n.getMessage('fsmWorkflowEditor.buttons.edit.label')}
                      </Button>
                      <Button onClick={this.handleDelete(name)}>
                        <Glyphicon glyph='trash'/>
                        {'\u2000'}
                        {i18n.getMessage('fsmWorkflowEditor.buttons.delete.label')}
                      </Button>
                    </ButtonGroup>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </Table>

        {modal}
      </div>
    )
  }
}
