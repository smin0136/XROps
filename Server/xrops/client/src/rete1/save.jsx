import Rete from "rete";
import { Panel, PanelGroup, Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';
import { textSocket } from "./rete";
import { findDOMNode } from "react-dom";
import SaveIcon from '@rsuite/icons/legacy/Save';
import { Line, Circle } from 'rc-progress';
import { useState } from "react";

var interval1=null;
var is_process=false;
export class SaveControl extends Rete.Control {
  static component = ({ value, onChange }) => {

    const [completion,setCompletion] = useState(value.completion);

  
    var path=value.path;
    const do_save = (e) => {
      console.log(e);
      is_process=true;
      interval1 = setInterval(async () => {
        setCompletion(completion => completion+10);
      }, 1000);
    };
    const setPath = (e) => {
      console.log(e);
      path=e.target.value;
      onChange({path: path,
        completion: completion,});
    };

    if(is_process && completion>=100){
      setCompletion(100);
      clearInterval(interval1);
      onChange({path: path,
        completion: 100,});
      is_process=false;
    }


    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <input className="textEdit"
            type="text"
            placeholder="save path..."
            onChange={setPath}
            defaultValue={path}
          />
          <IconButton onClick={do_save} className="button-1" id="infovis_button" icon={<SaveIcon />} color="blue" appearance="primary" />
        </div>
        <div style={{ display: "flex", flexDirection: "row", marginTop: "10px" }}>
          <Line percent={completion} strokeWidth={4} strokeColor="rgb(0,0,200)" />
          <label style={{color: "white", marginLeft: "10px", fontWeight: "700", fontSize: "12px" }}>{completion}%</label>
        </div>
      </div>
    );
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = SaveControl.component;

    const initial = node.data[key] || {path: '', completion: 0};

    console.log(key);
    console.log(node.data[key]);

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
export class SaveComponent extends Rete.Component {
  constructor() {
    super("Save");

    this.node_id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new SaveControl(this.editor, "data", node);
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];

    var data = {
      process_list: [...input_data.process_list],
      ROI_list: [...input_data.ROI_list],
      path: input_data.path,
      server: input_data.server,
    };

    outputs["data"] = data;
  }
}
