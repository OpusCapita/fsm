import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import {
  Button,
  Modal,
  Table,
  ButtonGroup,
  Glyphicon
} from 'react-bootstrap';
import withConfirmDialog from '../ConfirmDialog';
import './ActionsTable.less';
import ActionInvocationEditor from './ActionInvocationEditor.react';
import { isDef } from '../utils';
import { formatArg, formatLabel, getArgType } from './utils';
import actionPropTypes from './actionPropTypes';

@withConfirmDialog
export default class ActionsTable extends PureComponent {
  static propTypes = {
    transition: PropTypes.shape({
      from: PropTypes.string,
      to: PropTypes.string,
      event: PropTypes.string,
      actions: PropTypes.arrayOf(actionPropTypes)
    }),
    actions: PropTypes.shape({
      paramsSchema: PropTypes.object
    }),
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    exampleObject: PropTypes.object
  }

  static contextTypes = {
    i18n: PropTypes.object.isRequired
  }

  state = {
    transitionActions: this.props.transition.actions || [],
    showEditor: false,
    currentActionIndex: null
  }

  onDelete = index => this.setState(prevState => ({
    transitionActions: prevState.transitionActions.filter((_, i) => i !== index)
  }))

  hasUnsavedChanges = _ => {
    const { transitionActions } = this.state;

    const { transition: { actions = [] } } = this.props;

    return !isEqual(transitionActions, actions)
  }

  handleClose = this._triggerDialog({
    showDialog: this.hasUnsavedChanges,
    confirmHandler: this.props.onClose
  })

  handleDelete = index => this._triggerDialog({
    confirmHandler: _ => this.onDelete(index),
    message: `Do you really want to remove this action?`
  })

  handleSave = _ => this.props.onSave(this.state.transitionActions)

  handleOpenEditor = index => _ => this.setState({
    showEditor: true,
    currentActionIndex: index
  })

  handleCloseEditor = _ => this.setState({
    showEditor: false,
    currentActionIndex: null
  })

  handleSaveAction = index => action => this.setState(prevState => ({
    transitionActions: isDef(index) ?
      prevState.transitionActions.map((ta, i) => i === index ? action : ta) :
      prevState.transitionActions.concat(action)
  }), this.handleCloseEditor)


  render() {
    const { i18n } = this.context;
    const { title, actions } = this.props;
    const { transitionActions, showEditor, currentActionIndex } = this.state;

    let editorModal;

    if (showEditor) {
      let action;

      if (isDef(currentActionIndex)) {
        action = transitionActions[currentActionIndex]
      }

      editorModal = (
        <ActionInvocationEditor
          action={action}
          actions={actions}
          onClose={this.handleCloseEditor}
          exampleObject={this.props.exampleObject}
          transition={this.props.transition}
          onSave={this.handleSaveAction(currentActionIndex)}
        />
      )
    }

    return (
      <Modal
        show={true}
        onHide={this.handleClose}
        dialogClassName="oc-fsm-crud-editor--modal oc-fsm-crud-editor--modal--large"
        backdrop='static'
      >
        <Modal.Header closeButton={true}>
          <Modal.Title>
            {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="oc-fsm-crud-editor--states-editor">
            <Table condensed={true} className="oc-fsm-crud-editor--table-actions">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Parameters</th>
                  <th className='text-right'>
                    <Button
                      bsSize='sm'
                      onClick={this.handleOpenEditor()}
                    >
                      Add
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                  transitionActions.length > 0 ?
                    transitionActions.map(({ name: actionName, params = [] }, index) => (
                      <tr key={`${actionName}-${index}`}>
                        <td style={{ paddingTop: '15px' }}>
                          {formatLabel(actionName)}
                        </td>
                        <td>
                          { params.length > 0 &&
                            <table className="oc-fsm-crud-editor--table-actions-parameters">
                              <tbody>
                                {
                                  params.map(({ name, value }, i) => {
                                    return (
                                      <tr key={`${i}-${name}`}>
                                        <td>{formatLabel(name)}</td>
                                        <td className="parameter-value">
                                          {
                                            formatArg({
                                              i18n,
                                              type: getArgType({
                                                actions,
                                                action: actionName,
                                                param: name
                                              }),
                                              value
                                            })
                                          }
                                        </td>
                                      </tr>
                                    )
                                  })
                                }
                              </tbody>
                            </table>
                          }
                        </td>
                        <td className='text-right'>
                          <ButtonGroup bsStyle='sm'>
                            <Button
                              onClick={this.handleOpenEditor(index)}
                            >
                              <Glyphicon glyph='edit' />
                              {'\u2000'}
                              Edit
                            </Button>
                            <Button
                              onClick={this.handleDelete(index)}
                            >
                              <Glyphicon glyph='trash' />
                              {'\u2000'}
                              Delete
                            </Button>
                          </ButtonGroup>
                        </td>
                      </tr>
                    )) :
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center' }}>
                        No actions specified for this transition. Go ahead and{`\u00A0`}
                        <a
                          onClick={this.handleOpenEditor()}
                          style={{ cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          add new
                        </a>!
                      </td>
                    </tr>
                }
              </tbody>
            </Table>

            {editorModal}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            bsStyle="primary"
            onClick={this.handleSave}
          >
            Ok
          </Button>
          <Button onClick={this.handleClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
