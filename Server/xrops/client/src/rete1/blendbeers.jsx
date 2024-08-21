import Rete from "rete";
import { textSocket } from "./rete";
import { postDziAPI, getFilteredImage2API, getTaskStatus } from "./api";
import { findDOMNode } from "react-dom";

export class BlendBeersControl extends Rete.Control {
  static component = ({ value, red, green, onChange }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option selected>Please Select</option>
          <option>collagen</option>
          <option>nuclei</option>
        </select>
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
    this.component = BlendBeersControl.component;

    const initial = node.data[key] || 0;

    node.data[key] = initial;
    this.props = {
      readonly,
      value: initial,
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
export class BlendBeersComponent extends Rete.Component {
  constructor(type) {
    super(`Blend Beers`);

    this.node_id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    this.filter_type = type.replace(" ", "").toLowerCase();
    this.state = {
      data: {},
    };
  }

  builder(node) {
    var in1 = new Rete.Input("image1", "Image1", textSocket);
    var in2 = new Rete.Input("image2", "Image2", textSocket);
    var out1 = new Rete.Output("image", "Image", textSocket);
    var ctrl = new BlendBeersControl(this.editor, "image", node);
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    return node.addControl(ctrl).addInput(in1).addInput(in2).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var redStatus = false;
    var greenStatus = false;
    var filter = node.data.image;
    var file1 = inputs["image1"][0];
    console.log(file1);
    redStatus = true;
    console.log(this.node_id);
    var data1_1 = {
      storageFilePath: file1["storage_file_path"],
      inputType: file1["file_type"],
      filterType: "blend",
      userId: "kuvis_user1",
      nodeId: node.id,
      nodeType: "filter",
      skip: file1["skip"],
      topLevel: file1["top_level"],
      withPyramid: file1["with_pyramid"],
      highestLevelAll: file1["highest_level_all"],
      beers: true,
      filter: filter.toString(),
    };
    var data1_2 = {
      storageFilePath: file1["storage_file_path"],
      inputType: file1["file_type"].replace(/\_downscaled/g, ""),
      filterType: "blend",
      userId: "kuvis_user1",
      nodeId: node.id,
      nodeType: "filter",
      doBackground: true,
      minCol: file1["min_col"],
      maxCol: file1["max_col"],
      minRow: file1["min_row"],
      maxRow: file1["max_row"],
      curLevel: file1["cur_level"],
      allTiles: false,
      skip: file1["skip"],
      topLevel: file1["top_level"],
      withPyramid: file1["with_pyramid"],
      highestLevelAll: file1["highest_level_all"],
      beers: true,
      filter: filter.toString(),
    };
    console.log(data1_1);
    console.log(data1_2);

    var file2 = inputs["image2"][0];
    console.log(file2);
    var data2_1 = {
      storageFilePath: file2["storage_file_path"],
      inputType: file2["file_type"],
      filterType: "blend",
      userId: "kuvis_user1",
      nodeId: node.id,
      nodeType: "filter",
      skip: file2["skip"],
      topLevel: file2["top_level"],
      withPyramid: file2["with_pyramid"],
      highestLevelAll: file2["highest_level_all"],
      beers: true,
      filter: filter.toString(),
    };
    var data2_2 = {
      storageFilePath: file2["storage_file_path"],
      inputType: file2["file_type"].replace(/\_downscaled/g, ""),
      filterType: "blend",
      userId: "kuvis_user1",
      nodeId: node.id,
      nodeType: "filter",
      doBackground: true,
      minCol: file2["min_col"],
      maxCol: file2["max_col"],
      minRow: file2["min_row"],
      maxRow: file2["max_row"],
      curLevel: file2["cur_level"],
      allTiles: false,
      skip: file2["skip"],
      topLevel: file2["top_level"],
      withPyramid: file2["with_pyramid"],
      highestLevelAll: file2["highest_level_all"],
      beers: true,
      filter: filter.toString(),
    };
    console.log(data2_1);
    console.log(data2_2);
    if (this.state.data !== data1_1) {
      var filteredFileDownscaled = await getFilteredImage2API(data1_1, data2_1);
      console.log(filteredFileDownscaled);
      var filteredFile = await getFilteredImage2API(data1_2, data2_2);
      console.log(filteredFile);
      filteredFileDownscaled["min_col"] = file1["min_col"];
      filteredFileDownscaled["max_col"] = file1["max_col"];
      filteredFileDownscaled["min_row"] = file1["min_row"];
      filteredFileDownscaled["max_row"] = file1["max_row"];
      filteredFileDownscaled["cur_level"] = file1["cur_level"];
      filteredFileDownscaled["skip"] = file1["skip"];
      filteredFileDownscaled["top_level"] = file1["top_level"];
      filteredFileDownscaled["with_pyramid"] = file1["with_pyramid"];
      filteredFileDownscaled["highest_level_all"] = file1["highest_level_all"];
      outputs["image"] = filteredFileDownscaled;
      this.state.data = data1_1;

      var interval = setInterval(async () => {
        var downscaledStatus = await getTaskStatus(filteredFile["task_id"]);
        console.log(downscaledStatus);
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
      .setValue(filter);

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
