import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XROutlierRemovingAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder,IconButton } from 'rsuite';
import CheckCircle from '@rsuite/icons/legacy/CheckCircle';

import Viewer from "./xr-viewer/xr-viewer.component";


export class XRMixedRealityViewControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    const [open, setOpen] = useState(false);
    const [device, setDevice] = useState(value['key']);

    const handleExplorerOpen =  (e) => {
      setDevice(value['key']);
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => setOpen(false);

    console.log(value);
    return (
      <div>
          <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          }}>
          <ButtonToolbar style={{margin: "auto"}} >
            <IconButton  onClick={handleExplorerOpen} icon={<CheckCircle />} appearance="default">
            </IconButton>
          </ButtonToolbar>
          <Modal className='point-viewer' size='full' open={open} onClose={handleExplorerClose}>
            <Modal.Header>
              <Modal.Title> </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Viewer path={device} />
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
    this.component = XRMixedRealityViewControl.component;

    const initial = node.data[key] || {key: ''};

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
export class XRMixedRealityViewComponent extends Rete.Component {
  constructor(type) {
    super("Mixed Reality View");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var ctrl = new XRMixedRealityViewControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1);
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
                
  }
}
