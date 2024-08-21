import Rete from "rete";
import { textSocket } from "./rete";

export class TextControl extends Rete.Control {
  static component = ({ value, onChange }) => (
    <input
      type="text"
      value={value}
      ref={(ref) => {
        ref && ref.addEventListener("pointerdown", (e) => e.stopPropagation());
      }}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  constructor(emitter, key, node, readonly = false) {
    super(key);
    this.emitter = emitter;
    this.key = key;
    this.component = TextControl.component;

    const initial = node.data[key] || 0;

    node.data[key] = initial;
    this.props = {
      readonly,
      value: initial,
      onChange: (v) => {
        this.setValue(v);
        this.emitter.trigger("process");
        if (this.parent.node) {
          this.parent.node.update();
        } else {
          this.parent.update();
        }
      },
    };
  }

  setValue(val) {
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }
}

export class TextComponent extends Rete.Component {
  constructor() {
    super("Text");
  }

  builder(node) {
    var out1 = new Rete.Output("text", "Text", textSocket);
    var ctrl = new TextControl(this.editor, "text", node);

    return node.addControl(ctrl).addOutput(out1);
  }

  worker(node, inputs, outputs) {
    outputs["text"] = node.data.text;
  }
}
