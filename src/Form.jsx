import React, { Component } from 'react';
import { getPath, setPath, clone } from 'utils';

import Context from './Context';

class Form extends Component {
  state = {
    initialValues: this.props.initialValues || {},
    values: this.props.initialValues || {}
  };

  componentDidMount() {
    const { formApi } = this.props;
    const { _internal, ...rest } = this.API;
    formApi && formApi(rest);
  }

  fields = {};
  errors = {};
  touched = new Set();

  storeComponent = (name = '', ref) => (this.fields[name] = ref);

  updateComponent = (name = '') => {
    if (this.fields[name]) {
      this.fields[name].forceUpdate();
    } else {
      Object.keys(this.fields).forEach(fieldName => {
        if (fieldName.includes(name)) {
          this.fields[fieldName].forceUpdate();
        }
      });
    }
  };

  updateAllComponents = () => {
    Object.keys(this.fields).map(field => this.updateComponent(field));
  };

  getField = (name = '') => getPath(this.state.values, name);

  getFields = (names = [], path = '') => {
    if (names.length > 0) {
      return names.reduce((values, name) => {
        const fullPath = path ? `${path}.${name}` : name;
        setPath(values, fullPath, this.getField(fullPath));
        return values;
      }, {});
    }

    return this.state.values;
  };

  setField = (name = '', value = '') => {
    const values = clone(this.state.values);
    const currValue = getPath(values, name);

    return new Promise(resolve => {
      if (currValue !== value) {
        setPath(values, name, value);
        this.touched.add(name);

        this.setState({ values }, () => {
          this.updateComponent(name);
          resolve(value);
        });
      }
    });
  };

  setFields = (fields = {}) => {
    for (let path in fields) {
      this.setField(path, fields[path]);
    }
  };

  resetField = (name = '') => {
    this.setField(name, getPath(this.state.initialValues, name));
    this.touched.delete(name);
    this.updateComponent(name);
  };

  resetFields = () => {
    this.setState({ values: this.state.initialValues });
    [...this.touched].forEach(name => this.updateComponent(name));
    this.touched.clear();
  };

  validate = () => {
    const { schema } = this.props;
    const values = this.getFields();
    let isValid = false;

    try {
      isValid = schema.validateSync(values, { abortEarly: false });
    } catch (e) {
      this.errors = e.inner.reduce((acc, err) => ({ ...acc, [err.path]: err.message }), {});
    }

    Object.keys(this.errors).map(name => this.touched.add(name));
    this.updateAllComponents();

    return !!isValid;
  };

  validateField = (name = '') => {
    const { schema } = this.props;
    let isValid = false;

    try {
      isValid = schema.validateSyncAt(name, this.getFields());
      this.errors[name] = '';
    } catch (e) {
      this.errors[name] = e.message;
    }

    return isValid;
  };

  getError = (name = '') => {
    return this.errors[name] || '';
  };

  getErrors = () => {
    return this.errors;
  };

  API = {
    _internal: {
      storeComponent: this.storeComponent,
      updateComponent: this.updateComponent,
      schema: this.props.schema
    },
    values: () => this.getFields(),
    touched: () => [...this.touched],
    isTouched: name => this.touched.has(name),
    getField: this.getField,
    getFields: this.getFields,
    setField: this.setField,
    setFields: this.setFields,
    resetField: this.resetField,
    resetFields: this.resetFields,
    validate: this.validate,
    validateField: this.validateField,
    getError: this.getError,
    getErrors: this.getErrors
  };

  render() {
    return <Context.Provider value={this.API}>{this.props.children}</Context.Provider>;
  }
}

export default Form;
