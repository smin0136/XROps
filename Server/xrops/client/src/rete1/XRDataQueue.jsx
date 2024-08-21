import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRSensorDataStartAPI, XRSensorDataStopAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';




export class XRDataQueueControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    console.log(value);

    var queue = value['queue_data'];
    
    var [sensorData,setSensorData] = useState('');


    async function generateSensorDataList(){  
      var newList = queue.map((x) => `<option>${x}</option>`);
      sensorData = newList.join("\n");
      setSensorData(sensorData);
    }


    useEffect(() => {
      generateSensorDataList();
    }, []);



    return (
      <div>
        <p className="text">Q List: </p>
        <div style={{paddingBottom:"5px",paddingLeft:"10px"}}>
          <select 
            defaultValue={value['path']}
            onChange={(e) => {
              console.log(e);
              value['path'] = e.target.value;
              onChange({queue_data: value['queue_data'],
                        path: value['path']
                      });
            }}
            onClick={() => {
              generateSensorDataList();
            }}
            style={{width: "100%", height: "40px"}}      
            >
            {parse(sensorData)}
          </select>
        </div>

      </div>
    );
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRDataQueueControl.component;

    const initial = node.data[key] || {queue_data: [], path: ''};

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
export class XRDataQueueComponent extends Rete.Component {
  constructor(type) {
    super("Data Storage");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRDataQueueControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];

    console.log(input_data);

    if(input_data!==undefined){
      if("result" in input_data){
        var len = input_data.result.length;
        if(len>0){
          for(let i = 0 ; i < input_data.result.length; i++){
            node.data.data['queue_data'].push(input_data.result[i]);
          }
          input_data.result.splice(0,len);
          if(node.data.data['path']===''){
            node.data.data['path'] = node.data.data['queue_data'][0];
          }
        }
      }
    }

    this.editor.nodes
    .find((n) => n.id == node.id)
    .controls.get("data")
    .setValue({queue_data: node.data.data['queue_data'],
              path: node.data.data['path']});


    var data = {
      path: node.data.data['path']
    };
    outputs["data"] = data;

  }
}
