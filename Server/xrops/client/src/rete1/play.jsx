import Rete from "rete";
import parse from "html-react-parser";
import API from "../utils/axios";
import { textSocket, list1 } from "./rete";
import { useEffect } from "react";
import { Button } from "rsuite";
import { COLOR } from "rsuite/esm/utils";
import { purgeAPI } from "./api";
var state = "0";

export class PlayControl extends Rete.Control {
  static component = ({ value, onChange }) => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Button
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#19612c",
            fontWeight: "700",
            color: "#ffffff",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onChange();
            purgeAPI();
          }}
        >
          Process ▶
        </Button>
      </div>
    );
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = PlayControl.component;

    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    const initial = node.data[key] || 0;
    console.log(initial);

    node.data[key] = initial;
    this.props = {
      readonly,
      value: "0",
      onChange: async (v) => {
        this.setValue("1");
        state = "1";
        this.emitter.trigger("process");
      },
    };
  }

  setValue(val) {
    console.log(val);
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }
}

export class PlayComponent extends Rete.Component {
  constructor() {
    super("Process");
  }

  builder(node) {
    var ctrl = new PlayControl(this.editor, "play", node);
    var out1 = new Rete.Output("state", "", textSocket);
    return node.addControl(ctrl).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    outputs["state"] = state;
    state = "0";
  }
}
