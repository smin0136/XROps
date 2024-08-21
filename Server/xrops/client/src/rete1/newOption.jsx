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

export class OptionControl1 extends Rete.Control {
    static component = ({ value, onChange }) => {

        const [switchVal, setSwitchVal] = useState(false);

        const handleStart = (e) => {
            setSwitchVal(!switchVal);
        };
        //Console.log(value);
        return (
            <div>
                <Button onClick={handleStart}> {switchVal ? "Stop" : "Start"}</Button>
            </div>
        );
    };

    constructor(emitter, key, node, readonly = false) {
        super(key);

        console.log("123ad");
        this.emitter = emitter;
        this.key = key;
        this.component = OptionControl1.component;

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

export class OptionComponent1 extends Rete.Component {
    constructor() {
        super("Start Button");

        this.node_id =
            Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    }

    builder(node) {
        node.isStart = true;
        var out1 = new Rete.Output("isStart", "", textSocket);
        var ctrl = new OptionControl1(this.editor, "data", node);

        return node.addControl(ctrl).addOutput(out1);
    }

    worker(node, inputs, outputs) {
    }
}
