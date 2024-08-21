import Rete from "rete";
import parse from "html-react-parser";
import {textSocket, currentEditor} from "./rete";
import {
  getTaskStatus,
  getFilesAPI

} from "./api";
import { useEffect, useState } from "react";

import { working_directory } from "./api";

import SingleSource from '@rsuite/icons/SingleSource';
import { Modal, Button, ButtonToolbar, Placeholder,IconButton } from 'rsuite';
import Explorer from "./explorer/datafile-explorer.component";



export class XRDataFileControl extends Rete.Control {

  static component = ({ value, onChange }) => {
    var [workingDir,setWorkingDir] = useState(value['dir']);
    var [fileList,setFileList] = useState(["Select Data..."]);
    var [file,setFile] = useState(value['file']);

    var [files,setFiles] = useState('<option>Select Data...</option>');


    const [open, setOpen] = useState(false);

    const handleExplorerOpen = (e) => {
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => setOpen(false);


    async function getFileList(){
      const data = await getFilesAPI(workingDir,'.csv,.json');
      fileList = data.map((a) => a.file_id);
      fileList.splice(0,0,["Select Data..."]);
//      console.log(fileList);
  
      var newList = fileList.map((x) => `<option>${x}</option>`);
      files = newList.join("\n");
      setFiles(files);
      currentEditor.trigger("process");
      setFileList(fileList);
    }
    
    useEffect(() => {
      getFileList();
    }, []);
  
    const setPath = (e) => {
      console.log(e);
      workingDir=e.target.value;
      setWorkingDir(e.target.value);
      currentEditor.trigger("process");
      onChange({dir: workingDir, file: file});
    };

    const changeFile = (e) => {
      console.log(e);
      file=e.target.value;
      setFile(e.target.value);
      currentEditor.trigger("process");
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
            value={workingDir}
          />
          </div>
          
        <p className="text">File</p>
        <div style={{display: "flex", paddingBottom:"5px",paddingLeft:"10px"}}>
          <select 
            value={value['file']} 
            onChange={changeFile}
            onClick={() => {
              getFileList();
            }}
            style={{width: "100%", height: "40px", marginRight: "10px"}}      
            >
            {parse(files)}
          </select>

          <ButtonToolbar>
            <IconButton onClick={handleExplorerOpen} icon={<SingleSource />} appearance="default">
            </IconButton>
          </ButtonToolbar>
          <Modal className='explorer' size='full' open={open} onClose={handleExplorerClose}>
            <Modal.Header>
              <Modal.Title> </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Explorer path={workingDir} file={file} changeFile={changeFile} setPath={setPath} updateFiles={getFileList}/>
            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
          </Modal>

        </div>

      </div>
    );
  };

  constructor(emitter, key, node, readonly = false) {
    super(key);


    this.emitter = emitter;
    this.key = key;
    this.component = XRDataFileControl.component;

    const initial = node.data[key] || {dir: '', file: ''};
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

export class XRDataFileComponent extends Rete.Component {
  constructor() {
    super("Data File");
  }

  builder(node) {
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRDataFileControl(this.editor, "data", node);

    return node.addControl(ctrl).addOutput(out1);
  }

  async worker(node, inputs, outputs) {
//    console.log(node.data.data);

    var data = {
      path: ''
    };


    if(node.data.data["dir"].length==0 || node.data.data["dir"].slice(-1)==='/'){
      data['path']=node.data.data["dir"] + node.data.data["file"];
//      outputs["data"]=working_directory + node.data.data_path;
    }
    else{
      data['path']=node.data.data["dir"] + '/' + node.data.data["file"];
    }
    data['path']='/workspace/xrops/users/' + data['path'];

    this.editor.nodes
    .find((n) => n.id == node.id)
    .controls.get("data")
    .setValue({dir: node.data.data["dir"],
              file: node.data.data["file"]});

    outputs["data"]=data;
  }
}
