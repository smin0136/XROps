import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRSensorDataStartAPI, XRSensorDataStopAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';


var gestureTypes = ['Button', 'Air tap','Interval (1s)','Interval (3s)','Interval (5s)',];

export class XRSetGestureControl extends Rete.Control {
  static component = ({ value, onChange }) => {


    var [index,setIndex] = useState(value['gesture']);

    var [gestureList,setGestureList]= useState('');

    console.log("gesture list: ");
    console.log(gestureList);
    console.log(gestureTypes);


    async function generateGestureList(){  
      var newList =gestureTypes.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select gesture type...</option>"]);
      gestureList = newList.join("\n");
      setGestureList(gestureList);
    }


    useEffect(() => {
      generateGestureList();
    }, []);


    return (
      <div>
          <p className="text">Gesture Types</p>
          <div style={{paddingBottom:"5px",paddingLeft:"10px"}}>
            <select 
              value={gestureTypes[value['gesture']]} 
              onChange={(e) => {
                console.log(e);
                index = e.target.selectedIndex;
                setIndex(e.target.selectedIndex);
                onChange({key: value['key'], sensor: value['sensor'], gesture: index-1});
              }}
            

              style={{width: "100%", height: "40px"}}      
              >
              {parse(gestureList)}
            </select>
          </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRSetGestureControl.component;

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
export class XRSetGestureComponent extends Rete.Component {
  constructor() {
    super("Gesture Setting");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRSetGestureControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];

    console.log(input_data);
    if(input_data!==undefined){
      node.data.data['key'] = input_data.key;
      node.data.data['sensor'] = input_data.sensor;
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({key: node.data.data['key'], 
                sensor: node.data.data['sensor'],
                gesture: node.data.data['gesture']});
                

    outputs["data"] = node.data.data;
  }
}
