//Created by mskim at December 20
import Rete from "rete";
import parse from "html-react-parser";
import { textSocket, currentEditor } from "./rete";
import {
    getTaskStatus,
    getFilesAPI

} from "./api";
import { useEffect, useState } from "react";

import { XRConnectAPI } from "./api";

import { Modal, Button, ButtonToolbar, Placeholder } from 'rsuite';

export class OptionControl extends Rete.Control {

  static component = ({ value, onChange }) => {

    const exampleList = ["Please select data.", "XR1", "XR2", "XR3"];

    const [selected, setSelected] = useState(exampleList[0]);


    const optionList = exampleList.map(v => "<option>" + v + "</option>")
    const optionString = optionList.join("\n");
    const optionChanged = (v) => {
      setSelected(v);
    }


    return (
      <select
        onChange={e => optionChanged(e.target.value)}
        value={selected}
      >
        {parse(optionString)}
      </select>
    );
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = OptionControl.component;

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

export class OptionComponent extends Rete.Component {
    constructor() {
        super("Option");

        this.node_id =
            Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    }

    builder(node) {
    let in1 = new Rete.Input("data_path", "Input", textSocket);
    let out1 = new Rete.Output("data_path", "Output", textSocket);
    let ctrl = new OptionControl(this.editor, "output", node);
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);

    return node.addControl(ctrl).addInput(in1).addOutput(out1);
    }

    worker(node, inputs, outputs) {
    }
}
