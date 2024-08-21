import Rete from "rete";
import parse from "html-react-parser";
import {textSocket, currentEditor} from "./rete";
import {
  getTaskStatus,
  getFilesAPI

} from "./api";
import { useEffect, useState } from "react";

import { XRListAPI } from "./api";

import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';



export class XRInputControl extends Rete.Control {

  static component = ({ value, onChange }) => {

    var [deviceList,setDeviceList] = useState(["Select device..."]);
    var [device,setDevice] = useState(value['device']);
    var [devices,setDevices] = useState('<option>Select device...</option>');

    async function getDeviceList(){
      const data = await XRListAPI();
//      deviceList = data.map((a) => a.file_id);
      deviceList = data;
      deviceList.splice(0,0,["Select device..."]);
  
      var newList = deviceList.map((x) => `<option>${x}</option>`);
      devices = newList.join("\n");
      setDevices(devices);
      currentEditor.trigger("process");
      setDeviceList(deviceList);
    }
    
    useEffect(() => {
      getDeviceList();
    }, []);

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <p className="text">Connected device</p>
        <div style={{paddingBottom:"5px",paddingLeft:"10px"}}>
          <select 
            value={value['device']} 
            onChange={(e) => {
              console.log(e);
              device=e.target.value;
              setDevice(e.target.value);
              currentEditor.trigger("process");
              onChange({device: device});
            }}
            onClick={() => {
              getDeviceList();
            }}
            style={{width: "100%", height: "40px"}}      
            >
            {parse(devices)}
          </select>
        </div>
      </div>
    );

  };

  constructor(emitter, key, node, readonly = false) {
    super(key);


    this.emitter = emitter;
    this.key = key;
    this.component = XRInputControl.component;

    const initial = node.data[key] || {device: ''};
//    console.log(initial);

    node.data[key] = initial;
    this.props = {
      readonly,
      value: initial,
      onChange: async (v) => {
        this.setValue(v);
      },
    };
  }

  setValue(val) {
    // console.log(val);
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }



}

export class XRInputComponent extends Rete.Component {
  constructor() {
    super("XR Input");
  }

  builder(node) {
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRInputControl(this.editor, "data", node);

    return node.addControl(ctrl).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
//    console.log(node.data.data);

    this.editor.nodes
    .find((n) => n.id == node.id)
    .controls.get("data")
    .setValue({device: node.data.data["device"]});

    var data = {
      key: node.data.data["device"],
      sensor: -1,
      gesture: -1,
    };
    outputs["data"]=data;
    console.log(data);
  }
}
