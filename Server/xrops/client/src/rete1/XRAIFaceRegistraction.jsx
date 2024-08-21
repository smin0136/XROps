import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRAIFaceRegistrationAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder,IconButton } from 'rsuite';
import CheckCircle from '@rsuite/icons/legacy/CheckCircle';

import Viewer from "./xr-viewer/ai-registration-viewer.component";

export class XRAIFaceRegistrationControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    const [open, setOpen] = useState(false);

    const handleExplorerOpen =  (e) => {
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => setOpen(false);

    const handleProcess = async (e) => {
      var matrix = await XRAIFaceRegistrationAPI(value['source_input'],value['target_input']);
      console.log(matrix);
      if(matrix!==-1 && matrix!==undefined){
        value['transform_matrix'] = matrix;
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
              <Viewer path1={value['target_input']} path2={value['source_input']}  matrix={value['transform_matrix']}/>
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
    this.component = XRAIFaceRegistrationControl.component;

    const initial = node.data[key] || {target_input: '',source_input: '', transform_matrix: {}};

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
export class XRAIFaceRegistrationComponent extends Rete.Component {
  constructor(type) {
    super("AI Face Registration");

  }

  builder(node) {
    var in1 = new Rete.Input("data1", "target", textSocket);
    var in2 = new Rete.Input("data2", "source", textSocket);
    var out1 = new Rete.Output("data", "matrix", textSocket);
    var ctrl = new XRAIFaceRegistrationControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addInput(in2).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var target_data = inputs["data1"][0];
    var source_data = inputs["data2"][0];


    if(target_data!==undefined){
      node.data.data['target_input'] = target_data.path;
    }
    if(source_data!==undefined){
      node.data.data['source_input'] = source_data.path;
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(node.data.data);
                

    outputs["data"] = node.data.data;
  }
}
