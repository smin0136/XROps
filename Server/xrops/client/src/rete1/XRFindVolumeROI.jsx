import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRSensorDataStartAPI, XRSensorDataStopAPI, XRSensorDataStatusAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';

import Explorer from "./explorer/sensordata-explorer.component";
import SingleSource from '@rsuite/icons/SingleSource';



export class XRFindVolumeROIControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    console.log(value);




    return (
      <div>
          <p className="text">Size</p>
          <div style={{display:"flex", paddingBottom:"5px",paddingLeft:"10px"}}>
            <select
              value={value['size']} 
              onChange={(e) => {
                console.log(e);
                value['size'] = e.target.value;
                onChange(value);
              }}
              style={{width:'95%'}}
            >
              <option>64</option>
              <option>128</option>
              <option>256</option>
            </select>

          </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRFindVolumeROIControl.component;

    const initial = node.data[key] || {size: '64', path: '',id: Date.now().toString(), volume_path:'', prev_size: '0', steps: 0,
                                      gesture_pos: {position: {x: 0.0, y: 0.0, z: 0.0}, rotation: {x: 0.0, y: 0.0, z: 0.0}, scale: {x: 0.0,y: 0.0, z: 0.0}},
                                      marker_pos: {position: {x: 0.0, y: 0.0, z: 0.0}, rotation: {x: 0.0, y: 0.0, z: 0.0}, scale: {x: 0.0,y: 0.0, z: 0.0}}};

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
export class XRFindVolumeROIComponent extends Rete.Component {
  constructor(type) {
    super("Find Volume ROI");

  }

  builder(node) {
    var in1 = new Rete.Input("data1", "volume", textSocket);
    var in2 = new Rete.Input("data2", "gesture pos", textSocket);
    var in3 = new Rete.Input("data3", "marker pos", textSocket);
    var out1 = new Rete.Output("data", "ROI volume", textSocket);
    var ctrl = new XRFindVolumeROIControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addInput(in2).addInput(in3).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data1 = inputs["data1"][0];
    var input_data2 = inputs["data2"][0];
    var input_data3 = inputs["data3"][0];



    if(input_data1!==undefined && input_data2!==undefined && input_data3!==undefined){

      if(node.data.data['volume_path'] !== input_data1.path ||
        checkTransformIdentity(node.data.data['gesture_pos'],input_data2.vis_pos)===false ||
        checkTransformIdentity(node.data.data['marker_pos'],input_data3.result)===false ||
        node.data.data['prev_size'] !== node.data.data['size']
      ){
        var body = {gesture_data: input_data2.vis_pos,
                    marker_data: input_data3.result}
        var response = await API.post(
          "/holoSensor/processing/find_volume_roi/"+ node.data.data['id'] + "/" + node.data.data['size'] + "/" + input_data1.path.split("?step")[0],
          body
        );
        console.log(response);
        node.data.data['steps'] = node.data.data['steps'] + 1;
        node.data.data['path'] = response.data + "?step=" +  node.data.data['steps'].toString();  
      }

      node.data.data['prev_size'] = node.data.data['size']

      node.data.data['volume_path'] = input_data1.path;

      var res = input_data2.vis_pos;
      node.data.data['gesture_pos'] =  {position: {x: res.position.x, y: res.position.y, z: res.position.z}, 
                                        rotation: {x: res.rotation.x, y: res.rotation.y, z: res.rotation.z}, 
                                        scale: {x: res.scale.x,y: res.scale.y, z: res.scale.z}};

      res = input_data3.result;
      node.data.data['marker_pos'] =  {position: {x: res.position.x, y: res.position.y, z: res.position.z}, 
                                        rotation: {x: res.rotation.x, y: res.rotation.y, z: res.rotation.z}, 
                                        scale: {x: res.scale.x,y: res.scale.y, z: res.scale.z}};

    }


    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);


    outputs["data"] = node.data.data;

  }
}


const checkTransformIdentity = (t1,t2) => {
  if(t1.position.x!==t2.position.x || t1.position.y!==t2.position.y || t1.position.z!==t2.position.z){
    return false;
  }
  if(t1.rotation.x!==t2.rotation.x || t1.rotation.y!==t2.rotation.y || t1.rotation.z!==t2.rotation.z){
    return false;
  }
  if(t1.scale.x!==t2.scale.x || t1.scale.y!==t2.scale.y || t1.scale.z!==t2.scale.z){
    return false;
  }
  return true;
}
