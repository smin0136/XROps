import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRDataFilteringAPI,XRGetFieldsAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';


export class XRDataFilteringControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    var [fieldList,setFieldList] = useState('');


    useEffect(() => {
      generateFieldList();
    }, []);


    async function generateFieldList(){  
      var types = await XRGetFieldsAPI(value['input']);
      if(types!==undefined && types!==-1){
        value['fieldTypes']=types;
        var newList =types.map((x) => `<option>${x}</option>`);
        fieldList = newList.join("\n");
        setFieldList(fieldList);
        onChange(value);
      }
    }


    const handleProcess = async (e) => {
      var path = await XRDataFilteringAPI(value['id'],value['input'],value['field'],value['vmin'],value['vmax']);
      console.log(path);
      if(path!==-1 && path!==undefined){
        value['path'] = path;
        onChange(value);
      }
    };
    const handleMinV = async (e) =>{
      value['vmin'] = e.target.value;
      onChange(value);
    };
    const handleMaxV = async (e) =>{
      value['vmax'] = e.target.value;
      onChange(value);
    };

    return (
      <div>
          <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          }}>
            <div style={{display: "flex",flexDirection: "row", paddingBottom: "10px"}}>
              
              <input className="textEdit"
                  type="text"
                  value={value['vmin']}
                  onChange={handleMinV}
              />
              <p className="pos-text">&#8804;</p>

              <select 
                value={value["field"]} 
                style={{width: "100px", height: "40px"}} 
                onChange={(e) => {
                  value["field"]=e.target.value;
                  onChange(value);
                }}
                onClick={() => {
                  generateFieldList();
                }}

              >
              {parse(fieldList)}
              </select>
              <p className="pos-text">&#60;</p>
              <input className="textEdit"
                  type="text"
                  value={value['vmax']}
                  onChange={handleMaxV}
              />
          </div>

          <Button onClick={handleProcess} style={{width: "100%"}}><strong>Process</strong></Button>
        </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRDataFilteringControl.component;

    const initial = node.data[key] || {input: '',fieldTypes: [],field: '',vmin: -1, vmax: -1, path: '',id: Date.now().toString()};

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
export class XRDataFilteringComponent extends Rete.Component {
  constructor(type) {
    super("Data Filtering");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRDataFilteringControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];


    if(input_data!==undefined){
      node.data.data['input'] = input_data.path;
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);
                

    outputs["data"] = node.data.data;
  }
}
