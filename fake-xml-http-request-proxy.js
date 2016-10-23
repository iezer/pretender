var FakeXMLHttpRequest = require('fake-xml-http-request');

function FakeXMLHttpRequestProxy() {
  console.log('proxy constr');
  FakeXMLHttpRequest.call(this);

  let fakeXHR = this;
  this.xhr = fakeXHR._passthroughRequest = new FakeXMLHttpRequestProxy._nativeRequest();
}

FakeXMLHttpRequestProxy.prototype.createPassthrough = function createPassthrough() {

    // event types to handle on the xhr
  var evts = ['error', 'timeout', 'abort', 'readystatechange'];

  // event types to handle on the xhr.upload
  var uploadEvents = ['progress'];

  // properties to copy from the native xhr to fake xhr
  var lifecycleProps = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];

  if (fakeXHR.responseType === 'arraybuffer') {
    lifecycleProps = ['readyState', 'response', 'status', 'statusText'];
    xhr.responseType = fakeXHR.responseType;
  }

  // Use onload if the browser supports it
  if ('onload' in xhr) {
    evts.push('load');
  }

  // add progress event for async calls
  if (fakeXHR.async && fakeXHR.responseType !== 'arraybuffer') {
    evts.push('progress');
  }

  // update `propertyNames` properties from `fromXHR` to `toXHR`
  function copyLifecycleProperties(propertyNames, fromXHR, toXHR) {
    for (var i = 0; i < propertyNames.length; i++) {
      var prop = propertyNames[i];
      if (fromXHR[prop]) {
        toXHR[prop] = fromXHR[prop];
      }
    }
  }

  // fire fake event on `eventable`
  function dispatchEvent(eventable, eventType, event) {
    eventable.dispatchEvent(event);
    if (eventable['on' + eventType]) {
      eventable['on' + eventType](event);
    }
  }

  // set the on- handler on the native xhr for the given eventType
  function createHandler(eventType) {
    xhr['on' + eventType] = function(event) {
      copyLifecycleProperties(lifecycleProps, xhr, fakeXHR);
      dispatchEvent(fakeXHR, eventType, event);
    };
  }

  // set the on- handler on the native xhr's `upload` property for
  // the given eventType
  function createUploadHandler(eventType) {
    if (xhr.upload) {
      xhr.upload['on' + eventType] = function(event) {
        dispatchEvent(fakeXHR.upload, eventType, event);
      };
    }
  }

  var i;
  for (i = 0; i < evts.length; i++) {
    createHandler(evts[i]);
  }
  for (i = 0; i < uploadEvents.length; i++) {
    createUploadHandler(uploadEvents[i]);
  }

  if (fakeXHR.async) {
    xhr.timeout = fakeXHR.timeout;
    xhr.withCredentials = fakeXHR.withCredentials;
  }
  for (var h in fakeXHR.requestHeaders) {
    xhr.setRequestHeader(h, fakeXHR.requestHeaders[h]);
  }

  this.xhr.open(fakeXHR.method, fakeXHR.url, fakeXHR.async, fakeXHR.username, fakeXHR.password);
}

let proto = new XMLHttpRequest();

// proto.open = function open() {
//   FakeXMLHttpRequest.prototype.open.apply(this, arguments);
//   let fakeXHR = this;
//   this.xhr.open(fakeXHR.method, fakeXHR.url, fakeXHR.async, fakeXHR.username, fakeXHR.password);
// };

proto.send = function send() {
  this.createPassthrough();
  this.xhr.send.apply(xhr, arguments);
};

FakeXMLHttpRequestProxy.prototype.constructor = FakeXMLHttpRequestProxy;
FakeXMLHttpRequestProxy.prototype = proto;

FakeXMLHttpRequestProxy._nativeRequest = XMLHttpRequest;

export default FakeXMLHttpRequestProxy;
