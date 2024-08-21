import Rete from "rete";
import { textSocket } from "./rete";
import { postDziAPI, getFilteredImageAPI, getTaskStatus } from "./api";
import { findDOMNode } from "react-dom";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-one_dark";
import "ace-builds/src-noconflict/ext-language_tools";

export class CodeControl extends Rete.Control {
  static component = ({ value, red, green, onChange }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AceEditor
          mode="python"
          theme="one_dark"
          editorProps={{ $blockScrolling: true }}
          width="300px"
          height="200px"
          fontSize={15}
          value='print("Hello HVCL")'
        />
        <div
          style={{ marginTop: "5px", marginLeft: "auto", marginRight: "0px" }}
        >
          <svg height="14" width="14" style={{ marginRight: "5px" }}>
            <circle
              cx="7"
              cy="7"
              r="7"
              fill={`rgba(255,0,0,${red ? 0.8 : 0.2})`}
            />
          </svg>
          <svg height="14" width="14">
            <circle
              cx="7"
              cy="7"
              r="7"
              fill={`rgba(0,255,0,${green ? 0.8 : 0.2})`}
            />
          </svg>
        </div>
      </div>
    );
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = CodeControl.component;

    const initial = node.data[key] || 0;

    node.data[key] = initial;
    this.props = {
      readonly,
      value: 0,
      red: false,
      green: false,
      onChange: (v) => {
        this.setValue(v);
        // this.emitter.trigger("process");
      },
    };
  }

  setValue(val) {
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }
  setRed(val) {
    this.props.red = val;
    this.update();
  }
  setGreen(val) {
    this.props.green = val;
    this.update();
  }
}
export class CodeComponent extends Rete.Component {
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
    var in1 = new Rete.Input("image", "Image", textSocket);
    var out1 = new Rete.Output("image", "Image", textSocket);
    var ctrl = new CodeControl(this.editor, "image", node);
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var amount = "0";
    var redStatus = false;
    var greenStatus = false;
    amount = node.data.image;
    console.log(inputs["image"][0]);
    var file = inputs["image"][0];
    redStatus = true;
    console.log(this.node_id);
    var data1 = {
      storageFilePath: file["storage_file_path"],
      inputType: file["file_type"],
      filterType: this.filter_type,
      userId: "kuvis_user1",
      nodeId: node.id,
      nodeType: "filter",
      amount: amount.toString(),
      skip: file["skip"],
      topLevel: file["top_level"],
      withPyramid: file["with_pyramid"],
      highestLevelAll: file["highest_level_all"],
    };
    var data2 = {
      storageFilePath: file["storage_file_path"],
      inputType: file["file_type"].replace("_downscaled", ""),
      filterType: this.filter_type,
      userId: "kuvis_user1",
      nodeId: node.id,
      nodeType: "filter",
      amount: amount.toString(),
      doBackground: true,
      minCol: file["min_col"],
      maxCol: file["max_col"],
      minRow: file["min_row"],
      maxRow: file["max_row"],
      curLevel: file["cur_level"],
      allTiles: false,
      skip: file["skip"],
      topLevel: file["top_level"],
      withPyramid: file["with_pyramid"],
      highestLevelAll: file["highest_level_all"],
    };
    console.log(data1);
    console.log(data2);
    if (this.state.data !== data1) {
      var filteredFileDownscaled = await getFilteredImageAPI(data1);
      console.log(filteredFileDownscaled);
      var filteredFile = await getFilteredImageAPI(data2);
      console.log(filteredFile);
      filteredFileDownscaled["min_col"] = file["min_col"];
      filteredFileDownscaled["max_col"] = file["max_col"];
      filteredFileDownscaled["min_row"] = file["min_row"];
      filteredFileDownscaled["max_row"] = file["max_row"];
      filteredFileDownscaled["cur_level"] = file["cur_level"];
      filteredFileDownscaled["skip"] = file["skip"];
      filteredFileDownscaled["top_level"] = file["top_level"];
      filteredFileDownscaled["with_pyramid"] = file["with_pyramid"];
      filteredFileDownscaled["highest_level_all"] = file["highest_level_all"];
      outputs["image"] = filteredFileDownscaled;
      this.state.data = data1;

      var interval = setInterval(async () => {
        var downscaledStatus = await getTaskStatus(filteredFile["task_id"]);
        if (downscaledStatus === "SUCCESS") {
          redStatus = false;
          greenStatus = true;
          this.editor.nodes
            .find((n) => n.id == node.id)
            .controls.get("image")
            .setRed(redStatus);
          this.editor.nodes
            .find((n) => n.id == node.id)
            .controls.get("image")
            .setGreen(greenStatus);
          clearInterval(interval);
        } else if (downscaledStatus === "PENDING") {
          redStatus = true;
          greenStatus = false;
          this.editor.nodes
            .find((n) => n.id == node.id)
            .controls.get("image")
            .setRed(redStatus);
          this.editor.nodes
            .find((n) => n.id == node.id)
            .controls.get("image")
            .setGreen(greenStatus);
          // console.log(downscaledStatus);
        } else {
          clearInterval(interval);
        }
      }, 1000);
    }
    // console.log(
    //   this.editor.nodes.find((n) => n.id == node.id).controls.get("image")
    // );
    console.log(redStatus);
    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("image")
      .setValue(amount);

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("image")
      .setRed(redStatus);

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("image")
      .setGreen(greenStatus);
  }
}
