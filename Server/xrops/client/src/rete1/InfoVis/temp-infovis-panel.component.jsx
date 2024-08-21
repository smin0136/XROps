import React, { useEffect, useState } from "react";
import { isRouteErrorResponse, useParams } from "react-router-dom";
import API from "../../utils/axios";
import "./infovis-panel.styles.scss";
import PlusIcon from '@rsuite/icons/Plus';
import CloseIcon from '@rsuite/icons/Close';
import { Modal, Button, ButtonToolbar, Placeholder, IconButton, Checkbox } from 'rsuite';
import { XRGetFieldsAPI, XRGetCSVAPI, XRGetJSONAPI, XRGetAPIAPI, XRGetDataMaxAPI, XRGetDataMinAPI } from "../api";
import { DXRSpecToData, DataToDXRSpec } from "../XRDXRParser";
import parse from "html-react-parser";
import ReactDOM from 'react-dom'
import { VegaLite } from 'react-vega'
import { textSocket, currentEditor } from "../rete";
import { createRoot } from 'react-dom/client'



var markTypes = ['cube', 'sphere','bar','cone','arrow','pinetree','none'];

var channelTypes = ['x', 'y','z','size','color','opacity','height','width','yoffsetpct'];

var typeTypes = ['quantitative', 'nominal','ordinal','coordinate'];





const InfoVis = (props) => {
  // console.log(props);

  var value = props;



  var [mark,setMark] = useState(value['mark'][0]);
  var [refresh,setRefresh] = useState(0);
  var [mesh,setMesh] = useState(value['mesh'][0]);

  var [spec,setSpec] = useState({});
  var [spec_text,setSpec_text] = useState('');
  var [spec_vega,setSpecvega] = useState({});
  var [data_vega,setDatavega] = useState({});
  var [markList,setMarkList]=useState('<option>Select mark type...</option>');

  useEffect(() => {
    generateMarkList();
    generateFieldList();
    loadData();
    generateDXRSpec();
    
    return () =>{
      if(value['comp']!==null){
        value['comp']();
      }
    }
  }, []);

  // console.log(value);

  async function onChange(v){
    spec =  await DataToDXRSpec(value['path'],value['mark'],value['mesh'],value['encoding_list']);
    setSpec(spec);
    spec_text = JSON.stringify(spec,null,2);
    setSpec_text(spec_text);
    await loadData();
  }

  async function applyTextToSpec(){
    var img = document.querySelector("#vis-spec-txt");
    if(img===null)return;
    spec = JSON.parse(img.value);
    DXRSpecToData(spec,value['path'],value['mark'],value['mesh'],value['encoding_list']);
    setSpec(spec);
    spec_text = JSON.stringify(spec,null,2);
    setSpec_text(spec_text);
    await loadData();
  }

  async function handleTextChange(e){
    spec_text = e.target.value;
    setSpec_text(spec_text);
  }

  async function generateDXRSpec(){
    console.log("DataToDXRSpec");
    // console.log(value['path']);
    // console.log(value['mark']);
    // console.log(value['mesh']);
    console.log(value['encoding_list']);
    
    spec = await DataToDXRSpec(value['path'],value['mark'],value['mesh'],value['encoding_list']);
    
    // console.log("before");
    // console.log(spec);

    setSpec(spec);

    

    spec_text = JSON.stringify(spec,null,2);

    // console.log("after");
    // console.log(spec);

    setSpec_text(spec_text);

//    spec["data"]["url"] ==="/workspace/xrops/users/test_data/iris.csv"
    // spec["data"]["value"]= 
  } 

  async function generateFieldList(){  
    var types = await XRGetFieldsAPI(value['path']);
    // console.log('fields: ');
    // console.log(types);
    if(types!==undefined){
      value['fieldTypes'].splice(0, value['fieldTypes'].length);
      for(let i = 0; i < types.length ; i++){
        value['fieldTypes'].push(types[i]);
      }
      onChange({path: value['path'],
        mark: value['mark'],
        mesh: value['mesh'],
        fieldTypes: types,
        encoding_list: value['encoding_list']});
      setRefresh(refresh + 1);  
    }
  }
  async function generateMarkList(){  
    var newList = markTypes.map((x) => `<option>${x}</option>`);
    newList.splice(0,0,["<option>Select mark type...</option>"]);
    markList = newList.join("\n");
    setRefresh(refresh + 1);  
    setMarkList(markList);
}

  async function addNewEncoding(){  
    value['encoding_list'].push({channel: "x", data_field: "x", data_type: "quantitative"});
    onChange({path: value['path'],
            mark: value['mark'],
            mesh: value['mesh'],
            fieldTypes: value['fieldTypes'],
            encoding_list: value['encoding_list']});

    setRefresh(refresh + 1);  
  }
  async function removeEncoding(ind){  
    value['encoding_list'].splice(ind,1)
    onChange({path: value['path'],
            mark: value['mark'],
            mesh: value['mesh'],
            fieldTypes: value['fieldTypes'],
            encoding_list: value['encoding_list']});

    setRefresh(refresh + 1);  
  }

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

  



  async function loadData(){
    console.log("loadData");
    var loaded_file, file_json;
    var ext = value['path'].split('.').slice(-1)[0];
    // console.log("ext");
    // console.log(ext);
    if(ext === 'csv')
    {
      loaded_file = await XRGetCSVAPI(value['path']);
      file_json = csvToJSON(loaded_file);
    }
    else if(ext === 'json')
    {
      // console.log("json load");
      file_json = await XRGetJSONAPI(value['path']);
      // console.log("json");
      // console.log(file_json);
    }
    else if(ext === 'api'){
      file_json = await XRGetAPIAPI(value['path']);
    }
    

    data_vega = {};
    data_vega["table"] = file_json;


    spec_vega = {};
    spec_vega["width"] = 600;
    spec_vega["height"] = 600;
    if(spec["mark"]==='cube'){
      spec_vega["mark"] = 'square';
    }
    else if(spec["mark"]==='sphere'){
      spec_vega["mark"] = 'circle';
    }
    else{
      spec_vega["mark"] = spec["mark"];
    }
    spec_vega["encoding"] = {...spec["encoding"]};
    spec_vega["data"] = {name: 'table'};


    // if("size" in spec_vega["encoding"]){

    // }
    // else{
    //   spec_vega["encoding"]["size"]={"value":200};
    // }


    for(var [key, v] of Object.entries(spec_vega["encoding"])){
      var new_encoding = {...v};

      if('scale' in new_encoding){
        if('domain' in new_encoding['scale']){
          var new_scale = {...new_encoding['scale']};
          var new_v = [new_scale['domain'][0],new_scale['domain'][1]];
          if(new_v[0] === 'min'){
            new_v[0] = await XRGetDataMinAPI(new_encoding["field"],value['path']);
          }
          if(new_v[0] === 'max'){
            new_v[0] = await XRGetDataMaxAPI(new_encoding["field"],value['path']);
          }
          if(new_v[1] === 'min'){
            new_v[1] = await XRGetDataMinAPI(new_encoding["field"],value['path']);
          }
          if(new_v[1] === 'max'){
            new_v[1] = await XRGetDataMaxAPI(new_encoding["field"],value['path']);
          }
          new_scale['domain'] = new_v;
          new_encoding['scale'] = new_scale;
          spec_vega["encoding"][key] = new_encoding;
        }
      }
    }

    // console.log("spec_vega");
    // console.log(spec_vega);

    setDatavega(data_vega);
    setSpecvega(spec_vega);

        
  }




  var encoding_html = [];
  for (let i = 0; i < value['encoding_list'].length; i++) {
    encoding_html.push(
      <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", width: "100%", gridTemplateColumns: "130px 130px 130px 30px"}}>
        <select 
          value={value["encoding_list"][i].channel} 
          style={{width: "90%", height: "40px"}}   
          onChange={(e) => {
            // console.log(e);
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
            // console.log(e);
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
            // console.log(e);
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

  return (
    <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    }}>
        <div className="left-panel">
          <div className="left-top-panel">
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
                        value={mark} 
                        onChange={(e) => {
                            // console.log(e);
                            mark=e.target.value;
                            value['mark'][0]=e.target.value;
                            setMark(e.target.value);
                            setRefresh(refresh + 1); 
                            onChange({path: value['path'],
                                        mark: value['mark'],
                                        mesh: value['mesh'],
                                        fieldTypes: value['fieldTypes'],
                                        encoding_list: value['encoding_list']});
                            }
                        }
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
                          // console.log(c);
                          value['mesh'][0]=c;
                          setMesh(c);
                          setRefresh(refresh + 1); 
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


            <div style={{marginTop: "20px", marginBottom: "auto"}}>
                <IconButton onClick={() => {addNewEncoding();}} className="button-1" icon={<PlusIcon />} appearance="default" active />
            </div>
          </div>
          <div className="left-bottom-panel">
            <textarea id="vis-spec-txt" className="vis-spec-edit"
              style={{width: "100%", height: "90%"}}
              value={spec_text}
              onChange={handleTextChange}
            />
            <Button onClick={applyTextToSpec} style={{width:"98%"}} className="button-1">
              Apply
            </Button>

          </div>

        </div>


        <div className="right-panel">
          <VegaLite spec={spec_vega} data={data_vega} style={{margin:"auto"}}/>

        </div>

        
    </div>
  );  
};

export default InfoVis;
