import Rete from "rete";
import { textSocket } from "./rete";

import "./viewer.css"
import { useEffect, useState } from "react";

import ReactDOM from "react";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';

import Viewer from "../routes/viewer/viewer-blend.component";
import API from "../utils/axios";


export class ImageControl extends Rete.Control {

  static component = ({ value, onChange }) => {
    const [size, setSize] = useState();
    const [open, setOpen] = useState(false);

//    console.log(value);

    const handleOpen = (e) => {
      onChange(value);
      setSize('full');
      setOpen(true);
    }
    const handleClose = () => setOpen(false);
  
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
      <ButtonToolbar>
        <Button onClick={handleOpen}> Open</Button>
      </ButtonToolbar>
      <Modal size={size} open={open} onClose={handleClose}>
        <Modal.Header>
          <Modal.Title> </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Viewer server={value.server} path={value.path} user_id={['exp_user1','exp_user1']} additional_value={value.additional_value}/>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>

      </div>
    );
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = ImageControl.component;
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);

    const initial = node.data[key] || 0;

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

export class ImageComponentBlend extends Rete.Component {
  constructor() {
    super("Blend Viewer");
    this.node_id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
  }

  builder(node) {
    var in1 = new Rete.Input("data1", "", textSocket);
    var in2 = new Rete.Input("data2", "", textSocket);
    var ctrl = new ImageControl(this.editor, "data", node);
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);

    return node.addControl(ctrl).addInput(in1).addInput(in2);
  }

  async worker(node, inputs, outputs) {
    var input_data1 = inputs["data1"][0];
    var input_data2 = inputs["data2"][0];

//    process_list.map((a) => path = path + '/' + a);
    var steatosis_percentage = await API.get(
      "/fattyLiverServer/"+input_data1.path + "/steatosis_percentage"
    );
//    console.log("additional value: ",steatosis_percentage.data)

    var viewer_data ={
      path: [input_data1.path,input_data2.path],
      server: [input_data1.server,input_data2.server],
      additional_value: steatosis_percentage.data,
    };

    this.editor.nodes
    .find((n) => n.id === node.id)
    .controls.get("data")
    .setValue(viewer_data);


    // window.open(
    //   "http://117.52.72.211/viewer:path="+file
    // );

//    ReactDOM.render(<PopUpViewer />, document.getElementById('root'));
  }
}
