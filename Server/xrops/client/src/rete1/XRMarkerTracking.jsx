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


export class XRMarkerTrackingControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    const [isStarted, setIsStarted] = useState(false);
    const [interval1,setInterval1]=useState(null);

    useEffect(() => {

      return () =>{
        if(isStarted){
          clearInterval(interval1);
          setInterval1(null);
        }
      }
    }, []);

    
    const markerRendering = async () => {
      var response = await API.post(
        "/holoSensor/sensorapi/marker/"+ value['key'],
        {transform: value['offset_transform']}
      );
      console.log(response);
      value['result'] = response.data['data'];
      onChange(value);
    }

    const handleStart = async (e) => {
      if(value['key']!=='' && value['input']!==''){
        var response = await API.post(
          "/holoSensor/sensorapi/marker/update/"+ value['key'] + "/" + value['input']
        );
        var cur_interval = setInterval(markerRendering, 1000);
        setInterval1(cur_interval);
        setIsStarted(true);
      }
    }
    const handleStop = async (e) => {
      if(isStarted){
        clearInterval(interval1);
        setInterval1(null);
        setIsStarted(false);
        var response = await API.post(
          "/holoSensor/sensorapi/marker/stop/"+ value['key']
        );
      }
    }


    const handlePosX = async (e) =>{
      value['offset_transform'].position.x = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handlePosY = async (e) =>{
      value['offset_transform'].position.y = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handlePosZ = async (e) =>{
      value['offset_transform'].position.z = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleRotX = async (e) =>{
      value['offset_transform'].rotation.x = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleRotY = async (e) =>{
      value['offset_transform'].rotation.y = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleRotZ = async (e) =>{
      value['offset_transform'].rotation.z = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleScaleX = async (e) =>{
      value['offset_transform'].scale.x = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleScaleY = async (e) =>{
      value['offset_transform'].scale.y = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleScaleZ = async (e) =>{
      value['offset_transform'].scale.z = parseFloat_sub(e.target.value);
      onChange(value);
    }


    const parseFloat_sub = (v) => {
      return v;
      var res = parseFloat(v);
      if(res === NaN){
        return v;
      }
      else{
        return res;
      }
    }

    return (
      <div>
          <div style={{
          display: "flex",
          flexDirection: "column"
          }}>

            <div style={{
            display: "flex",
            flexDirection: "row"
            }}>

              <Button style={{width:"40%",margin:"auto"}} onClick={handleStart} disabled={isStarted}><strong>Start</strong></Button>
              <Button style={{width:"40%",margin:"auto"}} onClick={handleStop} disabled={!isStarted}><strong>Stop</strong></Button>
            </div>

          <hr />

          <p className="text" style={{marginRight:"auto"}}>Offset Transformation</p>
          <hr style={{marginTop:"0px"}} />
          <div style={{
                display: "flex",
                flexDirection: "column"
            }}
          >
            <div style={{display: "flex",flexDirection: "row"}}>
              <p className="pos-text">Position</p>
              <input className="textEdit"
                type="text"
                value={value['offset_transform'].position.x}
                onChange={handlePosX}
              />
              <input className="textEdit"
                type="text"
                value={value['offset_transform'].position.y}
                onChange={handlePosY}
              />
              <input className="textEdit"
                type="text"
                value={value['offset_transform'].position.z}
                onChange={handlePosZ}
              />
            </div>
            <div style={{display: "flex",flexDirection: "row",marginTop: "5px",marginBottom: "5px"}}>
              <p className="pos-text">Rotation</p>
              <input className="textEdit"
                type="text"
                value={value['offset_transform'].rotation.x}
                onChange={handleRotX}
              />
              <input className="textEdit"
                type="text"
                value={value['offset_transform'].rotation.y}
                onChange={handleRotY}
              />
              <input className="textEdit"
                type="text"
                value={value['offset_transform'].rotation.z}
                onChange={handleRotZ}
              />
            </div>
            <div style={{display: "flex",flexDirection: "row"}}>
              <p className="pos-text">Scale</p>
              <input className="textEdit"
                type="text"
                value={value['offset_transform'].scale.x}
                onChange={handleScaleX}
              />
              <input className="textEdit"
                type="text"
                value={value['offset_transform'].scale.y}
                onChange={handleScaleY}
              />
              <input className="textEdit"
                type="text"
                value={value['offset_transform'].scale.z}
                onChange={handleScaleZ}
              />
            </div>
          </div>
          <hr />

        </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRMarkerTrackingControl.component;

    const initial = node.data[key] || {input: '',key: '',id: Date.now().toString(),type:'marker_detection', result: null,
                                      offset_transform: {position: {x: 0.0, y: 0.0, z: 0.0}, rotation: {x: 0.0, y: 0.0, z: 0.0}, scale: {x: 0.0,y: 0.0, z: 0.0}}};

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
export class XRMarkerTrackingComponent extends Rete.Component {
  constructor(type) {
    super("Marker Tracking");

  }

  builder(node) {
    var in1 = new Rete.Input("data1", "Image File", textSocket);
    var in2 = new Rete.Input("data2", "XR Input", textSocket);
    var out1 = new Rete.Output("data", "transform", textSocket);
    var ctrl = new XRMarkerTrackingControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addInput(in2).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data1 = inputs["data1"][0];
    var input_data2 = inputs["data2"][0];


    if(input_data1!==undefined){
      node.data.data['input'] = input_data1.path;
    }
    else{
      node.data.data['input'] = '';
    }

    if(input_data2!==undefined){
      node.data.data['key'] = input_data2.key;
    }
    else{
      node.data.data['key'] = '';
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);
                

    outputs["data"] = node.data.data;
  }
}
