import React, { Component } from 'react';
import { getPath, setPath, clone } from 'utils';

import Context from './Context';

class Form extends Component {
  constructor(props) {
    super(props);
    const { initialValues = {} } = this.props;

    this.values = initialValues;
    this.initialValues = initialValues;
    this.resolveConditions();
  }

  componentDidMount() {
    const { formApi } = this.props;
    const { _internal, ...rest } = this.API;
    formApi && formApi(rest);
  }

  values = {};
  fields = {};
  errors = {};
  hidden = [];
  disabled = [];
  touched = new Set();

  storeComponent = (name = '', ref) => (this.fields[name] = ref);

  updateComponent = (name = '') => {
    if (this.fields[name]) {
      this.fields[name].forceUpdate();
    } else {
      Object.keys(this.fields).forEach((fieldName) => {
        if (fieldName.includes(name)) {
          this.fields[fieldName].forceUpdate();
        }
      });
    }
  };

  updateAllComponents = () => {
    Object.keys(this.fields).map((field) => this.updateComponent(field));
  };

  getField = (name = '') => getPath(this.values, name);

  getFields = (names = [], path = '') => {
    if (names.length > 0) {
      return names.reduce((values, name) => {
        const fullPath = path ? `${path}.${name}` : name;
        setPath(values, fullPath, this.getField(fullPath));
        return values;
      }, {});
    }

    return this.values;
  };

  resolveConditions = (conditions = []) => {
    if (conditions.length === 0 && this.props.conditions) {
      conditions = this.props.conditions;
    }

    conditions.forEach(({ name, target, action, compare }) => {
      const value = this.values[name];
      target = Array.isArray(target) ? target : [target];

      if (action === 'hide') {
        if (compare(value, this.values)) {
          this.hidden = [...this.hidden, ...target];
        } else {
          this.hidden = this.hidden.filter((field) => !target.includes(field));
        }

        target.forEach((t) => this.updateComponent(t));
      } else if (action === 'disable') {
        if (compare(value, this.values)) {
          this.disabled = [...this.disabled, ...target];
        } else {
          this.disabled = this.disabled.filter((field) => !target.includes(field));
        }

        target.forEach((t) => this.updateComponent(t));
      }
    });
  };

  setField = (name = '', value = '') => {
    const { onFormChange, conditions = [] } = this.props;
    const fieldConditions = conditions.filter((condition) => name === condition.name);

    const values = clone(this.values);
    const currValue = getPath(values, name);

    if (currValue !== value) {
      setPath(values, name, value);
      this.touched.add(name);

      this.values = values;
      this.updateComponent(name);
      this.resolveConditions(fieldConditions);
      onFormChange && onFormChange(name, value);
    }
  };

  setFields = (fields = {}) => {
    for (let path in fields) {
      this.setField(path, fields[path]);
    }
  };

  resetField = (name = '') => {
    this.setField(name, getPath(this.initialValues, name));
    delete this.errors[name];
    this.touched.delete(name);
    this.updateComponent(name);
  };

  resetFields = () => {
    this.values = this.initialValues;
    this.errors = {};
    [...this.touched].forEach((name) => this.updateComponent(name));
    this.touched.clear();
    this.resolveConditions();
  };

  clearFields = () => {
    this.values = {};
    [...this.touched].forEach((name) => this.updateComponent(name));
    this.touched.clear();
    this.resolveConditions();
  };

  validate = () => {
    const { schema } = this.props;
    const values = this.getFields();
    let isValid = false;

    try {
      isValid = schema.validateSync(values, { abortEarly: false });
    } catch (e) {
      this.errors = e.inner.reduce((acc, { message, path }) => {
        let error = message;
        let errorKey = path;

        if (path.split('.').length > 1) {
          const [_, key, index, subkey] = path.match(/(\w+)\[(\d+)\]\.(\w+)/);
          errorKey = key;
          error = {
            key: subkey,
            index: parseInt(index),
            message,
          };
        }

        return { ...acc, [errorKey]: error };
      }, {});
    }

    Object.keys(this.errors).map((name) => this.touched.add(name));
    this.updateAllComponents();

    return !!isValid;
  };

  validateField = (name = '') => {
    const { schema } = this.props;
    let isValid = false;

    try {
      isValid = schema.validateSyncAt(name, this.getFields());
      this.errors[name] = '';
    } catch ({ message, path }) {
      if (path.split('.').length > 1) {
        const [_, index, key] = path.match(/\w+\[(\d+)\]\.(\w+)/);
        this.errors[name] = {
          key,
          index: parseInt(index),
          message,
        };
      } else {
        this.errors[name] = message;
      }
    }

    return isValid;
  };

  getError = (name = '') => {
    return this.errors[name] || '';
  };

  getErrors = () => {
    return this.errors;
  };

  resetTouched = () => {
    this.touched.clear();
  };

  getTouchedValues = () => {
    const values = this.getFields();
    const touched = [...this.touched];

    return touched.reduce((acc, field) => ({ ...acc, [field]: values[field] }), {});
  };

  isFieldVisible = (name) => {
    return !this.hidden.includes(name);
  };

  isFieldDisabled = (name) => {
    return this.disabled.includes(name);
  };

  API = {
    _internal: {
      storeComponent: this.storeComponent,
      updateComponent: this.updateComponent,
      schema: this.props.schema,
      isFieldVisible: this.isFieldVisible,
      isFieldDisabled: this.isFieldDisabled,
    },
    values: () => this.getFields(),
    touched: () => [...this.touched],
    isTouched: (name) => this.touched.has(name),
    getField: this.getField,
    getFields: this.getFields,
    setField: this.setField,
    setFields: this.setFields,
    resetField: this.resetField,
    resetFields: this.resetFields,
    validate: this.validate,
    validateField: this.validateField,
    getError: this.getError,
    getErrors: this.getErrors,
    resetTouched: this.resetTouched,
    clearFields: this.clearFields,
    getTouchedValues: this.getTouchedValues,
  };

  render() {
    return <Context.Provider value={this.API}>{this.props.children}</Context.Provider>;
  }
}

export default Form;
