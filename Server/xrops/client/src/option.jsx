import Rete from "rete";
import parse from "html-react-parser";
import { textSocket, currentEditor } from "../rete";
import {
    getTaskStatus,
    getFilesAPI

} from "../api";
import { useEffect, useState } from "react";

import { XRConnectAPI } from "../api";

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

        const [switchVal, setSwitchVal] = useState(false);

        const handleStart = (e) => {
            setSwitchVal(!switchVal);
        };
        //Console.log(value);
        return (
          <div id="4566">
            <select
              onChange={e => optionChanged(e.target.value)}
              value={selected}
            >
              {parse(optionString)}
            </select>
          </div>
        );
    };

    constructor(emitter, key, node, readonly = false) {
        super(key);

        console.log("123ac");
        this.emitter = emitter;
        this.key = key;
        this.component = OptionControl.component;

        node.id =
            Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
        const initial = node.data[key] || 0;

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
        this.props.value = val;
        this.putData(this.key, val);
        this.update();
    }



}

export class OptionComponent extends Rete.Component {
    constructor() {
        super("Divice List");

        this.node_id =
            Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    }

    builder(node) {
        node.isStart = true;
        let in1 = new Rete.Input("Device", "", textSocket);
        let out1 = new Rete.Output("Device", "", textSocket);
        let ctrl = new OptionControl(this.editor, "data", node);

        return node.addControl(ctrl).addOutput(out1).addInput(in1);
    }

    worker(node, inputs, outputs) {
      
    }
}
