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


export class XRImageProcessCustomControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);

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

    const handleProcess = async (e) => {
      var path = await XRImageProcessCustomAPI(value['input'],value['api_func']);
      console.log(path);
      if(path!==-1 && path!==undefined){
        value['path'] = path;
        onChange(value);
      }
    }
    return (
      <div>
          <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          }}>
          <ButtonToolbar style={{marginLeft: "auto"}} >
            <IconButton  onClick={handleExplorerOpen} icon={<Paragraph />} appearance="default">
            </IconButton>
          </ButtonToolbar>
          <Modal className='explorer' size='full' open={open} onClose={handleExplorerClose}>
            <Modal.Header>
              <Modal.Title> </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{color:"white", fontWeight:"900"}}> def custom_func(path): </p>
              <textarea 
                onKeyDown = {handleTab}
                id="vis-spec-txt" className="vis-spec-edit"
                style={{width: "100%", height: "80vh"}}
                defaultValue={value['api_func']}
                onChange={(e) => {
                  value['api_func'] = e.target.value;
                }}
              />
              <p style={{color:"white", fontWeight:"900"}}> &emsp; return result_path </p>

            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
          </Modal>

          <span style={{paddingRight: "10px"}} />
          <Button style={{marginRight: "auto"}} onClick={handleProcess}><strong>Process</strong></Button>

        </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRImageProcessCustomControl.component;

    const initial = node.data[key] || {input: '',path: '',input_ROI: {"xmin": -1 , "xmax": -1, "ymin": -1, "ymax": -1},ROI: {"xmin": -1 , "xmax": -1, "ymin": -1, "ymax": -1},api_func: ''};

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
export class XRImageProcessCustomComponent extends Rete.Component {
  constructor(type) {
    super("Custom Image Processing");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRImageProcessCustomControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];


    if(input_data!==undefined){
      node.data.data['input'] = input_data.path;
      if("ROI" in input_data){
        node.data.data['ROI']=input_data.ROI;
      }
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);
                

    outputs["data"] = node.data.data;
  }
}
