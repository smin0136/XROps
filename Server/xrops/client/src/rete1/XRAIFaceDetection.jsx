import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRAIFaceDetectionAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';


export class XRAIFaceDetectionControl extends Rete.Control {
  static component = ({ value, onChange }) => {


    const handleProcess = async (e) => {
      var res = await XRAIFaceDetectionAPI(value['input']);
      console.log(res);
      if(res!==-1 && res!==undefined){
        value['path'] = res;
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
    this.component = XRAIFaceDetectionControl.component;

    const initial = node.data[key] || {input: '',path: ''};

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
export class XRAIFaceDetectionComponent extends Rete.Component {
  constructor(type) {
    super("AI Face Detection");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "depth map", textSocket);
    var out1 = new Rete.Output("data", "landmarks", textSocket);
    var ctrl = new XRAIFaceDetectionControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];


    if(input_data!==undefined){
      node.data.data['input'] = input_data.path;
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({input: node.data.data['input'],
                path: node.data.data['path']});
                
    outputs["data"] = node.data.data;
  }
}
