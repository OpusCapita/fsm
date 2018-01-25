import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Viz from 'viz.js';
import isEqual from 'lodash/isEqual';
import './WorkflowGraph.less';

let propTypes = {
  schema: PropTypes.object
};

let defaultProps = {
  schema: null
};

export default
class WorkflowGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      svg: ''
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(this.props.schema, nextProps.schema)) {
      this.renderGraph(nextProps.schema);
    }
  }

  componentDidMount() {
    this.renderGraph(this.props.schema);
  }

  convertSchemaToDotLang(schema) {
    // DOT language used by graphviz: https://graphviz.gitlab.io/_pages/doc/info/lang.html
    let { transitions, initialState, finalStates } = schema;

    let src = '';
    src += `digraph finite_state_machine {\n`;
    src += `\trankdir=LR;\n`;
    src += `\tedge [fontname="Helvetica"];\n`;
    // eslint-disable-next-line max-len
    src += `\tnode [shape = rect fillcolor="#b71c1c" margin="0.2,0.1" color="transparent" fontname="Helvetica" style="rounded,filled"];\n`;
    src += `\t${finalStates.map(state => `"${state}"`).join('')}\n`;
    src += `\tnode [fillcolor="#14892c"];\n`;
    src += `\t"${initialState}"\n`;
    src += `\tnode [fillcolor="#0277bd"];\n`;
    src += transitions
      .filter(({ from, to, event }) => (from !== null && to !== null && event))
      .map(({ from, to, event }) => (`\t"${from}" -> "${to}" [label = "${event}"];`)).join(`\n`);
    src += `}`;

    return src;
  }

  renderGraph = (schema) => {
    let vizSrc = this.convertSchemaToDotLang(schema);
    this.setState({
      svg: Viz(vizSrc, { format: "svg", engine: "dot", totalMemory: 16777216 })
    });
  }

  render() {
    let { schema } = this.props;

    if (!schema) {
      return (
        <div className="oc-fsm-crud-editor--workflow-graph">
          <h4>
            Nothing to visualize
          </h4>
        </div>
      );
    }

    let { svg } = this.state;

    return (
      <div
        className="oc-fsm-crud-editor--workflow-graph"
        dangerouslySetInnerHTML={{ __html: svg }}
      >
      </div>
    );
  }
}

WorkflowGraph.propTypes = propTypes;
WorkflowGraph.defaultProps = defaultProps;
