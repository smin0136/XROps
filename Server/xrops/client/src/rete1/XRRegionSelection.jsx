import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRFaceDetectionAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';

import Selector from "./xr-viewer/region-selector.component";

export class XRRegionSelectionControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    const [open, setOpen] = useState(false);

    const handleExplorerOpen = (e) => {
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => {
      setOpen(false);
      onChange(value);
    }

    const handleMinX = async (e) =>{
      value['ROI'].xmin = e.target.value;
      onChange(value);
    };
    const handleMaxX = async (e) =>{
      value['ROI'].xmax = e.target.value;
      onChange(value);
    };

    const handleMinY = async (e) =>{
      value['ROI'].ymin = e.target.value;
      onChange(value);
    };

    const handleMaxY = async (e) =>{
      value['ROI'].ymax = e.target.value;
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
                    value={value['ROI'].xmin}
                    onChange={handleMinX}
                />
                <p className="pos-text"> &#8804; x &#60; </p>
                <input className="textEdit"
                    type="text"
                    value={value['ROI'].xmax}
                    onChange={handleMaxX}
                />
            </div>
            <div style={{display: "flex",flexDirection: "row", paddingBottom: "20px"}}>
              
                <input className="textEdit"
                    type="text"
                    value={value['ROI'].ymin}
                    onChange={handleMinY}
                />
                <p className="pos-text"> &#8804; y &#60; </p>
                <input className="textEdit"
                    type="text"
                    value={value['ROI'].ymax}
                    onChange={handleMaxY}
                />
            </div>
            <div style={{display: "flex",flexDirection: "row"}}>
              <ButtonToolbar>
                <Button onClick={handleExplorerOpen}><strong>Region Selector</strong></Button>
              </ButtonToolbar>
              <Modal className='explorer' size='full' open={open} onClose={handleExplorerClose}>
                <Modal.Header>
                  <Modal.Title> </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Selector path={value['input']} ROI={value['ROI']} />
                </Modal.Body>
                <Modal.Footer>
                </Modal.Footer>
              </Modal>

            </div>
        </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRRegionSelectionControl.component;

    const initial = node.data[key] || {input: '',path: '',input_ROI: {"xmin": -1 , "xmax": -1, "ymin": -1, "ymax": -1},ROI: {"xmin": -1 , "xmax": -1, "ymin": -1, "ymax": -1}};

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
export class XRRegionSelectionComponent extends Rete.Component {
  constructor(type) {
    super("Region Selection");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRRegionSelectionControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];
    //var input_data = inputs["data"];
    console.log(inputs["data"]);

    if(input_data!==undefined){
      node.data.data['input'] = input_data.path;
      node.data.data['path'] = input_data.path;
      if("ROI" in input_data){
        node.data.data['input_ROI']=input_data.ROI;
        if(node.data.data['ROI'].xmin===-1){
          node.data.data['ROI']={...input_data.ROI};
        }
      }
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({input: node.data.data['input'],
                path: node.data.data['path'],
                input_ROI: node.data.data['input_ROI'],
                ROI: node.data.data['ROI']});
                

    outputs["data"] = node.data.data;
  }
}
