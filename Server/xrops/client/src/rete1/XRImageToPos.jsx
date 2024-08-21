import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder,IconButton } from 'rsuite';
import CheckCircle from '@rsuite/icons/legacy/CheckCircle';

import { XRImageToPosAPI } from "./api";

var posTypes = ['lefttop', 'righttop','leftbottom','rightbottom'];

export class XRImageToPosControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    var [type,setType] = useState(value['type']);
    var [typeList,setTypeList]= useState('');

    async function generateTypeList(){  
      var newList =posTypes.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select location type...</option>"]);
      typeList = newList.join("\n");
      setTypeList(typeList);
    }
    useEffect(() => {
      generateTypeList();
    }, []);

    const handleProcess = async (e) => {
      var pos = await XRImageToPosAPI(value['input'],value['ROI'],value['type']);
      if(pos!==-1 && pos!==undefined){
        value['vis_pos']['position'] = pos;
        onChange(value);
      }
    }

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <div>
          <p className="text">Location Type</p>
          <div style={{paddingBottom:"5px",paddingLeft:"10px"}}>
            <select 
              value={value['type']} 
              onChange={(e) => {
                value['type'] = e.target.value;
                onChange(value);
              }}
              style={{width: "100%", height: "40px"}}      
              >
              {parse(typeList)}
            </select>
          </div>
        </div>
        <span style={{paddingBottom: "10px"}} />
        <Button style={{width: "100%"}} onClick={handleProcess}><strong>Process</strong></Button>
        <p className="text">{JSON.stringify(value['vis_pos']['position'])}</p>

      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRImageToPosControl.component;

    const initial = node.data[key] || {input: '', ROI: {"xmin": -1 , "xmax": -1, "ymin": -1, "ymax": -1}
                                      , type: '',vis_pos: {position: {x: 0.0, y: 0.0, z: 0.0}}};

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
export class XRImageToPosComponent extends Rete.Component {
  constructor(type) {
    super("Depth to Position");
  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRImageToPosControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];


    if(input_data!==undefined){
      node.data.data['input']=input_data['path'];
      node.data.data['ROI']=input_data['ROI'];
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);
              
    outputs["data"] = node.data.data;
  }
}
