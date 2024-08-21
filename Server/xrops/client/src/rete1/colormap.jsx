import Rete from "rete";
import { textSocket } from "./rete";
import {
  postDziAPI,
  getFilteredImageAPI,
  getTaskStatus,
  getColormapAPI,
} from "./api";
import { useState } from "react";
import { findDOMNode } from "react-dom";
import reactCSS from "reactcss";
import { SketchPicker, CompactPicker, ChromePicker } from "react-color";
import { setTranslate3d } from "rsuite/esm/List/helper/utils";

export class ColorMapControl extends Rete.Control {
  static component = ({ value, red, green, onChange }) => {
    const [displayMinColorPicker, setDisplayMinColorPicker] = useState(false);
    const [displayMaxColorPicker, setDisplayMaxColorPicker] = useState(false);
    const [minColor, setMinColor] = useState();
    const [maxColor, setMaxColor] = useState();
    const stylesMin = reactCSS({
      default: {
        color: {
          width: "23px",
          height: "23px",
          borderRadius: "50px",
          background: `rgba(${value["min_r"]}, ${value["min_g"]}, ${
            value["min_b"]
          }, ${value["min_a"] * 0.01})`,
        },
        swatch: {
          marginLeft: "5px",
          padding: "3px",
          background: "#fff",
          borderRadius: "50px",
          boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
          display: "inline-block",
          cursor: "pointer",
        },
        popover: {
          position: "absolute",
          zIndex: "2",
        },
        cover: {
          position: "fixed",
          top: "0px",
          right: "0px",
          bottom: "0px",
          left: "0px",
        },
      },
    });
    const stylesMax = reactCSS({
      default: {
        color: {
          width: "23px",
          height: "23px",
          borderRadius: "50px",
          background: `rgba(${value["max_r"]}, ${value["max_g"]}, ${
            value["max_b"]
          }, ${value["max_a"] * 0.01})`,
        },
        swatch: {
          marginLeft: "5px",
          padding: "3px",
          background: "#fff",
          borderRadius: "50px",
          boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
          display: "inline-block",
          cursor: "pointer",
        },
        popover: {
          position: "absolute",
          zIndex: "2",
        },
        cover: {
          position: "fixed",
          top: "0px",
          right: "0px",
          bottom: "0px",
          left: "0px",
        },
      },
    });
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            marginTop: "5px",
            alignItems: "flex-start",
            marginLeft: "0px",
            marginRight: "auto",
          }}
        >
          <p
            style={{
              color: "white",
              marginRight: "3px",
            }}
          >
            Min
          </p>
          <input
            style={{ width: "50px" }}
            type="number"
            value={value["min_v"]}
            ref={(ref) => {
              ref &&
                ref.addEventListener("pointerdown", (e) => {
                  console.log(e);
                  e.stopPropagation();
                });
            }}
            onChange={(e) => onChange("min_v", +e.target.value)}
          />
          <div>
            <div
              style={stylesMin.swatch}
              onClick={() => {
                setDisplayMinColorPicker(!displayMinColorPicker);
              }}
            >
              <div style={stylesMin.color} />
            </div>
            {displayMinColorPicker ? (
              <div style={stylesMin.popover}>
                <div
                  style={stylesMin.cover}
                  onClick={() => {
                    setDisplayMinColorPicker(false);
                  }}
                />
                <ChromePicker
                  color={minColor}
                  onChange={(color) => {
                    console.log(color.rgb);
                    var tmp = value;
                    console.log(color);
                    tmp["min_r"] = color.rgb.r;
                    tmp["min_g"] = color.rgb.g;
                    tmp["min_b"] = color.rgb.b;
                    tmp["min_a"] = color.rgb.a * 100;
                    setMinColor(color.rgb);
                    onChange("min_r", color.rgb.r);
                    onChange("min_g", color.rgb.g);
                    onChange("min_b", color.rgb.b);
                    onChange("min_a", color.rgb.a * 100);
                    console.log(value);
                  }}
                />
              </div>
            ) : null}
          </div>
          <p
            style={{
              color: "white",
              marginLeft: "10px",
              marginRight: "3px",
            }}
          >
            R: {value["min_r"]}, G: {value["min_g"]}, B: {value["min_b"]}, A:
            {value["min_a"]}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            marginTop: "5px",
            alignItems: "flex-start",
            marginLeft: "0px",
            marginRight: "auto",
          }}
        >
          <p
            style={{
              color: "white",
              marginRight: "3px",
            }}
          >
            Max
          </p>
          <input
            style={{ width: "50px" }}
            type="number"
            value={value["max_v"]}
            ref={(ref) => {
              ref &&
                ref.addEventListener("pointerdown", (e) => {
                  console.log(e);
                  e.stopPropagation();
                });
            }}
            onChange={(e) => onChange("max_v", +e.target.value)}
          />
          <div>
            <div
              style={stylesMax.swatch}
              onClick={() => {
                setDisplayMaxColorPicker(!displayMaxColorPicker);
              }}
            >
              <div style={stylesMax.color} />
            </div>
            {displayMaxColorPicker ? (
              <div style={stylesMax.popover}>
                <div
                  style={stylesMax.cover}
                  onClick={() => {
                    setDisplayMaxColorPicker(false);
                  }}
                />
                <ChromePicker
                  color={maxColor}
                  onChange={(color) => {
                    console.log(color.rgb);
                    var tmp = value;
                    console.log(color);
                    tmp["max_r"] = color.rgb.r;
                    tmp["max_g"] = color.rgb.g;
                    tmp["max_b"] = color.rgb.b;
                    tmp["max_a"] = color.rgb.a * 100;
                    onChange("max_r", color.rgb.r);
                    onChange("max_g", color.rgb.g);
                    onChange("max_b", color.rgb.b);
                    onChange("max_a", color.rgb.a * 100);
                    setMaxColor(color.rgb);
                    console.log(value);
                  }}
                />
              </div>
            ) : null}
          </div>
          <p
            style={{
              color: "white",
              marginLeft: "10px",
              marginRight: "3px",
            }}
          >
            R: {value["max_r"]}, G: {value["max_g"]}, B: {value["max_b"]}, A:
            {value["max_a"]}
          </p>
        </div>

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
    this.component = ColorMapControl.component;

    const initial = node.data[key] || {
      min_v: 0,
      min_r: 0,
      min_g: 0,
      min_b: 0,
      min_a: 100,
      max_v: 0,
      max_r: 0,
      max_g: 0,
      max_b: 0,
      max_a: 100,
    };

    node.data[key] = initial;
    this.props = {
      readonly,
      value: initial,
      red: false,
      green: false,
      onChange: (k, v) => {
        var tmp = this.props.value;
        tmp[k] = v;
        console.log(tmp);
        this.setValue(tmp);
        // this.emitter.trigger("process");
      },
    };
  }

  setValue(val) {
    console.log(val);
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
export class ColorMapComponent extends Rete.Component {
  constructor() {
    super("Color Map");

    this.node_id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    this.state = {
      data: {},
    };
  }

  builder(node) {
    var in1 = new Rete.Input("image", "Image", textSocket);
    var out1 = new Rete.Output("image", "Image", textSocket);
    var ctrl = new ColorMapControl(this.editor, "image", node);
    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    return node.addControl(ctrl).addInput(in1).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
    var redStatus = false;
    var greenStatus = false;
    var current = node.data.image;
    console.log(current);
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
      minV: current["min_v"],
      maxV: current["max_v"],
      minR: current["min_r"],
      minG: current["min_g"],
      minB: current["min_b"],
      minA: (current["min_a"] * 255) / 100,
      maxR: current["max_r"],
      maxG: current["max_g"],
      maxB: current["max_b"],
      maxA: (current["max_a"] * 255) / 100,
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
      doBackground: true,
      minCol: file["min_col"],
      maxCol: file["max_col"],
      minRow: file["min_row"],
      maxRow: file["max_row"],
      curLevel: file["cur_level"],
      allTiles: false,
      minV: current["min_v"],
      maxV: current["max_v"],
      minR: current["min_r"],
      minG: current["min_g"],
      minB: current["min_b"],
      minA: (current["min_a"] * 255) / 100,
      maxR: current["max_r"],
      maxG: current["max_g"],
      maxB: current["max_b"],
      maxA: (current["max_a"] * 255) / 100,
      skip: file["skip"],
      topLevel: file["top_level"],
      withPyramid: file["with_pyramid"],
      highestLevelAll: file["highest_level_all"],
    };
    console.log(data1);
    console.log(data2);
    if (this.state.data !== data1) {
      var colormappedFileDownscaled = await getColormapAPI(data1);
      console.log(colormappedFileDownscaled);
      var colormappedFile = await getColormapAPI(data2);
      console.log(colormappedFile);
      colormappedFileDownscaled["min_col"] = file["min_col"];
      colormappedFileDownscaled["max_col"] = file["max_col"];
      colormappedFileDownscaled["min_row"] = file["min_row"];
      colormappedFileDownscaled["max_row"] = file["max_row"];
      colormappedFileDownscaled["cur_level"] = file["cur_level"];
      colormappedFileDownscaled["skip"] = file["skip"];
      colormappedFileDownscaled["top_level"] = file["top_level"];
      colormappedFileDownscaled["with_pyramid"] = file["with_pyramid"];
      colormappedFileDownscaled["highest_level_all"] =
        file["highest_level_all"];
      console.log(colormappedFileDownscaled);
      outputs["image"] = colormappedFileDownscaled;
      this.state.data = data1;

      var interval = setInterval(async () => {
        var downscaledStatus = await getTaskStatus(colormappedFile["task_id"]);
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
      .setValue(current);

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
