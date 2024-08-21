import Rete from "rete";
import { textSocket } from "./rete";

import "./viewer.css"
import { useEffect, useState } from "react";

import ReactDOM from "react";
import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';

import Viewer from "../routes/viewer/viewer-cellPlate.component";
import { Line, Circle } from 'rc-progress';
import API from "../utils/axios";



var timerRef=null;

export class ImageControl extends Rete.Control {

  static component = ({ value, onChange }) => {
    const [size, setSize] = useState();
    const [open, setOpen] = useState(false);

    const [completion,setCompletion] = useState(0);

    console.log(value);

    const handleOpen = (e) => {
      onChange(value);
      e.stopPropagation();
      setSize('full');
      setOpen(true);
    }
    const handleClose = () => setOpen(false);

    API.get(
      "/cellProcessingServer/"+ value.path + "/dzi_generation"
    );

    useEffect(() => {
      const timer = setInterval(async () => {
        var progress = await API.get(
          "/cellProcessingServer/"+ value.path + "/progress"
        );
        setCompletion(completion => completion = progress.data);
      }, 1000);
      
      return () => clearInterval(timer);
    });


    if(completion<100){
      return (
        <div style={{ display: "flex", flexDirection: "row" }}>
          <Line percent={completion} strokeWidth={4} strokeColor="rgb(0,0,200)" />
          <label style={{color: "white", marginLeft: "10px", fontWeight: "700", fontSize: "12px" }}>{completion}%</label>
        </div>
      );  
    }
    else{
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
            <Viewer server={value.server} path={value.path} feature1={value.feature1} user_id='exp_user1'/>
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
    }
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

export class ImageComponentCellPlate extends Rete.Component {
  constructor() {
    super("Cell Plate Viewer");
    this.node_id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
  }

  builder(node) {
    var in1 = new Rete.Input("data", "Img", textSocket);

    var feature1 = new Rete.Input("feature1", "Feature1", textSocket);
    var feature2 = new Rete.Input("feature2", "Feature2", textSocket);


    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new ImageControl(this.editor, "data", node);
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);

    return node.addControl(ctrl).addInput(in1).addInput(feature1).addInput(feature2);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];
    var file = input_data.path;
    var process_list = input_data.process_list;
    var path = file;

    var feature1_data = inputs["feature1"][0];
    console.log(feature1_data);

    var set_feature1=true;

    if(feature1_data===undefined){
      set_feature1=false;
    }

//    process_list.map((a) => path = path + '/' + a);
    
    // console.log(path);

    var viewer_data ={
      path: path,
      server: input_data.server,
      feature1: set_feature1,
    };

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
