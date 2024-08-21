import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder,IconButton } from 'rsuite';
import CheckCircle from '@rsuite/icons/legacy/CheckCircle';


var posTypes = ['object-link', 'axis-link','value'];

export class XRVisPositionControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    var [type,setType] = useState(value['type']);
    var [typeList,setTypeList]= useState('');

    async function generateTypeList(){  
      var newList =posTypes.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select position type...</option>"]);
      typeList = newList.join("\n");
      setTypeList(typeList);
    }
    useEffect(() => {
      generateTypeList();
    }, []);


    return (
      <div>
          <p className="text">Position Type</p>
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
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRVisPositionControl.component;

    const initial = node.data[key] || {type: 'none',id: '',vis_pos: {position: {x: 0.0, y: 0.0, z: 0.0}}};

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
export class XRVisPositionComponent extends Rete.Component {
  constructor(type) {
    super("Vis Linking");
  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRVisPositionControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];


    if(input_data!==undefined){
      if("id" in input_data){
        node.data.data["id"] = input_data.id;
      }
      if("vis_pos" in input_data){
        node.data.data["vis_pos"]["position"]["x"] = input_data["vis_pos"]["position"]["x"];
        node.data.data["vis_pos"]["position"]["y"] = input_data["vis_pos"]["position"]["y"];
        node.data.data["vis_pos"]["position"]["z"] = input_data["vis_pos"]["position"]["z"];
      }
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);
                

    outputs["data"] = node.data.data;
  }
}
