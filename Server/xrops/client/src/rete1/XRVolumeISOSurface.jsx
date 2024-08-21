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
// import Slider from '@mui/material/Slider';
import { Slider, RangeSlider } from 'rsuite';

export class XRVolumeISOSurfaceControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    console.log(value);

    const [iso,setISO] = useState(value['isovalue']);

    useEffect(() => {

      return () =>{
      }
    }, []);



    return (
      <div>
          <p className="text">ISO- value</p>
          <div style={{display:"flex", paddingBottom:"5px",paddingLeft:"10px"}}>

          <Slider
            progress
            min={0}
            max={1}
            step={0.01}
            value={iso}
            
            style={{width:"100%",height:"100%"}}
            onChange={(v, e) => {
              e.stopPropagation();
              setISO(v);
            }} 
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => {
              value['isovalue'] = iso;
              onChange(value);
            }}
                      
          />

          <p style={{ width: '10%', color:'white' }}>{iso}</p>

          </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRVolumeISOSurfaceControl.component;

    const initial = node.data[key] || {input: '', path: '',id: Date.now().toString(),isovalue: 0.7, prev_isovalue: 0, steps:0};

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
export class XRVolumeISOSurfaceComponent extends Rete.Component {
  constructor(type) {
    super("Volume ISO-Surface");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRVolumeISOSurfaceControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {

    console.log("volume iso surface workser ....");
    console.log(node.data.data['isovalue']);

    var input_data = inputs["data"][0];


    if(input_data!==undefined){
      if(node.data.data['input'] !== input_data.path || node.data.data['prev_isovalue']!==node.data.data['isovalue']){
        var response = await API.get(
          "/holoSensor/processing/iso_surfacing/"+ node.data.data['id'] + "/" + node.data.data['isovalue'] + "/" + input_data.path.split("?step")[0]
        );
        console.log(response);
        node.data.data['steps'] = node.data.data['steps'] + 1;
        node.data.data['path'] = response.data + "?step=" +  node.data.data['steps'].toString();  
      }
      node.data.data['input'] = input_data.path;
      node.data.data['prev_isovalue'] = node.data.data['isovalue'];
    }


    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);


    outputs["data"] = node.data.data;

  }
}
