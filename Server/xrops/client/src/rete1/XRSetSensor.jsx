import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRSensorDataStartAPI, XRSensorDataStopAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';


var sensorTypes = ['Depth Sensor','RGB Camera',];

export class XRSetSensorControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    var [index,setIndex] = useState(value['sensor']);
    var [sensorList,setSensorList]=useState('<option>Select sensor type...</option>');


    async function generateSensorList(){  
      var newList =sensorTypes.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select sensor type...</option>"]);
      sensorList = newList.join("\n");
      setSensorList(sensorList);
    }


    useEffect(() => {
      generateSensorList();
    }, []);


    return (
      <div>
          <p className="text">Sensor Types</p>
          <div style={{paddingBottom:"5px",paddingLeft:"10px"}}>
            <select 
              value={sensorTypes[value['sensor']]} 
              onChange={(e) => {
                console.log(e);
                index = e.target.selectedIndex;
                setIndex(e.target.selectedIndex);
                onChange({key: value['key'], sensor: index-1, gesture: value['gesture']});
              }}

              style={{width: "100%", height: "40px"}}      
              >
              {parse(sensorList)}
            </select>
          </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRSetSensorControl.component;

    const initial = node.data[key] || {key: '', sensor: 0, gesture: 0};

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
export class XRSetSensorComponent extends Rete.Component {
  constructor() {
    super("Sensor Setting");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRSetSensorControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];

    console.log(input_data);

    if(input_data!==undefined){
      node.data.data['key'] = input_data.key;
      node.data.data['gesture'] = input_data.gesture;
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({key: node.data.data['key'], 
                sensor: node.data.data['sensor'],
                gesture: node.data.data['gesture']});

    console.log(node.data.data);

    outputs["data"] = node.data.data;
  }
}
