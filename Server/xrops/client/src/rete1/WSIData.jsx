import Rete from "rete";
import parse from "html-react-parser";
import {textSocket, currentEditor} from "./rete";
import {
  getTaskStatus,
  getFilesAPI

} from "./api";
import { useEffect, useState } from "react";

import { working_directory } from "./api";

var files = '<option>Select Data...</option>'

export class WSIDataControl extends Rete.Control {

  static component = ({ value, onChange }) => {


    var [workingDir,setWorkingDir] = useState(value['dir']);
    var [fileList,setFileList] = useState(["Select Data..."]);
    var [file,setFile] = useState(value['file']);

    async function getFileList(){
      const data = await getFilesAPI(workingDir);
      fileList = data.map((a) => a.file_id);
      fileList.splice(0,0,["Select Data..."]);
//      console.log(fileList);
  
      var newList = fileList.map((x) => `<option>${x}</option>`);
      files = newList.join("\n");
      currentEditor.trigger("process");
      setFileList(fileList)
    }
    
    useEffect(() => {
      getFileList();
    }, []);
  
    const setPath = (e) => {
      console.log(e);
      workingDir=e.target.value;
      setWorkingDir(e.target.value);
      onChange({dir: workingDir, file: file});
    };

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
         <p className="text">Working Directory</p>
         <div style={{paddingBottom:"5px"}}>
         <input className="textEdit"
            type="text"
            placeholder="working directory..."
            onChange={setPath}
            defaultValue={workingDir}
          />
          </div>
          
        <p className="text">File</p>
        <div style={{paddingBottom:"5px",paddingLeft:"10px"}}>
          <select 
            value={value['file']} 
            onChange={(e) => {
              console.log(e);
              file=e.target.value;
              setFile(e.target.value);
              onChange({dir: workingDir, file: file});
            }}
            onClick={() => {
              getFileList();
            }}
            style={{width: "100%", height: "40px"}}      
            >
            {parse(files)}
          </select>
        </div>
      </div>
    );
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);


    this.emitter = emitter;
    this.key = key;
    this.component = WSIDataControl.component;

    node.id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
    const initial = node.data[key] || 0;
//    console.log(initial);

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
    // console.log(val);
    this.props.value = val;
    this.putData(this.key, val);
    this.update();
  }



}

export class WSIDataComponent extends Rete.Component {
  constructor() {
    super("Whole Slide Image");
    this.node_id =
      Date.now().toString() + (Math.random() + 1).toString(36).substring(7);
  }

  builder(node) {
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new WSIDataControl(this.editor, "data", node);

    return node.addControl(ctrl).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
//    console.log(node.data.data);

    var data = {
      process_list: [],
      ROI_list: [],
      server: 'openslideServer',
    };


    if(node.data.data["dir"].length==0 || node.data.data["dir"].slice(-1)==='/'){
      data['path']=node.data.data["dir"] + node.data.data["file"];
//      outputs["data"]=working_directory + node.data.data_path;
    }
    else{
      data['path']=node.data.data["dir"] + '/' + node.data.data["file"];
    }
    outputs["data"]=data;
    console.log(data);
  }
}
