import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRImageProcessCustomAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder,IconButton } from 'rsuite';
import Paragraph from '@rsuite/icons/Paragraph';

import Viewer from "./xr-viewer/point-viewer.component";
import axios from "axios";


export class XRCustomProcessingControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [hostip,setHostip] = useState(value['ip']);

    var [functionList,setFunctionList]= useState('');

    var [functionContents,setFunctionContents]= useState([]);

    var [args,setArgs]= useState({...value['args']});

    async function generateFunctionList(){  
      var response = await API.get(
        "/holoSensor/custom/function_list/" + value['ip']
      );
      // console.log(response.data);
      var functions = JSON.parse(response.data);
      setFunctionContents(functions);

      var function_names = functions.map(func => func.name);
      var newList =function_names.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select function...</option>"]);
      functionList = newList.join("\n");
      setFunctionList(functionList);
    }

    useEffect(() => {
      generateFunctionList();

      return () =>{
      }
    }, []);



    const handleExplorerOpen =  (e) => {
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => {
      setOpen(false);
      onChange(value);
    }

    const handleTab = (e) => {

      let content = e.target.value;
      let caret   = e.target.selectionStart;

      if(e.key === 'Tab'){
          e.preventDefault();
          let newText = content.substring(0, caret) + ' '.repeat(4) + content.substring(caret);
          value['api_func']=newText;
          e.target.value = newText;
      }
    }

    const handleSetIP = (e) => {
      setHostip(e.target.value);
      value['ip'] = e.target.value;
      onChange(value);
    };

    const handleProcess = async (e) => {
      if(value['content']!==undefined){
        if(value['content']['name']!==''){
          var body = {
            user_ip: value['ip'],
            type: value['function_type'],
            input: value['input'].split("?step")[0],
            function: value['content'],
            args: value['args']
          }
          console.log(body);
          var response = await API.post(
            "/holoSensor/custom/"+ value['id'],
            body
          );
          console.log(response);
          value['steps'] = value['steps'] + 1;
          value['path'] = response.data + "?step=" +  value['steps'].toString();      
          onChange(value);
        }
      }
    
    };

    var encoding_parameters = [];
    if(value['content']!==undefined){
      var param = value['content']['parameters'];
      for(let i=0;i<param.length;i++){
        if(param[i]['name']==='input'){
          continue;
        }
        encoding_parameters.push(
          <div style={{display: "flex", flexDirection:"column", width: "60%"}}>
          <p className="text">{param[i]['name']}</p>
          <input className="textEdit"
            type="text"
            placeholder={param[i]['type']}
            style={{fontWeight:"700",marginLeft:"0",marginRight:"0",width:"90%",height:"30px"}}
            value={args[param[i]['name']]!==undefined?args[param[i]['name']]:''}
            onChange={(e) => {
              args[param[i]['name']] = e.target.value;
              setArgs({...args});
              if(param[i]['type']==='str'){
                value['args'][param[i]['name']] = e.target.value;
                value['args'] = {...value['args']}
                onChange(value);
              }
              else if(param[i]['type']==='int'){
                const num = parseInt(e.target.value);
                if(!isNaN(num)){
                  value['args'][param[i]['name']] = num;
                  value['args'] = {...value['args']}
                  onChange(value);
                }
              }
              else if(param[i]['type']==='float'){
                const num = parseFloat(e.target.value);
                if(!isNaN(num)){
                  value['args'][param[i]['name']] = num;
                  value['args'] = {...value['args']}
                  onChange(value);
                }
              }
              else{
                value['args'][param[i]['name']] = e.target.value;
                value['args'] = {...value['args']}
                onChange(value);
              }

            }}
          />
        </div>
        );
      }
    }


    // const handleProcess = async (e) => {
    //   var path = await XRImageProcessCustomAPI(value['input'],value['api_func']);
    //   console.log(path);
    //   if(path!==-1 && path!==undefined){
    //     value['path'] = path;
    //     onChange(value);
    //   }
    // }
    return (
      <div style={{ display: "flex", flexDirection: "column"}}>

          <div style={{display: "flex", flexDirection:"row"}}>
            
            <div style={{display: "flex", flexDirection:"column",width:"40%"}}>
              <p className="text">Node ID</p>
              <input className="textEdit"
                type="text"
                placeholder="path..."
                value={value['id']}
                style={{marginLeft:"0",marginRight:"0",width:"90%"}}
              />
            </div>
            
            <div style={{display: "flex", flexDirection:"column", width: "60%"}}>
              <p className="text">Data</p>
              <input className="textEdit"
                type="text"
                placeholder="path..."
                value={value['input']}
                style={{marginLeft:"0",marginRight:"0",width:"90%"}}
              />
            </div>
          </div>



          <div style={{ display: "flex", flexDirection: "column"}}>
            <p className="text">User Server IP</p>
            <input className="textEdit"
              type="text"
              placeholder="***.***.***.***"
              onChange={handleSetIP}
              defaultValue={hostip}
              style={{fontWeight:"700",marginLeft:"0",marginRight:"0",width:"95%"}}
            />
          </div>

          <hr />

          <div style={{display: "flex", flexDirection:"row"}}>
            
            <div style={{display: "flex", flexDirection:"column",width:"40%"}}>
              <p className="text">Function Type</p>
              <select
                value={value['function_type']} 
                onChange={(e) => {
                  console.log(e);
                  value['function_type'] = e.target.value;
                  onChange(value);
                }}
                style={{width:'90%',height:"30px"}}
              >
                <option>image2image</option>
                <option>tabular2tabular</option>
                <option>mesh2mesh</option>
                <option>volume2volume</option>
                <option>volume2image</option>
                <option>volume2mesh</option>
                <option>volume2tabular</option>
                <option>image2position</option>
                <option>volume2position</option>
              </select>
            </div>
            
            <div style={{display: "flex", flexDirection:"column", width: "60%"}}>
              <p className="text">Function</p>
              <select
                value={value['function_name']} 
                onChange={(e) => {
                  console.log(e);
                  if(value['function_name'] === e.target.value){
                    return;
                  }
                  value['function_name'] = e.target.value;
                  var res = functionContents.find(func => func.name === e.target.value);
                  value['content'] = res;
                  var new_args = {};
                  for(let i = 0 ;i<res['parameters'];i++){
                    if(res['parameters'][i]['type']==='str'){
                      new_args[res['parameters'][i]['name']] = '';
                    }
                    else if(res['parameters'][i]['type']==='int'){
                      new_args[res['parameters'][i]['name']] = 0;
                    }
                    else if(res['parameters'][i]['type']==='float'){
                      new_args[res['parameters'][i]['name']] = 0.0;
                    }
                    else{
                      new_args[res['parameters'][i]['name']] = '';
                    }
                  }
                  setArgs(new_args);
                  value['args'] = {...new_args};
                  // console.log(value['content']);
                  onChange(value);  

                }}
                onClick={() => {
                  generateFunctionList();
                }}
  
                style={{width:'90%',height:"30px"}}
              >
                {parse(functionList)}

              </select>
            </div>

            <div style={{marginTop:"auto"}}>
              <ButtonToolbar style={{marginLeft: "auto"}} >
              <IconButton  onClick={handleExplorerOpen} icon={<Paragraph />} appearance="default">
                </IconButton>
              </ButtonToolbar>
              <Modal className='explorer' size='full' open={open} onClose={handleExplorerClose}>
                <Modal.Header>
                  <Modal.Title> </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {/* <p style={{color:"white", fontWeight:"900"}}> def {value['content']['name']}(path): </p> */}
                  <textarea 
                    onKeyDown = {handleTab}
                    id="vis-spec-txt" className="vis-spec-edit"
                    style={{width: "100%", height: "80vh"}}
                    value={value['content']!==undefined?value['content']['code']:''}
                    // onChange={(e) => {
                    //   value['api_func'] = e.target.value;
                    // }}
                  />
                  {/* <p style={{color:"white", fontWeight:"900"}}> &emsp; return result_path </p> */}

                </Modal.Body>
                <Modal.Footer>
                </Modal.Footer>
              </Modal>
            </div>
          </div>

          {encoding_parameters}

          <hr />

          <Button onClick={handleProcess}><strong>Update Function Setting</strong></Button>

          <hr />

      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRCustomProcessingControl.component;

    const initial = node.data[key] || {input: '',path: '',steps: 0,id: Date.now().toString(),ip: '3.34.98.141',function_type:'image2image',function_name:'',args:{},content:{name:'',code:'',parameters:[]}};

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
export class XRCustomProcessingComponent extends Rete.Component {
  constructor(type) {
    super("Custom Processing");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRCustomProcessingControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];


    if(input_data!==undefined){
      if(node.data.data['input']!==input_data.path){
          
          if(node.data.data['content']!==undefined){
            if(node.data.data['content']['name']!==''){
              var body = {
                user_ip: node.data.data['ip'],
                type: node.data.data['function_type'],
                input: input_data.path.split("?step")[0],
                function: node.data.data['content'],
                args: node.data.data['args']
              }
              console.log(body);
              var response = await API.post(
                "/holoSensor/custom/"+ node.data.data['id'],
                body
              );
              console.log(response);
              node.data.data['steps'] = node.data.data['steps'] + 1;
              node.data.data['path'] = response.data + "?step=" +  node.data.data['steps'].toString();      
            }
          }
      }
      node.data.data['input'] = input_data.path.split("?step")[0];
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);
                

    outputs["data"] = node.data.data;
  }
}


function deepEqual(obj1, obj2) {
  if (obj1 === obj2) {
      return true;
  }

  if (typeof obj1 !== 'object' || obj1 === null ||
      typeof obj2 !== 'object' || obj2 === null) {
      return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
      return false;
  }

  for (let key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
          return false;
      }
  }

  return true;
}
