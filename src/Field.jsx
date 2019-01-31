import React, { Component } from 'react';
import Context from './Context';

class Field extends Component {
  handleChange(value, Form) {
    const { name, normalize, onChange } = this.props;

    if (normalize) {
      value = normalize(value);
    }

    Form.setField(name, value).then(() => {
      Form.validateField(name);
      Form._internal.updateComponent(name);
      onChange && onChange(value);
    });
  }

  render() {
    const { name, render, normalize, onChange, ...rest } = this.props;
    const Component = render;

    return (
      <Context.Consumer>
        {Form => {
          const { storeComponent } = Form._internal;
          storeComponent(name, this);

          return (
            <Component
              {...rest}
              error={Form.getError(name)}
              name={name}
              value={Form.getField(name)}
              touched={Form.isTouched(name)}
              onChange={value => this.handleChange(value, Form)}
            />
          );
        }}
      </Context.Consumer>
    );
  }
}

export default Field;
