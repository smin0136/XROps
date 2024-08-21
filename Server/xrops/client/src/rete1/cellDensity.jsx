import Rete from "rete";
import { textSocket } from "./rete";
import { getTaskStatus, getLiverAPI } from "./api";
import { findDOMNode } from "react-dom";
import { useEffect, useState } from "react";
import API from "../utils/axios";
import { Line, Circle } from 'rc-progress';

export class cellDensityControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    const [completion,setCompletion] = useState(0);

    console.log(value);

    API.get(
      "/cellProcessingServer/"+ value + "/density_generation"
    );

    useEffect(() => {
      const timer = setInterval(async () => {
        var progress = await API.get(
          "/cellProcessingServer/"+ value + "/density/progress"
        );
        setCompletion(completion => completion = progress.data);
      }, 1000);
      
      return () => clearInterval(timer);
    });


    return (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <Line percent={completion} strokeWidth={4} strokeColor="rgb(0,0,200)" />
        <label style={{color: "white", marginLeft: "10px", fontWeight: "700", fontSize: "12px" }}>{completion}%</label>
      </div>
    );  
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = cellDensityControl.component;
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
export class cellDensityComponent extends Rete.Component {
  constructor(type) {
    super(`${type}`);

    this.node_id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    this.filter_type = type.replace(" ", "").toLowerCase();
    this.state = {
      data: {},
    };
  }

  builder(node) {
    var in1 = new Rete.Input("data", "", textSocket);
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new cellDensityControl(this.editor, "data", node);
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var input_data = inputs["data"][0];
    var file = input_data.path;
    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue(file);

    // window.open(
    //   "http://117.52.72.211/viewer:path="+file
    // );

//    ReactDOM.render(<PopUpViewer />, document.getElementById('root'));

    var data = {
      process_list: [...input_data.process_list],
      ROI_list: [...input_data.ROI_list],
      path: input_data.path,
      server: 'cellProcessingServer/density',
    };

    // console.log(file);
    data["process_list"].push("cell_density");
    // console.log(data);
    outputs["data"] = data;


  }
}
