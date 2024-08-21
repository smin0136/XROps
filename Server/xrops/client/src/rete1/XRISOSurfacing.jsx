import Rete from "rete";
import { textSocket, currentEditor } from "./rete";
import { XRISOSurfacingAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';
import parse from "html-react-parser";
import { Modal, Button, ButtonToolbar, Placeholder,IconButton } from 'rsuite';

import CheckCircle from '@rsuite/icons/legacy/CheckCircle';
import Viewer from "./xr-viewer/mip-viewer.component";


var iso_option = ['Bone', 'Skin'];

export class XRISOSurfacingControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    var [ISOList,setISOList]= useState('');


    const [open, setOpen] = useState(false);

    const handleExplorerOpen =  (e) => {
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => setOpen(false);


    async function generateISOList(){  
      var newList =iso_option.map((x) => `<option>${x}</option>`);
      newList.splice(0,0,["<option>Select structure type...</option>"]);
      ISOList = newList.join("\n");
      setISOList(ISOList);
    }

    async function processISOSurfacing(){
      var res = await XRISOSurfacingAPI(value['id'],value['input'],value['option']);
      if(res!==-1 && res!==undefined){
        value['path']=res;
        onChange(value);
      }

    }

    useEffect(() => {
      generateISOList();
    }, []);


    return (
      <div>
          <p className="text">Structure Type</p>
          <div style={{display: "flex", flexDirection:"row", paddingBottom:"5px",paddingLeft:"10px"}}>
            <select 
              value={value['option']} 
              onChange={(e) => {
                console.log(e);
                value['option']=e.target.value;
                onChange(value);
              }}

              style={{width: "100%", height: "40px", marginRight: "10px"}}      
              >
              {parse(ISOList)}
            </select>
          </div>
          <div style={{display: "flex", flexDirection:"row", paddingBottom:"5px"}}>
            <Button style={{marginRight:"10px", width: "80%"}} onClick={processISOSurfacing}><strong>Process</strong></Button>

            <ButtonToolbar>
              <IconButton onClick={handleExplorerOpen} icon={<CheckCircle />} appearance="default">
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
    this.component = XRISOSurfacingControl.component;

    const initial = node.data[key] || {input: '', path: '', option: 'Bone',id: Date.now().toString()};

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
export class XRISOSurfacingComponent extends Rete.Component {
  constructor() {
    super("ISO Surfacing");

  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRISOSurfacingControl(this.editor, "data", node);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];

    console.log(input_data);
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
