import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import ObjectInspector from '../../../ObjectInspector.react';
import { unifyPath } from '../../../utils';

export default class ExpressionEditor extends PureComponent {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    currentPath: PropTypes.string
  }

  static contextTypes = {
    objectConfiguration: PropTypes.object.isRequired
  }

  handleClick = ({ path }) => this.props.onSelect(unifyPath(path))

  render() {
    const {
      objectConfiguration: {
        alias = 'object',
        example
      }
    } = this.context;

    const { currentPath } = this.props;

    return (
      <Modal
        show={true}
        onHide={this.props.onClose}
        dialogClassName="oc-fsm-crud-editor--modal"
        backdrop='static'
      >
        <Modal.Header closeButton={true}>
          <Modal.Title>
            Choose property of {alias}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ObjectInspector
            name={alias}
            object={example}
            onClickPropName={this.handleClick}
            showValues={false}
            currentPath={currentPath}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.onClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
