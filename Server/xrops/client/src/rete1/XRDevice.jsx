import Rete from "rete";
import { Panel, PanelGroup, Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';
import { textSocket } from "./rete";
import { findDOMNode } from "react-dom";
import DeviceIcon from '@rsuite/icons/Device';
import { Line, Circle } from 'rc-progress';
import { useState } from "react";
import {XRDeviceConnectAPI , XRDeviceDisconnectAPI} from "./api"

export class XRDeviceControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    var [hostip,setHostip] = useState(value.ip);
    var [port,setPort] = useState(value.port);

    var [connectState,setConnectState] = useState('');
    var [isConnected,setIsConnected] = useState(false);


    const handleSetIP = (e) => {
      console.log(e);
      hostip = e.target.value;
      setHostip(e.target.value);
      console.log(hostip);
      onChange({ip: hostip,
        port: port,});
    };
    const handleSetPort = (e) => {
      console.log(e);
      port = e.target.value;
      setPort(e.target.value);
      console.log(port);
      onChange({ip: hostip,
        port: port,});
    };

    const handleConnect = async (e) => {
      console.log(hostip);
      console.log(port);
      var res = await XRDeviceConnectAPI(hostip, port);
      console.log(res);
      if(res===1){
        setIsConnected(true);
        setConnectState('');
      }
      else{
        setIsConnected(false);
        setConnectState('failed');
      }
      // var res = await XRConnectAPI(hostip, port);
      // console.log(res);
      // connectState = res;
    };

    const handleDisconnect = async (e) => {
      var res = await XRDeviceDisconnectAPI(hostip, port);
      console.log(res);
      if(res===1){
        setIsConnected(false);
        setConnectState('');
      }
      else{
        setConnectState('failed');
      }

      // var res = await XRConnectAPI(hostip, port);
      // console.log(res);
      // connectState = res;
    };

    if(isConnected){
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p className="text">Username</p>
          <input className="textEdit"
            type="text"
            placeholder="name"
            onChange={handleSetIP}
            defaultValue={hostip}
            disabled="true"
          />
          <p className="text">Password</p>
          <input className="textEdit"
            type="text"
            placeholder="000000"
            onChange={handleSetPort}
            defaultValue={port}
            disabled="true"
          />

          <div style={{ display: "flex", flexDirection: "row",marginTop: "20px", marginLeft: "10px"}}>
            <div style={{ marginRight: "10px" }}>
            <Button appearance="default" disabled="true">
              Connect 
            </Button>
            </div>
            <Button onClick={handleDisconnect} appearance="default">
              Disconnect 
            </Button>
            <label style={{color: "red", marginLeft: "10px", marginTop: "3px", fontWeight: "700", fontSize: "12px" }}>{connectState}</label>
          </div>
        </div>
      );
    }
    else{
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p className="text">Username</p>
          <input className="textEdit"
            type="text"
            placeholder="name"
            onChange={handleSetIP}
            defaultValue={hostip}
          />
          <p className="text">Password</p>
          <input className="textEdit"
            type="text"
            placeholder="000000"
            onChange={handleSetPort}
            defaultValue={port}
          />

          <div style={{ display: "flex", flexDirection: "row",marginTop: "20px", marginLeft: "10px"}}>
            <div style={{ marginRight: "10px" }}>
            <Button onClick={handleConnect} appearance="default" >
              Connect 
            </Button>
            </div>
            <Button appearance="default" disabled="true">
              Disconnect 
            </Button>
            <label style={{color: "red", marginLeft: "10px", marginTop: "3px", fontWeight: "700", fontSize: "12px" }}>{connectState}</label>
          </div>
        </div>
      );
    }
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRDeviceControl.component;

    const initial = node.data[key] || {hostip: '', port: ''};

    console.log(key);
    console.log(node.data[key]);

    node.data[key] = initial;
    this.props = {
      readonly,
      value: initial,
      onChange: (v) => {
        this.setValue(v);
        this.emitter.trigger("process");
      },
    };
  }

  setValue(val) {
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }
}
export class XRDeviceComponent extends Rete.Component {
  constructor() {
    super("XR Device Connector");

  }

  builder(node) {
    var ctrl = new XRDeviceControl(this.editor, "data", node);
    return node.addControl(ctrl);
  }

  async worker(node, inputs, outputs) {
  }
}
