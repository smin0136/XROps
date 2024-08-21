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

export class StartControl extends Rete.Control {
    static component = ({ value, onChange }) => {

        const [switchVal, setSwitchVal] = useState(false);

        const handleStart = (e) => {
            setSwitchVal(!switchVal);
        };
        //Console.log(value);
        let divStyle = {
            'background-color': switchVal ? "powderblue" : "white"
        }
        return (
            <Button style ={divStyle} onClick={handleStart}> {switchVal ? "Stop" : "Start"}</Button>
        );
    };

    constructor(emitter, key, node, readonly = false) {
        super(key);

        console.log("Create start component");
        this.emitter = emitter;
        this.key = key;
        this.component = StartControl.component;

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

export class StartComponent extends Rete.Component {
    constructor() {
        super("Start Button");

        this.node_id =
            Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    }

    builder(node) {
        node.isStart = true;
        var out1 = new Rete.Output("isStart", "", textSocket);
        var ctrl = new StartControl(this.editor, "data", node);

        return node.addControl(ctrl).addOutput(out1);
    }

    worker(node, inputs, outputs) {
    }
}
