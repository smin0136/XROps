import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRSendPointCloudAPI, XRListAPI, XRSendDXRData, XRSendDXRSpec } from "./api";
import { XRSetVisPosAPI, XRGetVisPosAPI, XRDeleteVisAPI } from "./api";

import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';

import {DataToDXRSpec } from "./XRDXRParser"

var sendTypes = ['Once','Real time (1s)','Interval (3s)','Interval (5s)',];


export class XRSendControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    var [deviceList,setDeviceList] = useState(["Select device..."]);
    var [device,setDevice] = useState(value['device']);
    var [status,setStatus] = useState('');
    var [devices,setDevices] = useState('<option>Select device...</option>');

    var [sendTypeList,setSendTypeList]= useState('');
    var [refresh,setRefresh] = useState(0);

    var [interval1,setInterval1]=useState(null);


    async function generateSendTypeList(){  
      var newList =sendTypes.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select send type...</option>"]);
      sendTypeList = newList.join("\n");
      setSendTypeList(sendTypeList);
    }


    async function getDeviceList(){
      const data = await XRListAPI();
//      deviceList = data.map((a) => a.file_id);
      deviceList = data;
      deviceList.splice(0,0,["Select device..."]);
  
      var newList = deviceList.map((x) => `<option>${x}</option>`);
      devices = newList.join("\n");
      setDevices(devices);
      currentEditor.trigger("process");
      setDeviceList(deviceList);
    }
    
    useEffect(() => {
      generateSendTypeList();
      getDeviceList();

      return () =>{
        if(interval1!==null){
          clearInterval(interval1);
          interval1 = null;
        }
      }


    }, []);

    console.log(value);

    const handleSend = async (e) => {
      value['vis_pos'].position.x = parseFloat(value['vis_pos'].position.x);
      value['vis_pos'].position.y = parseFloat(value['vis_pos'].position.y);
      value['vis_pos'].position.z = parseFloat(value['vis_pos'].position.z);
      value['vis_pos'].scale.x = parseFloat(value['vis_pos'].scale.x);
      value['vis_pos'].scale.y = parseFloat(value['vis_pos'].scale.y);
      value['vis_pos'].scale.z = parseFloat(value['vis_pos'].scale.z);
      value['vis_pos'].rotation.x = parseFloat(value['vis_pos'].rotation.x);
      value['vis_pos'].rotation.y = parseFloat(value['vis_pos'].rotation.y);
      value['vis_pos'].rotation.z = parseFloat(value['vis_pos'].rotation.z);
      if(value['send_type']==="Once"){
        var spec = await DataToDXRSpec(value['path'],value['mark'],value['mesh'],value['encoding_list']);
        var spec_string = JSON.stringify(spec);
        var res = await XRSendDXRSpec(device,spec_string,value['vis_pos'],value['id'],value['link']);
  
        status=res;
        setStatus(res);  
      }
      else if(value['send_type']==="Real time (1s)"){
        interval1 = setInterval(async () => {
          var spec = await DataToDXRSpec(value['path'],value['mark'],value['mesh'],value['encoding_list']);
          var spec_string = JSON.stringify(spec);
          var res = await XRSendDXRSpec(device,spec_string,value['vis_pos'],value['id'],value['link']);
    
          status=res;
          setStatus(res);    
        }, 1000);
        setInterval1(interval1);
      }
      else if(value['send_type']==="Interval (3s)"){
        interval1 = setInterval(async () => {
          var spec = await DataToDXRSpec(value['path'],value['mark'],value['mesh'],value['encoding_list']);
          var spec_string = JSON.stringify(spec);
          var res = await XRSendDXRSpec(device,spec_string,value['vis_pos'],value['id'],value['link']);
    
          status=res;
          setStatus(res);    
        }, 3000);
        setInterval1(interval1);        
      }
      else if(value['send_type']==="Interval (5s)"){
        interval1 = setInterval(async () => {
          var spec = await DataToDXRSpec(value['path'],value['mark'],value['mesh'],value['encoding_list']);
          var spec_string = JSON.stringify(spec);
          var res = await XRSendDXRSpec(device,spec_string,value['vis_pos'],value['id'],value['link']);
    
          status=res;
          setStatus(res);    
        }, 5000);
        setInterval1(interval1);
      }

    }
    const handleStop = async (e) => {
      if(interval1!==null){
        clearInterval(interval1);
        interval1 = null;
        setInterval1(interval1);
      }
    }

    const handleSet = async (e) => {
      value['vis_pos'].position.x = parseFloat(value['vis_pos'].position.x);
      value['vis_pos'].position.y = parseFloat(value['vis_pos'].position.y);
      value['vis_pos'].position.z = parseFloat(value['vis_pos'].position.z);
      value['vis_pos'].scale.x = parseFloat(value['vis_pos'].scale.x);
      value['vis_pos'].scale.y = parseFloat(value['vis_pos'].scale.y);
      value['vis_pos'].scale.z = parseFloat(value['vis_pos'].scale.z);
      value['vis_pos'].rotation.x = parseFloat(value['vis_pos'].rotation.x);
      value['vis_pos'].rotation.y = parseFloat(value['vis_pos'].rotation.y);
      value['vis_pos'].rotation.z = parseFloat(value['vis_pos'].rotation.z);
      var res = await XRSetVisPosAPI(device,value['vis_pos'],value['id']);
    }

    const handleGet = async (e) => {
      var res = await XRGetVisPosAPI(device,value['id']);
      console.log(res);
      value['vis_pos'].position.x = parseFloat(res.position.x).toFixed(2);
      value['vis_pos'].position.y = parseFloat(res.position.y).toFixed(2);
      value['vis_pos'].position.z = parseFloat(res.position.z).toFixed(2);
      value['vis_pos'].scale.x = parseFloat(res.scale.x).toFixed(2);
      value['vis_pos'].scale.y = parseFloat(res.scale.y).toFixed(2);
      value['vis_pos'].scale.z = parseFloat(res.scale.z).toFixed(2);
      value['vis_pos'].rotation.x = parseFloat(res.rotation.x).toFixed(2);
      value['vis_pos'].rotation.y = parseFloat(res.rotation.y).toFixed(2);
      value['vis_pos'].rotation.z = parseFloat(res.rotation.z).toFixed(2);
      onChange(value);
      setRefresh(refresh + 1);
    }

    const handleDelete = async (e) => {
      var res = await XRDeleteVisAPI(device,value['id']);
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
    const handlePosX = async (e) =>{
      value['vis_pos'].position.x = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handlePosY = async (e) =>{
      value['vis_pos'].position.y = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handlePosZ = async (e) =>{
      value['vis_pos'].position.z = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleRotX = async (e) =>{
      value['vis_pos'].rotation.x = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleRotY = async (e) =>{
      value['vis_pos'].rotation.y = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleRotZ = async (e) =>{
      value['vis_pos'].rotation.z = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleScaleX = async (e) =>{
      value['vis_pos'].scale.x = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleScaleY = async (e) =>{
      value['vis_pos'].scale.y = parseFloat_sub(e.target.value);
      onChange(value);
    }
    const handleScaleZ = async (e) =>{
      value['vis_pos'].scale.z = parseFloat_sub(e.target.value);
      onChange(value);
    }



    var button_text = "Send";
    var button_func = handleSend;
    if(value['send_type']!=="Once"){
      if(interval1!==null){
        button_text = "Stop";
        button_func = handleStop;
      }
      else{
        button_text = "Start"
      }
    }

    return (
      <div>
          <div style={{
          display: "flex",
          flexDirection: "column"
          }}>
          <p className="text">Connected device</p>
          <div style={{paddingBottom:"15px"}}>
            <select 
              value={value['device']} 
              onChange={(e) => {
                console.log(e);
                device=e.target.value;
                setDevice(e.target.value);
                value['device'] = device;
                onChange(value);
              }}
              onClick={() => {
                getDeviceList();
              }}
              style={{width: "100%", height: "40px"}}      
              >
              {parse(devices)}
            </select>
          </div>
          <div style={{
                display: "flex",
                flexDirection: "row"
                }}
          >
            <select 
              value={value['send_type']} 
              onChange={(e) => {
                value['send_type'] = e.target.value;
                onChange(value);
              }}
            

              style={{width: "80%", height: "40px", marginRight: "10px"}}      
              >
              {parse(sendTypeList)}
            </select>
            <Button onClick={button_func}><strong>{button_text}</strong></Button>
          </div>
          {status}

          <hr />
          
          <div style={{
              display: "flex",
              flexDirection: "row"
              }}
          >
              <div style={{
                   display: "flex",
                   flexDirection: "column"
                }}
              >
                <div style={{display: "flex",flexDirection: "row"}}>
                  <p className="pos-text">Position</p>
                  <input className="textEdit"
                    type="text"
                    value={value['vis_pos'].position.x}
                    onChange={handlePosX}
                  />
                  <input className="textEdit"
                    type="text"
                    value={value['vis_pos'].position.y}
                    onChange={handlePosY}
                  />
                  <input className="textEdit"
                    type="text"
                    value={value['vis_pos'].position.z}
                    onChange={handlePosZ}
                  />
                </div>
                <div style={{display: "flex",flexDirection: "row",marginTop: "5px",marginBottom: "5px"}}>
                  <p className="pos-text">Rotation</p>
                  <input className="textEdit"
                    type="text"
                    value={value['vis_pos'].rotation.x}
                    onChange={handleRotX}
                  />
                  <input className="textEdit"
                    type="text"
                    value={value['vis_pos'].rotation.y}
                    onChange={handleRotY}
                  />
                  <input className="textEdit"
                    type="text"
                    value={value['vis_pos'].rotation.z}
                    onChange={handleRotZ}
                  />
                </div>
                <div style={{display: "flex",flexDirection: "row"}}>
                  <p className="pos-text">Scale</p>
                  <input className="textEdit"
                    type="text"
                    value={value['vis_pos'].scale.x}
                    onChange={handleScaleX}
                  />
                  <input className="textEdit"
                    type="text"
                    value={value['vis_pos'].scale.y}
                    onChange={handleScaleY}
                  />
                  <input className="textEdit"
                    type="text"
                    value={value['vis_pos'].scale.z}
                    onChange={handleScaleZ}
                  />
                </div>
              </div>
              <div  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%"
                }}
              >
                <Button style={{marginTop: "auto", marginBottom: "5px"}} onClick={handleSet}><strong>Set</strong></Button>
                <Button style={{marginBottom: "auto"}} onClick={handleGet}><strong>Get</strong></Button>
              </div>
          </div>

          <hr />

          <Button onClick={handleDelete}><strong>Delete Visualization</strong></Button>

        </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRSendControl.component;

    const initial = node.data[key] || {path: '', mark: [],mesh: [], encoding_list: []
                                        ,device: '',id: Date.now().toString()
                                        ,send_type: '',vis_pos: {position: {x: 0.0, y: 0.0, z: 0.0}, rotation: {x: 0.0, y: 0.0, z: 0.0}, scale: {x: 0.0,y: 0.0, z: 0.0}}
                                        ,link: {type: '', data:''}};

    console.log(initial);

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
export class XRSendComponent extends Rete.Component {
  constructor(type) {
    super("XR Visualization");

  }

  builder(node) {
    var in1 = new Rete.Input("data1", "Spec", textSocket);
    var in2 = new Rete.Input("data2", "Link | Pos | Marker", textSocket);
    var out1 = new Rete.Output("data", "Id", textSocket);
    var ctrl = new XRSendControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addInput(in2).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data1 = inputs["data1"][0];
    var input_data2 = inputs["data2"][0];

    if(input_data1!==undefined){
      node.data.data['path'] = input_data1.path.split("?step")[0];
      node.data.data['mark'] = input_data1.mark;
      node.data.data['mesh'] = input_data1.mesh;
      node.data.data['encoding_list'] = input_data1.encoding_list;
    }
    if(input_data2!==undefined){
      if("type" in input_data2){
        node.data.data['link'].type = input_data2.type;
        if(input_data2.type === 'object-link' || input_data2.type === 'axis-link'){
          node.data.data['link'].data = input_data2.id;
        }
        else if(input_data2.type === 'marker_detection'){
          node.data.data['link'].data = input_data2.result;
        }
        else if(input_data2.type === 'value'){
          node.data.data['link'].data = input_data2.vis_pos.position.x.toString() + 
                                        ',' + input_data2.vis_pos.position.y.toString() +
                                        ',' + input_data2.vis_pos.position.z.toString();
        }
      }
    }
    else{
      node.data.data['link'].type = 'none';
      node.data.data['link'].data = '';
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);

    
    outputs["data"] = node.data.data;
  }
}
