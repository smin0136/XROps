import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder, IconButton, Checkbox } from 'rsuite';

import PlusIcon from '@rsuite/icons/Plus';
import CloseIcon from '@rsuite/icons/Close';

import { XRGetFieldsAPI, XRGetCSVAPI, XRGetJSONAPI, XRGetAPIAPI } from "./api";


var markTypes = ['cube', 'sphere','bar','cone','arrow','pinetree','none','image','mesh','point_cloud','volume'];

var channelTypes = ['x', 'y','z','size','color','opacity','height','width','yoffsetpct','text'];

var typeTypes = ['quantitative', 'nominal','ordinal','coordinate'];


export class XRDXRParserControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    var [mark,setMark] = useState(value['mark'][0]);
    var [refresh,setRefresh] = useState(0);

    var [mesh,setMesh] = useState(value['mesh'][0]);

    var [markList,setMarkList]=useState('<option>Select mark type...</option>');

    function compUpdate(){
      setRefresh(refresh + 1);
    }  

    value['comp'] = generateFieldList;

    useEffect(() => {
      generateMarkList();
      generateFieldList();
    }, []);

    console.log(value);

 

    async function generateFieldList(){  
      var types = await XRGetFieldsAPI(value['path']);
      if(types!==undefined && types!==-1){
        value['fieldTypes']=types;
        onChange({path: value['path'],
          mark: value['mark'],
          mesh: value['mesh'],
          fieldTypes: value['fieldTypes'],
          encoding_list: value['encoding_list']});
        setRefresh(refresh + 1);  
      }
    }
    async function generateMarkList(){  
      var newList = markTypes.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select mark type...</option>"]);
      markList = newList.join("\n");
      currentEditor.trigger("process");
      setRefresh(refresh + 1);  
      setMarkList(markList);
    }

    async function addNewEncoding(){  
      value['encoding_list'].push({channel: "x", data_field: "selece...", data_type: "quantitative"});
      onChange({path: value['path'],
              mark: value['mark'],
              mesh: value['mesh'],
              fieldTypes: value['fieldTypes'],
              encoding_list: value['encoding_list']});

      currentEditor.trigger("process");
      setRefresh(refresh + 1);  
    }
    async function removeEncoding(ind){  
      value['encoding_list'].splice(ind,1)
      onChange({path: value['path'],
              mark: value['mark'],
              mesh: value['mesh'],
              fieldTypes: value['fieldTypes'],
              encoding_list: value['encoding_list']});

      currentEditor.trigger("process");
      setRefresh(refresh + 1);  
    }

    var encoding_html = [];
    for (let i = 0; i < value['encoding_list'].length; i++) {
      encoding_html.push(
        <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", width: "100%", gridTemplateColumns: "130px 130px 130px 30px"}}>
          <select 
            value={value["encoding_list"][i].channel} 
            style={{width: "90%", height: "40px"}}   
            onChange={(e) => {
              value["encoding_list"][i].channel=e.target.value;
              setRefresh(refresh + 1);  
              onChange({path: value['path'],
                        mark: value['mark'],
                        mesh: value['mesh'],
                        fieldTypes: value['fieldTypes'],
                        encoding_list: value['encoding_list']});
            }}
          >
            {
              (() => {
                var newList = [];
                for (let j = 0; j < channelTypes.length; j++) {
                  newList.push(<option>{channelTypes[j]}</option>);
                }
                return newList;
              })()
            }
          </select>
          <select 
            value={value["encoding_list"][i].data_field} 
            style={{width: "90%", height: "40px"}} 
            onChange={(e) => {
              value["encoding_list"][i].data_field=e.target.value;
              setRefresh(refresh + 1);  
              onChange({path: value['path'],
                        mark: value['mark'],
                        mesh: value['mesh'],
                        fieldTypes: value['fieldTypes'],
                        encoding_list: value['encoding_list']});
            }}
            onClick={() => {
              generateFieldList();
            }}

          >
            {
              (() => {
                var fieldTypes = value['fieldTypes'];
                var newList = [];
                newList.push(<option>select...</option>);
                for (let j = 0; j < fieldTypes.length; j++) {
                  newList.push(<option>{fieldTypes[j]}</option>);
                }
                return newList;
              })()
            }          
          </select>
          <select 
            value={value["encoding_list"][i].data_type} 
            style={{width: "90%", height: "40px"}}   
            onChange={(e) => {
              value["encoding_list"][i].data_type=e.target.value;
              setRefresh(refresh + 1);  
              onChange({path: value['path'],
                        mark: value['mark'],
                        mesh: value['mesh'],
                        fieldTypes: value['fieldTypes'],
                        encoding_list: value['encoding_list']});
            }}
          >
            {
              (() => {
                var newList = [];
                for (let j = 0; j < typeTypes.length; j++) {
                  newList.push(<option>{typeTypes[j]}</option>);
                }
                return newList;
              })()
            }          
            </select>
            <div style={{width: "30px", height: "30px", paddingTop: "5px"}}>
              <IconButton onClick={() => {removeEncoding(i);}} className="button-1" icon={<CloseIcon />} color="blue" appearance="ghost" size="xs" style={{ background: '#2356ff00'}}/>
            </div>
        </div>
      );
    }

    if(mark==='image' || mark==='mesh' || mark==='point_cloud' || mark==='volume'){
      return (
        <div>
            <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            }}>

            <div style={{display: "flex", flexDirection:"row"}}>
                <div style={{display: "flex", flexDirection:"column",alignItems: "center"}}>
                  <p className="text">Data</p>
                  <input className="textEdit"
                    type="text"
                    placeholder="path..."
                    value={value['path']}
                  />
                </div>


                <div style={{display: "flex", flexDirection:"column",alignItems: "center"}}>
                  <p className="text">Mark</p>
                  <select 
                    value={value['mark'][0]} 
                    onChange={(e) => {
                      mark=e.target.value;
                      value['mark'][0]=e.target.value;
                      setMark(e.target.value);
                      onChange({path: value['path'],
                                mark: value['mark'],
                                mesh: value['mesh'],
                                fieldTypes: value['fieldTypes'],
                                encoding_list: value['encoding_list']});
                    }}
                    style={{width: "100%", height: "40px"}}      
                    >
                    {parse(markList)}
                  </select>
                </div>
              </div>
          </div>
        </div>
      );  
    }
    else{
      return (
        <div>
            <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            }}>

            <div style={{display: "flex", flexDirection:"row"}}>
                <div style={{display: "flex", flexDirection:"column",alignItems: "center"}}>
                  <p className="text">Data</p>
                  <input className="textEdit"
                    type="text"
                    placeholder="path..."
                    value={value['path']}
                  />
                </div>


                <div style={{display: "flex", flexDirection:"column",alignItems: "center"}}>
                  <p className="text">Mark</p>
                  <select 
                    value={value['mark'][0]} 
                    onChange={(e) => {
                      mark=e.target.value;
                      value['mark'][0]=e.target.value;
                      setMark(e.target.value);
                      onChange({path: value['path'],
                                mark: value['mark'],
                                mesh: value['mesh'],
                                fieldTypes: value['fieldTypes'],
                                encoding_list: value['encoding_list']});
                    }}
                    style={{width: "100%", height: "40px"}}      
                    >
                    {parse(markList)}
                  </select>
                </div>
              </div>

              <div style={{marginLeft: "auto", marginRight: "40px"}}>
                <Checkbox style={{color: "white", fontWeight: "700"}}
                          checked={value['mesh'][0]}
                          onChange={(v,c,e) => {
                            value['mesh'][0]=c;
                            setMesh(c);
                            onChange({path: value['path'],
                                      mark: value['mark'],
                                      mesh: value['mesh'],
                                      fieldTypes: value['fieldTypes'],
                                      encoding_list: value['encoding_list']});
                          }}
                          >Mesh Rendering
                  </Checkbox>
              </div>


              <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", width: "100%", gridTemplateColumns: "130px 130px 130px 30px"}}>
                <p className="text" style={{textAlign: "center",width: "90%"}}>Channel</p>
                <p className="text" style={{textAlign: "center",width: "90%"}}>Data Field</p>
                <p className="text" style={{textAlign: "center",width: "90%"}}>Data Type</p>
              </div>
              {encoding_html}


              <div style={{marginTop: "20px"}}>
                <IconButton onClick={() => {addNewEncoding();}} className="button-1" icon={<PlusIcon />} appearance="default" active />
              </div>

          </div>
        </div>
      );  
    }
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRDXRParserControl.component;

    const initial = node.data[key] || {path: '',mark: [''],mesh: [false],fieldTypes: [''],encoding_list: [{channel: "x", data_field: "select...", data_type: "quantitative"}], comp: null};

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
export class XRDXRParserComponent extends Rete.Component {
  constructor(type) {
    super("Visual Encoding");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRDXRParserControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];

    console.log(input_data);

    if(input_data!==undefined){
      node.data.data['path'] = input_data.path.split("?step")[0];
    }
    

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({path: node.data.data['path'],
                mark: node.data.data['mark'],
                mesh: node.data.data['mesh'],
                fieldTypes: node.data.data['fieldTypes'],
                encoding_list: node.data.data['encoding_list'],
                comp: node.data.data['comp']});
                
    console.log(node.data.data);

    outputs["data"] = node.data.data;
  }
}

export const DataToDXRSpec = async (data_path,mark,mesh,encoding_list) => {


  // var loaded_file, file_json;
  // var ext = data_path.split('.').slice(-1)[0];
  // console.log(ext);
  // if(ext === 'csv')
  // {
  //   loaded_file = await XRGetCSVAPI(data_path);
  //   file_json = csvToJSON(loaded_file);
  // }
  // else if(ext === 'json')
  // {
  //   // console.log("json load");
  //   file_json = await XRGetJSONAPI(data_path);
  //   // console.log("json");
  //   // console.log(file_json);
  // }
  // else if(ext === 'api'){
  //   file_json = await XRGetAPIAPI(data_path);
  // }


  var spec = {"data": {"url": data_path},
              "mark": mark[0],
              "encoding":{

              }
              };
  if(mesh[0]===true){
    spec["mesh"] = true;
  }

  // console.log("encoding_list");
  // console.log(encoding_list);

  for(let i = 0; i < encoding_list.length ; i++){
    var channel_spec ={};
    for (const [key, value] of Object.entries(encoding_list[i])) {
      if(key === "channel"){
        continue;
      }
      if(key === "data_field"){
        channel_spec["field"] = value;
      }
      else if(key === "data_type"){
        channel_spec["type"] = value;
      }
      else{
        channel_spec[key] = value;
      }  
    }

    // console.log("channel_spec");
    // console.log(channel_spec);

    // var is_domain = false;

    // if('scale' in channel_spec){
    //   if('domain' in channel_spec['scale'] || 'range' in channel_spec['scale']){
    //     is_domain = true;
    //   }
    // }
    // if(is_domain===false){
    //   channel_spec['scale'] = {};
    // }
    // if(channel_spec['type']==='quantitative'){
    //   var data_values = file_json.map(function(v) {return v[channel_spec['field']]});
     
    //   channel_spec['scale']['domain'] = [Math.min.apply(null,data_values),Math.max.apply(null,data_values)];
    // }
    spec["encoding"][encoding_list[i].channel]=channel_spec;
  }
  return spec;
};




export const DXRSpecToData = (spec,data_path,mark,mesh,encoding_list) => {
  mark[0] = spec["mark"];
  if("mesh" in spec){
    mesh[0] = spec["mesh"];
  }
  else{
    mesh[0] = false;
  }
  
  encoding_list.splice(0, encoding_list.length);
  for (const [key, value] of Object.entries(spec["encoding"])) {
    var encoding_spec ={};
    encoding_spec["channel"] = key;
    for (const [_key, _value] of Object.entries(value)) {
      if(_key === "field"){
        encoding_spec["data_field"] = _value;
      }
      else if(_key === "type"){
        encoding_spec["data_type"] = _value;
      }
      else{
        encoding_spec[_key] = _value;
      }
    }
    encoding_list.push(encoding_spec);
  }
};
 

function csvToJSON(csv_arr){

  const jsonArray = [];

  var header = [];
  for (var i=0; i<csv_arr[0].length; i++)
  {
      header[i] = csv_arr[0][i];
  }

  // console.log("header")
  // console.log(header);

  for(let i = 1; i < csv_arr.length; i++){

      let obj = {};

      for(var j=0; j < header.length; j++){
        var cur_value = csv_arr[i][j];
        var cur_value_num = Number(cur_value);

        if (isNaN(cur_value_num))
          obj[header[j]] = cur_value;
        else
          obj[header[j]] = cur_value_num;
      }

      jsonArray.push(obj);

  }
  
  return jsonArray;
}
