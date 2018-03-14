import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import find from 'lodash/find';
import cloneDeep from 'lodash/cloneDeep';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import Tabs from 'react-bootstrap/lib/Tabs';
import Tab from 'react-bootstrap/lib/Tab';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import FormControl from 'react-bootstrap/lib/FormControl';
import Table from 'react-bootstrap/lib/Table';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import guardPropTypes from './guardPropTypes';
import withConfirmDialog from '../ConfirmDialog';
import CodeEditor from '../CodeEditor';
import ErrorLabel from '../ErrorLabel.react';
import ObjectInspector from '../ObjectInspector.react';
import ParamsEditor from '../ParamsEditor';
import { formatLabel, isDef, unifyPath, omitIfEmpty } from '../utils';

const evaluateCode = ({ code, arg }) => {
  try {
    const result = (
      eval( // eslint-disable-line no-eval
        `
          (function(arg) {
            ${Object.keys(arg).map(key => `var ${key} = arg[${JSON.stringify(key)}];`).join('\n')}
            return (${code})
          })
        `
      )(arg)
    );

    return typeof result === 'boolean' ?
      String(result) :
      new Error(
        `Function returned:
        ${String(result)} of type '${typeof result}',
        but expected a boolean value.`
      )
  } catch (err) {
    return err
  }
}

@withConfirmDialog
export default class GuardEditor extends PureComponent {
  static propTypes = {
    guard: guardPropTypes,
    conditions: PropTypes.shape({
      paramsSchema: PropTypes.object
    }),
    componentsRegistry: PropTypes.objectOf(PropTypes.func),
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired
  }

  static contextTypes = {
    objectConfiguration: PropTypes.object.isRequired
  }

  state = {
    guard: this.props.guard || {},
    exampleObject: this.context.objectConfiguration.example,
    autoplay: true,
    guardEditorSelectorPos: {
      line: 0,
      ch: 0
    },
    activeTab: (this.props.guard || {}).expression ? 2 : 1
  }

  componentDidMount() {
    if (this.state.autoplay) {
      this.handleEvalCode()
    }
  }

  hasUnsavedChanges = _ => {
    const { guard, activeTab } = this.state;
    const params = (guard.params || []).
      map(omitIfEmpty('expression')).
      filter(({ value }) => isDef(value));
    const cmpStateGuard = { ...guard };
    delete cmpStateGuard.params;
    if (params && params.length) {
      cmpStateGuard.params = params;
    }
    const cmpPropsGuard = {
      ...this.props.guard,
      ...((this.props.guard || {}).params && { params: this.props.guard.params.map(omitIfEmpty('expression')) })
    }
    return this.props.guard ?
      !isEqual(cmpStateGuard, cmpPropsGuard) &&
      !(activeTab === 1 && !guard.name && this.props.guard.expression) :
      Object.keys(guard).length
  }

  handleClose = this._triggerDialog({
    showDialog: this.hasUnsavedChanges,
    confirmHandler: this.props.onClose
  })

  handleSave = _ => this.props.onSave(this.state.guard)

  handleCursorActivity = cm => this.setState({
    guardEditorSelectorPos: cm.doc.sel.ranges[0].anchor
  })

  handleObjectPropClick = ({ path }) => {
    const { alias } = this.context.objectConfiguration;
    const {
      guardEditorSelectorPos: {
        line,
        ch
      },
      guard
    } = this.state;

    const workablePath = unifyPath(path);
    const injectedValue = `${alias || 'object'}${workablePath}`

    const { expression } = guard;
    const newGuardBody = (expression || '').split('\n').map(
      (bodyLine, index) => index === line ?
        bodyLine.slice(0, ch) + injectedValue + bodyLine.slice(ch) :
        bodyLine
    ).join('\n');

    const callback = _ => {
      // handle codemirror focus and cursor position
      const cm = this._editor.getCodeMirror();
      cm.focus();
      // focus resets cursor to 0; fix it
      const int = setInterval(_ => { // eslint-disable-line no-undef
        const hasFocus = cm.hasFocus()
        if (hasFocus) {
          cm.setCursor(line, ch + injectedValue.length)
          clearInterval(int) // eslint-disable-line no-undef
        }
      }, 10)
    }

    this.handleChangeExpression(newGuardBody, callback);
  }

  _editor;
  saveRef = el => this._editor = el; // eslint-disable-line no-return-assign

  handleToggleAutoplay = _ => this.setState(prevState => ({
    autoplay: !prevState.autoplay
  }), this.autoPlay)

  autoPlay = _ => this.state.autoplay && this.handleEvalCode()

  handleEvalCode = _ => {
    const { alias } = this.context.objectConfiguration;
    const { expression: code } = this.state.guard;
    const object = cloneDeep(this.state.exampleObject);

    const result = code ?
      evaluateCode({
        code,
        arg: {
          object,
          ...(alias && { [alias]: object })
        }
      }) :
      null;

    const isError = result instanceof Error;

    return this.setState(prevState => ({
      isError,
      result: isError ? result.message : result
    }))
  }

  handleChangeExpression = (value, callback) => this.setState(prevState => ({
    guard: { ...prevState.guard, expression: value }
  }), _ => {
    if (callback) {
      callback()
    }
    this.autoPlay()
  })

  handleCleanExpression = _ => this.setState(prevState => ({
    guard: { ...prevState.guard, expression: '' }
  }), this.autoPlay)

  getParam = name => find(
    (this.state.guard.params || []),
    ({ name: paramName }) => paramName === name
  ) || {};

  handleChangeParam = param => ({ value, expression }) => this.setState(prevState => ({
    guard: {
      ...prevState.guard,
      params: (
        // either change existing param or add a new one
        params => find(params, ({ name }) => name === param) ? params : params.concat({ name: param })
      )(prevState.guard.params || []).map(
        ({ name, ...rest }) => ({
          name,
          ...rest,
          ...(param === name && {
            value: (this.props.conditions[this.state.guard.name] || {}).type === 'boolean' && !expression ?
              !(find((prevState.guard.params || []), ({ name: n }) => n === name) || {}).value :
              value,
            expression
          })
        })
      )
    }
  }))

  handleSelectCondition = ({ target: { value } }) => this._triggerDialog({
    showDialog: _ => {
      const { name: pName, params: propParams = [] } = this.props.guard || {};
      const { name: sName, params: stateParams = [] } = this.state.guard;

      return pName === sName ?
        !isEqual(propParams, stateParams) ||
        stateParams.some(
          ({ name, value }) => !find(propParams, ({ name: paramName }) => name === paramName) && isDef(value)
        ) :
        stateParams.some(({ value }) => isDef(value))
    },
    confirmHandler: _ => this.setState(prevState => ({
      guard: {
        ...prevState.guard,
        name: value,
        params: value ?
          value === (this.props.guard || {}).name ?
            ((this.props.guard || {}).params || []) :
            Object.keys(
              (this.props.conditions[value].paramsSchema || {}).properties || {}
            ).map(name => ({ name })) :
          []
      }
    }))
  })(value)

  handleTabSelect = nextTab => this._triggerDialog({
    showDialog: _ => {
      const { guard: { name: pn = '', params: pp = [], expression: pe = '' } = {} } = this.props;
      const { guard: { name: sn = '', params: sp = [], expression: se = '' } } = this.state;
      if (
        (nextTab === 1 && (pe ? pe !== se : se)) ||
        (nextTab === 2 && !isEqual(pn ? { name: pn, params: pp } : { name: '', params: [] }, { name: sn, params: sp }))
      ) {
        return true
      }
      return false
    },
    confirmHandler: _ => this.setState(prevState => ({
      activeTab: nextTab,
      guard: nextTab === 1 ?
        // predefined function
        {
          name: (this.props.guard || {}).name || '',
          params: (this.props.guard || {}).params || [],
        } :
        // expression
        {
          expression: (this.props.guard || {}).expression || ''
        }
    }), nextTab === 2 && this.autoPlay)
  })(nextTab)

  render() {
    const { objectConfiguration: { alias } } = this.context;

    const {
      conditions = {},
      componentsRegistry = {}
    } = this.props;

    const {
      guard,
      autoplay,
      exampleObject,
      isError,
      result,
      activeTab
    } = this.state;

    return (
      <Modal
        show={true}
        onHide={this.handleClose}
        dialogClassName="oc-fsm-crud-editor--modal"
        backdrop='static'
      >
        <Modal.Header closeButton={true}>
          <Modal.Title>
            {guard ? 'Edit guard' : 'Add guard'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            animation={false}
            id="fsm-workflow-editor-guards"
            mountOnEnter={true}
            unmountOnExit={true}
            activeKey={activeTab}
            onSelect={this.handleTabSelect}
          >
            <Tab eventKey={1} title={(<h4>Predefined function</h4>)}>
              <Table className="oc-fsm-crud-editor--table-actions">
                <thead>
                  <tr>
                    <th>
                      <div className="oc-fsm-crud-editor--modal-heading">
                        <div className="output-heading">
                          <b>Choose condition</b>
                          <div className='right-block'>
                            <FormControl
                              componentClass="select"
                              value={guard.name || ''}
                              onChange={this.handleSelectCondition}
                            >
                              <option value=""></option>
                              {
                                Object.keys(conditions).map((name, i) => (
                                  <option key={`${i}-${name}`} value={name}>{formatLabel(name)}</option>
                                ))
                              }
                            </FormControl>
                          </div>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {
                        conditions[guard.name] &&
                        (
                          <ParamsEditor
                            paramsSchema={conditions[guard.name].paramsSchema}
                            params={
                              Object.keys(conditions[guard.name].paramsSchema.properties).reduce(
                                (acc, cur) => ({ ...acc, [cur]: this.getParam(cur) }), {}
                              )
                            }
                            onChangeParam={this.handleChangeParam}
                            componentsRegistry={componentsRegistry}
                          />
                        )
                      }
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Tab>
            <Tab eventKey={2} title={(<h4>Expression</h4>)}>
              <Row>
                <Col sm={8}>
                  <Row>
                    <Col style={{ margin: '0 10px 0' }}>
                      <div style={{ marginTop: '10px' }}>
                        <CodeEditor
                          className="guard-code"
                          value={guard.expression}
                          options={{
                            mode: "javascript",
                            lineNumbers: true,
                            theme: "eclipse",
                            placeholder: `Enter JavaScript code here`
                          }}
                          onChange={this.handleChangeExpression}
                          onCursorActivity={this.handleCursorActivity}
                          ref={this.saveRef}
                        />
                      </div>
                      <Glyphicon
                        glyph='remove'
                        style={{
                          position: 'absolute',
                          right: '22px',
                          top: '22px',
                          cursor: 'pointer',
                          zIndex: '2'
                        }}
                        onClick={this.handleCleanExpression}
                      />
                      <ErrorLabel {...(isError && { error: result }) } />
                    </Col>
                  </Row>
                  <Row>
                    <Col style={{ margin: '0 10px 0' }}>
                      <div className="oc-fsm-crud-editor--modal-heading">
                        <div className="output-heading">
                          <b>Results</b>
                          <div className='right-block'>
                            <div>
                              <Glyphicon
                                glyph='play'
                                style={{
                                  ...(autoplay ? { color: '#ddd' } : { cursor: 'pointer' })
                                }}
                                {...(!autoplay && { onClick: this.handleEvalCode }) }
                              />
                            </div>
                            <Checkbox
                              onChange={this.handleToggleAutoplay}
                              checked={!!autoplay}
                            >
                              Autoplay
                            </Checkbox>
                          </div>
                        </div>
                      </div>
                      <CodeEditor
                        className="output-code"
                        value={(!isError && result) || ''}
                        options={{
                          theme: "eclipse",
                          lineWrapping: true,
                          readOnly: 'nocursor'
                        }}
                      />
                    </Col>
                  </Row>
                </Col>
                <Col sm={4} >
                  <div className="oc-fsm-crud-editor--modal-heading with-padding">
                    <b>Example object</b>
                  </div>
                  <div>
                    <ObjectInspector
                      name={alias || 'object'}
                      object={exampleObject}
                      onClickPropName={this.handleObjectPropClick}
                    />
                  </div>
                  <HelpBlock>
                    Click on a property to insert its reference into JavaScript Expression editor.
                  </HelpBlock>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button
            bsStyle='primary'
            onClick={this.handleSave}
            disabled={
              !!(isError && guard.expression) ||
              activeTab === 1 && !guard.name ||
              activeTab === 2 && !guard.expression
            }
          >
            Ok
          </Button>
          <Button onClick={this.handleClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
