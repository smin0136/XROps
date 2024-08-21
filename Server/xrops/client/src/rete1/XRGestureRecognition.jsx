import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRVolumeToPointDataAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder,IconButton } from 'rsuite';
import CheckCircle from '@rsuite/icons/legacy/CheckCircle';

import Viewer from "./xr-viewer/point-viewer.component";


export class XRGestureRecognitionControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    return (
      <div>
          <p className="text">Tracking data type</p>
          <div style={{display:"flex", paddingBottom:"5px",paddingLeft:"10px"}}>
            <select
              value={value['input_type']} 
              onChange={(e) => {
                console.log(e);
                value['input_type'] = e.target.value; 
                onChange(value);
              }}
            >
              <option>Head (front)</option>
              <option>Eye (front)</option>
              <option>Hand (tip)</option>
            </select>

          </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRGestureRecognitionControl.component;

    const initial = node.data[key] || {key: '', type:'value',vis_pos: null, path: '',input:'',input_type:'Head (front)'};

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

export class XRGestureRecognitionComponent extends Rete.Component {
  constructor(type) {
    super("Gesture Recognition");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "sensor data", textSocket);
    var out1 = new Rete.Output("data", "transform", textSocket);
    var ctrl = new XRGestureRecognitionControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];


    if(input_data!==undefined){
      if(node.data.data['input']!==input_data.path){
        var response = await API.get(
          "/holoSensor/processing/sensor/spatial_input/get_position/"+ node.data.data['input_type'] + "/" + input_data.path
        );
        console.log(response);
        node.data.data['vis_pos'] = response.data['data'];  
      }
      node.data.data['input'] = input_data.path;
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);
                

    outputs["data"] = node.data.data;
  }
}
