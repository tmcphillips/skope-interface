import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import { createContainer } from "meteor/react-meteor-data";
import Component from "./component";

import {
  filterMin,
  filterMax,
} from "/imports/ui/consts";

import * as actions from "/imports/ui/actions";

export default createContainer((props) => {
  // props here will have `main`, passed from the router
  // anything we return from this function will be *added* to it.

  const {
    store,
  } = props;
  const {
    workspace: {
      filterValue,
      error: dataRequestError,
      result: dataRequestResult,
      request: dataRequest,
    },
  } = store.getState();
  const dataReady = Boolean(dataRequestResult);

  if (!dataRequest || dataRequest.filterValue !== filterValue) {
    const request = {
      filterValue,
    };

    store.dispatch({
      type: actions.WORKSPACE_NEW_DATA_REQUEST.type,
      request,
    });

    Meteor.call("samples.get", request, (error, result) => {
      store.dispatch({
        type: actions.WORKSPACE_RESOLVE_DATA_REQUEST.type,
        request,
        error,
        result,
      });
    });
  }

  return {
    dataReady,
    data: {
      "type": "FeatureCollection",
      "features": dataReady ? dataRequestResult.items : [],
    },
    filterMin,
    filterMax,
    filterValue,
    channelDistributions: dataReady ? dataRequestResult.distributions : null,
  };
}, Component);