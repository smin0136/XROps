import Rete from "rete";
import { textSocket } from "./rete";

import "./viewer.css"
import { useEffect, useState } from "react";

import ReactDOM from "react";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';

import Viewer from "../routes/viewer/viewer-threshold.component";


export class ImageControl extends Rete.Control {

  static component = ({ value, onChange }) => {
    const [size, setSize] = useState();
    const [open, setOpen] = useState(false);

    // console.log(value);

    const handleOpen = (e) => {
      onChange(+e.target.value)
      e.stopPropagation();
      // console.log(value);
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
        <Viewer server={value.server} path={value.path} user_id='exp_user1'/>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>


        {/* <Button
          style={{ marginTop: "10px" }}
          onChange={(e) => onChange(+e.target.value)}
          onClick={(e) => {
            onChange(+e.target.value)
            e.stopPropagation();
            console.log(value);
          }}
        >
          Viewer
        </Button> */}
      </div>
    );
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = ImageControl.component;

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

export class ImageComponentThrehsold extends Rete.Component {
  constructor() {
    super("Interactive Viewer");
    this.node_id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new ImageControl(this.editor, "data", node);
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);

    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];
    var file = input_data.path;
    var process_list = input_data.process_list;
    var path = file;

//    process_list.map((a) => path = path + '/' + a);
    
    // console.log(path);

    var viewer_data ={
      path: path,
      server: input_data.server,
    }

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(viewer_data);

    // window.open(
    //   "http://117.52.72.211/viewer:path="+file
    // );

//    ReactDOM.render(<PopUpViewer />, document.getElementById('root'));

    var data = {
      process_list: [...input_data.process_list],
      ROI_list: [...input_data.ROI_list],
      path: input_data.path,
      server: input_data.server,
    };


    // console.log(file);
    // console.log(data);
    outputs["data"] = data;
  }
}
