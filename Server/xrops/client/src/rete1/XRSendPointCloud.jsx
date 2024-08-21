import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRSendPointCloudAPI, XRListAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';



export class XRSendPointCloudControl extends Rete.Control {
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

    console.log(value);

    const handleSend = async (e) => {
      var res = await XRSendPointCloudAPI(value['key'],value['path']);
    }
    return (
      <div>
          <div style={{
          display: "flex",
          flexDirection: "column"
          }}>
          <p className="text">Connected device</p>
          <div style={{paddingBottom:"15px"}}>
            <select 
              value={value['device']} 
              onChange={(e) => {
                console.log(e);
                device=e.target.value;
                setDevice(e.target.value);
                onChange({key: value['key'], sensor: value['sensor'], gesture: value['gesture'],
                          result: value['result'], path: value['path'],device: device});
              }}
              onClick={() => {
                getDeviceList();
              }}
              style={{width: "100%", height: "40px"}}      
              >
              {parse(devices)}
            </select>
          </div>
          <Button onClick={handleSend}><strong>Send</strong></Button>
        </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRSendPointCloudControl.component;

    const initial = node.data[key] || {key: '', sensor: 0, gesture: 0,result: [],path: '', device: ''};

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
export class XRSendPointCloudComponent extends Rete.Component {
  constructor(type) {
    super("Send Point Cloud");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var ctrl = new XRSendPointCloudControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];

    console.log(input_data);


    if(input_data!==undefined){
      node.data.data['key'] = input_data.key;
      node.data.data['sensor'] = input_data.sensor;
      node.data.data['gesture'] = input_data.gesture;
      node.data.data['result'] = input_data.result;
      node.data.data['path'] = input_data.path;
    }


    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({key: node.data.data['key'], 
                sensor: node.data.data['sensor'],
                gesture: node.data.data['gesture'],
                result: node.data.data['result'],
                path: node.data.data['path'],
                device: node.data.data['device']});


  }
}
