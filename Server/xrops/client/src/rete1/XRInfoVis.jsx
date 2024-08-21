import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRSendPointCloudAPI, XRListAPI, XRSendDXRData } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';

import InfoVis from "./InfoVis/infovis-panel.component";

export class XRInfoVisControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    var [status,setStatus] = useState('');
    var [refresh,setRefresh] = useState(0);

    const [open, setOpen] = useState(false);


    const handleExplorerOpen = (e) => {
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => {
      onChange(value);
      setOpen(false);
    }

    
    useEffect(() => {

    }, []);

    console.log(value);

    return (
      <div>
        <div style={{
          display: "flex",
          flexDirection: "column"
          }}>
          <p className="text">Visualization Panel</p>
          <ButtonToolbar>
            <Button onClick={handleExplorerOpen} style={{width:"100%"}}>
              <strong>Open</strong>
            </Button>
          </ButtonToolbar>
          <Modal className='infovis' size='full' open={open} onClose={handleExplorerClose}>
            <Modal.Header>
              <Modal.Title> </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <InfoVis path={value['path']} mark={value['mark']} mesh={value['mesh']} encoding_list={value['encoding_list']} fieldTypes={value['fieldTypes']} comp = {value['comp']} />
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
    this.component = XRInfoVisControl.component;

    const initial = node.data[key] || {path: '', mark: [''], mesh: [false], encoding_list: [], fieldTypes: [], comp: null};

    console.log(initial);

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
export class XRInfoVisComponent extends Rete.Component {
  constructor(type) {
    super("Visualization");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRInfoVisControl(this.editor, "data", node);

    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];

    console.log(input_data);

    if(input_data!==undefined){
      node.data.data['path'] = input_data.path;
      node.data.data['mark'] = input_data.mark;
      node.data.data['mesh'] = input_data.mesh;
      node.data.data['encoding_list'] = input_data.encoding_list;
      node.data.data['fieldTypes'] = input_data.fieldTypes;
      node.data.data['comp'] = input_data.comp;
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({path: node.data.data['path'],
                mark: node.data.data['mark'],
                mesh: node.data.data['mesh'],
                encoding_list: node.data.data['encoding_list'],
                fieldTypes: node.data.data['fieldTypes'],
                comp: node.data.data['comp']});

    outputs["data"] = node.data.data;

  }
}
