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



export class XRGetSpatialPositionControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    console.log(value);

    var results = value['result'];
    var [last_e,setLast_e] = useState(value['path']);
    var [sensorData,setSensorData] = useState('');
    var [interval1,setInterval1]=useState(null);
    
    async function generateSensorDataList(){  
      sensorData = `<option>${last_e}</option>`;
      setSensorData(sensorData);
//      currentEditor.trigger("process");
    }

    useEffect(() => {
      generateSensorDataList();

      return () =>{
        if(isStarted){
          clearInterval(interval1);
          interval1 = null;
        }
      }
    }, []);

    var [sensorState,setSensorState] = useState('');
    var [stateColor,setStateColor] = useState('red');
    var [isStarted,setIsStarted] = useState(false);

    var [isStopped,setIsStopped] = useState(true);

    const [open, setOpen] = useState(false);


    const handleExplorerOpen = (e) => {
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => setOpen(false);



    const handleStart = async (e) => {
    };

    const handleStop = async (e) => {

    };


    if(isStopped && interval1!==null){
      clearInterval(interval1);
      interval1 = null;
      setInterval1(interval1);
      isStarted=false;
      setIsStarted(false);
    }


    return (
      <div>
          <p className="text">Position from tracking data</p>
          <div style={{display:"flex", paddingBottom:"5px",paddingLeft:"10px"}}>
            <select 
              onClick={() => {
                generateSensorDataList();
              }}
              style={{width: "80%", height: "40px", marginRight: "10px"}}      
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
    this.component = XRGetSpatialPositionControl.component;

    const initial = node.data[key] || {key: '', result: [], path: ''};

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
export class XRGetSpatialPositionComponent extends Rete.Component {
  constructor(type) {
    super("Get Spatial Position");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRGetSpatialPositionControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];



    if(input_data!==undefined){
      node.data.data['key'] = input_data.key;
    }


    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({key: node.data.data['key'], 
                result: node.data.data['result'],
                path: node.data.data['path']
              });


    outputs["data"] = node.data.data;

  }
}
