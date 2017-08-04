import React from 'react';
import { Button } from 'muicss/react';
import Navbar from '/imports/ui/components/navbar/container';

import {
  demoRepository,
} from '/package.json';

export default class MainLayout extends React.Component {
  render() {
    const {
      store,
      body,
      helpUrl,
    } = this.props;

    return (
      <div className="page layout-main">
        <div className="page__header">
          <p>Some header</p>
          <Navbar store={store} />
        </div>
        <div className="page__body">
          {body}
        </div>
        <div className="page__footer">
          <a href={helpUrl}>
            <Button color="primary" size="small">Help</Button>
          </a>
          <a href={demoRepository} target="_blank">Source code on Github</a>
        </div>
      </div>
    );
  }
}
