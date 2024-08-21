import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRFaceDetectionAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';


export class XRFaceDetectionControl extends Rete.Control {
  static component = ({ value, onChange }) => {


    const handleProcess = async (e) => {
      var ROI = await XRFaceDetectionAPI(value['input'],value['input_ROI']);
      console.log(ROI);
      if(ROI!==-1 && ROI!==undefined){
        value['ROI'] = ROI;
        onChange(value);
      }
    }
    return (
      <div>
          <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          }}>
          <Button onClick={handleProcess}><strong>Process</strong></Button>
        </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRFaceDetectionControl.component;

    const initial = node.data[key] || {input: '',path: '',input_ROI: {"xmin": -1 , "xmax": -1, "ymin": -1, "ymax": -1},ROI: {"xmin": -1 , "xmax": -1, "ymin": -1, "ymax": -1}};

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
export class XRFaceDetectionComponent extends Rete.Component {
  constructor(type) {
    super("Face Detection");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRFaceDetectionControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];


    if(input_data!==undefined){
      node.data.data['input'] = input_data.path;
      node.data.data['path'] = input_data.path;
      if("ROI" in input_data){
        node.data.data['input_ROI']=input_data.ROI;
        if(node.data.data['ROI'].xmin===-1){
          node.data.data['ROI']={...input_data.ROI};
        }
      }
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({input: node.data.data['input'],
                path: node.data.data['path'],
                input_ROI: node.data.data['input_ROI'],
                ROI: node.data.data['ROI']});
                

    outputs["data"] = node.data.data;
  }
}
