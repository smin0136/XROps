import Rete from "rete";
import parse from "html-react-parser";
import {textSocket, currentEditor} from "./rete";
import {
  getTaskStatus,
  getFilesAPI

} from "./api";
import { useEffect, useState } from "react";

import { XRListAPI } from "./api";

import { Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';

import SingleSource from '@rsuite/icons/SingleSource';
import axios from "axios";


export class XRAPIDataControl extends Rete.Control {

  static component = ({ value, onChange }) => {
    var [refresh,setRefresh] = useState(0);
    var [APIText,setAPIText] = useState('');

    const getData = async () => {
      var data = await axios.get(value['path']);
      if(data!==undefined){
        console.log(data);

        APIText = data.data.map((v) => JSON.stringify(v)).join('\n');
        setAPIText(APIText);
      }
    }
    const setURL = async (e) => {
      value['path']=e.target.value;
      onChange({path: value['path']});
      setRefresh(refresh + 1);
    };

    const [open, setOpen] = useState(false);

    const handleExplorerOpen = async (e) => {
      await getData();
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => setOpen(false);

    useEffect(() => {
      getData();
    }, []);

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <p className="text">API</p>
        <div style={{display: "flex",flexDirection: "column", paddingBottom:"5px",paddingLeft:"10px"}}>
          <input className="textEdit"
            style={{width: "100%",margin: "auto"}}
            type="text"
            placeholder="api url..."
            onChange={setURL}
            value={value['path']}
          />
          <ButtonToolbar>
            <Button style={{width: "80%",margin: "auto",marginTop:"10px"}} onClick={handleExplorerOpen} appearance="default">
              <strong>Apply & Check</strong>
            </Button>
          </ButtonToolbar>
          <Modal className='explorer' size='full' open={open} onClose={handleExplorerClose}>
            <Modal.Header>
              <Modal.Title> </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <textarea id="vis-spec-txt" className="vis-spec-edit"
                style={{width: "100%", height: "80vh"}}
                value={APIText}
              />

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
    this.component = XRAPIDataControl.component;

    const initial = node.data[key] || {path: ''};
//    console.log(initial);

    node.data[key] = initial;
    this.props = {
      readonly,
      value: initial,
      onChange: async (v) => {
        this.setValue(v);
      },
    };
  }

  setValue(val) {
    // console.log(val);
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }



}

export class XRAPIDataComponent extends Rete.Component {
  constructor() {
    super("API Data");
  }

  builder(node) {
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRAPIDataControl(this.editor, "data", node);

    return node.addControl(ctrl).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
//    console.log(node.data.data);

    this.editor.nodes
    .find((n) => n.id == node.id)
    .controls.get("data")
    .setValue({path: node.data.data["path"]});

    outputs["data"]=node.data.data;
  }
}
