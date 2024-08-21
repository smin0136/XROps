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


export class XRObjectRecognitionControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);

    const handleExplorerOpen =  (e) => {
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => setOpen(false);



    const handleProcess = async (e) => {


    }

    return (
      <div>
          <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          }}>
          <Button style={{marginLeft: "auto"}} onClick={handleProcess}><strong>Process</strong></Button>

          <span style={{paddingRight: "10px"}} />

          <ButtonToolbar style={{marginRight: "auto"}} >
            <IconButton  onClick={handleExplorerOpen} icon={<CheckCircle />} appearance="default">
            </IconButton>
          </ButtonToolbar>
          <Modal className='point-viewer' size='full' open={open} onClose={handleExplorerClose}>
            <Modal.Header>
              <Modal.Title> </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Viewer path={value['path']} />
            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = XRObjectRecognitionControl.component;

    const initial = node.data[key] || {input: '',path: '',id: Date.now().toString()};

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
export class XRObjectRecognitionComponent extends Rete.Component {
  constructor(type) {
    super("Object Recognition");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRObjectRecognitionControl(this.editor, "data", node);
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
