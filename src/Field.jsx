import React, { Component } from 'react';
import Context from './Context';

class Field extends Component {
  handleChange(value, Form) {
    const { name, normalize, onChange, validate = true, update = [] } = this.props;
    const { _internal, ...formApi } = Form;

    if (normalize) {
      value = normalize(value);
    }

    formApi.setField(name, value);
    if (validate) {
      formApi.validateField(name);
    }
    _internal.updateComponent(name);
    update.map((fieldName) => _internal.updateComponent(fieldName));
    onChange && onChange(value, formApi);
  }

  render() {
    const { name, render, normalize, onChange, validate, disabled = false, ...rest } = this.props;
    const Component = render;

    return (
      <Context.Consumer>
        {(Form) => {
          const { getField, getError, isTouched, _internal } = Form;
          const { storeComponent, isFieldVisible, isFieldDisabled } = _internal;
          storeComponent(name, this);

          if (!isFieldVisible(name)) {
            return null;
          }

          return (
            <Component
              {...rest}
              error={getError(name)}
              name={name}
              value={getField(name)}
              touched={isTouched(name)}
              onChange={(value) => this.handleChange(value, Form)}
              disabled={isFieldDisabled(name) || disabled}
            />
          );
        }}
      </Context.Consumer>
    );
  }
}

export default Field;
