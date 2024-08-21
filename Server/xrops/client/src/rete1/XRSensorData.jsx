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

var gestureTypes = ['Pinch', 'Button','Streaming'];
var sensorTypes = ['Tracking (head, hand, eye)','Depth (Near)','Depth (Far)','Grayscale camera (VLC)','RGB camera (PV)'];


export class XRSensorDataControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    console.log(value);

    var results = value['result'];
    var [last_e,setLast_e] = useState(value['path']);

    var [sensorData,setSensorData] = useState('');
    var [interval1,setInterval1]=useState(null);
    

    var [gestureIndex,setGestureIndex] = useState(value['gesture']);
    var [gestureList,setGestureList]= useState('');


    var [sensorIndex,setSensorIndex] = useState(value['sensor']);
    var [sensorList,setSensorList]=useState('<option>Select sensor type...</option>');


    async function generateGestureList(){  
      var newList =gestureTypes.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select gesture type...</option>"]);
      gestureList = newList.join("\n");
      setGestureList(gestureList);
    }

    async function generateSensorList(){  
      var newList =sensorTypes.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select sensor type...</option>"]);
      sensorList = newList.join("\n");
      setSensorList(sensorList);
    }


    async function generateSensorDataList(){  
      sensorData = `<option>${last_e}</option>`;
      setSensorData(sensorData);
//      currentEditor.trigger("process");
    }


    useEffect(() => {
      generateSensorDataList();
      generateGestureList();
      generateSensorList();

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
      var res = await XRSensorDataStartAPI(value['key'],value['sensor'],value['gesture'],value['id']);
      console.log(res);
      if(res===1){
        setIsStarted(true);
        isStopped=false;
        setIsStopped(false);
  
        sensorState = 'Started!';
        setSensorState('Started!');
        stateColor='green';
        setStateColor('green');
        interval1 = setInterval(async () => {
          var res = await XRSensorDataStatusAPI(value['key']);
          sensorState = res['status'];
          setSensorState(res['status']);
          if(res['status']==="connected"){
            stateColor='green';
            setStateColor('green');
            results = [...results, ...res['result']];
            if(results.length>0){
              last_e = results[results.length-1];
              value['path'] = results[results.length-1];
              setLast_e(results[results.length-1]);
            }
      
            await generateSensorDataList();
            value['result'] = results;
            onChange(value);      
          }
          else{
            stateColor='red';
            setStateColor('red');
            isStopped=true;
            setIsStopped(true);      
            await handleStop();
          }
    
        }, 1000);
        setInterval1(interval1);
      }
      else{
        setSensorState('failed...');
        stateColor='red';
        setStateColor('red');
      }
      // var res = await XRConnectAPI(hostip, port);
      // console.log(res);
      // connectState = res;
    };

    const handleStop = async (e) => {
      if(isStarted){
        clearInterval(interval1);
        interval1 = null;
        setInterval1(interval1);
        isStarted=false;
        setIsStarted(false);  
      }
      isStopped=true;
      setIsStopped(true);
      var res = await XRSensorDataStopAPI(value['key']);
      console.log("stop api good: ");
      console.log(res);
      sensorState = res['status'];
      setSensorState(res['status']);

      if(res['status']==="success"){
        stateColor='green';
        setStateColor('green');
      }
      else{
        stateColor='red';
        setStateColor('red');
      }

      results = [...results, ...res['result']];

      if(results.length>0){
        last_e = results[results.length-1];
        value['path'] = results[results.length-1];
        setLast_e(results[results.length-1]);
      }

      await generateSensorDataList();
      value['result'] = results;
      onChange(value);      


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

        <div style={{
        display: "flex",
        flexDirection: "row"
        }}>

          <div>
            <p className="text">Gesture Types</p>
            <div style={{paddingBottom:"5px",paddingLeft:"10px"}}>
              <select 
                value={gestureTypes[value['gesture']]} 
                onChange={(e) => {
                  console.log(e);
                  gestureIndex = e.target.selectedIndex;
                  setGestureIndex(e.target.selectedIndex);
                  value['gesture'] = gestureIndex - 1;
                  onChange(value);
                }}
                style={{width: "100%", height: "40px"}}      
                >
                {parse(gestureList)}
              </select>
            </div>
          </div>


          <div>
            <p className="text">Sensor Types</p>
            <div style={{paddingBottom:"5px",paddingLeft:"10px"}}>
              <select 
                value={sensorTypes[value['sensor']]} 
                onChange={(e) => {
                  console.log(e);
                  sensorIndex = e.target.selectedIndex;
                  setSensorIndex(e.target.selectedIndex);
                  value['sensor'] = sensorIndex-1;
                  onChange(value);
                }}
                style={{width: "100%", height: "40px"}}      
                >
                {parse(sensorList)}
              </select>
            </div>
          </div>


        </div>

          

          <p className="text">Sensor data</p>
          <div style={{display:"flex", paddingBottom:"5px",paddingLeft:"10px"}}>
            <select 
              onClick={() => {
                generateSensorDataList();
              }}
              style={{width: "80%", height: "40px", marginRight: "10px"}}      
              >
              {parse(sensorData)}
            </select>
            <ButtonToolbar>
              <IconButton onClick={handleExplorerOpen} icon={<SingleSource />} appearance="default">
              </IconButton>
            </ButtonToolbar>
            <Modal className='explorer' size='full' open={open} onClose={handleExplorerClose}>
              <Modal.Header>
                <Modal.Title> </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Explorer path={value['path']} />
              </Modal.Body>
              <Modal.Footer>
              </Modal.Footer>
            </Modal>

          </div>

          <div style={{ display: "flex", flexDirection: "row",marginTop: "20px", marginLeft: "10px"}}>
            <div style={{ marginRight: "10px" }}>
            <Button onClick={handleStart} appearance="default" disabled={isStarted}>
              Start 
            </Button>
            </div>
            <Button onClick={handleStop} appearance="default" disabled={!isStarted}>
              Stop 
            </Button>
            <label style={{color: stateColor, marginLeft: "10px", marginTop: "3px", fontWeight: "700", fontSize: "12px" }}>{sensorState}</label>
          </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRSensorDataControl.component;

    const initial = node.data[key] || {key: '', sensor: 0, gesture: 0, result: [], path: '',id: Date.now().toString()};

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
export class XRSensorDataComponent extends Rete.Component {
  constructor(type) {
    super("Taking Sensor Data");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "device", textSocket);
    var out1 = new Rete.Output("data", "sensor data", textSocket);
    var ctrl = new XRSensorDataControl(this.editor, "data", node);
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
      .setValue(node.data.data);


    outputs["data"] = node.data.data;

  }
}
