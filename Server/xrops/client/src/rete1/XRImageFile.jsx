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
import Explorer from "./explorer/imagefile-explorer.component";



export class XRImageFileControl extends Rete.Control {

  static component = ({ value, onChange }) => {
    var [fileList,setFileList] = useState(["Select Data..."]);
    var [file,setFile] = useState(value['file']);
    var [refresh,setRefresh] = useState(0);

    const [open, setOpen] = useState(false);

    var [files,setFiles] = useState('<option>Select Data...</option>');

    const handleExplorerOpen = (e) => {
      onChange(value);
      e.stopPropagation();
      setOpen(true);
    }
    const handleExplorerClose = () => setOpen(false);


    async function getFileList(){
      const data = await getFilesAPI(value['dir'],'.tif,.png,.jpg');
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
      value['dir'] = e.target.value;
      currentEditor.trigger("process");
      onChange({dir: e.target.value, file: file, prev_key: value['prev_key']});
      setRefresh(refresh + 1);  
    };

    const changeFile = (e) => {
      console.log(e);
      file=e.target.value;
      setFile(e.target.value);
      currentEditor.trigger("process");
      onChange({dir: value['dir'], file: file, prev_key: value['prev_key']});
    };

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
         <p className="text">Working Directory</p>
         <div style={{paddingBottom:"5px"}}>
         <input className="textEdit"
            type="text"
            placeholder="working directory..."
            onChange={setPath}
            value={value['dir']}
          />
          </div>
          
        <p className="text">File</p>
        <div style={{display: "flex", paddingBottom:"5px",paddingLeft:"10px"}}>
          <select 
            value={file} 
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
              <Explorer path={value['dir']} file={file} changeFile={changeFile} setPath={setPath} updateFiles={getFileList}/>
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
    this.component = XRImageFileControl.component;

    const initial = node.data[key] || {dir: '', file: '',prev_key: ''};
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

export class XRImageFileComponent extends Rete.Component {
  constructor() {
    super("Image File");
  }

  builder(node) {
    var out1 = new Rete.Output("data", "", textSocket);
    var ctrl = new XRImageFileControl(this.editor, "data", node);
    var in1 = new Rete.Input("data", "", textSocket);

    return node.addControl(ctrl).addOutput(out1).addInput(in1);
  }

  async worker(node, inputs, outputs) {
//    console.log(node.data.data);
    var input_data = inputs["data"][0];

    if(input_data!==undefined){
      if(node.data.data["prev_key"]!==input_data.key){
        if(input_data.sensor!==0){
          node.data.data['dir'] = input_data.key;
          node.data.data['prev_key'] = input_data.key;
        }
        else if(input_data.sensor===0){
          node.data.data['dir'] = input_data.key + '/sensor_data/depth_map';
          node.data.data['prev_key'] = input_data.key;
        }
      }
    }


    var path ='';
    if(node.data.data["dir"]===''){
      path=node.data.data["dir"] + node.data.data["file"];
//      outputs["data"]=working_directory + node.data.data_path;
    }
    else if(node.data.data["dir"].slice(-1)==='/'){
      path=node.data.data["dir"] + node.data.data["file"];
//      outputs["data"]=working_directory + node.data.data_path;
    }
    else{
      path=node.data.data["dir"] + '/' + node.data.data["file"];
    }
    var data = {
      path: '/workspace/xrops/users/' + path
    };

    outputs["data"]=data;

    this.editor.nodes
      .find((n) => n.id == node.id)
      .controls.get("data")
      .setValue({dir: node.data.data["dir"],
                file: node.data.data["file"],
                prev_key: node.data.data["prev_key"]});

  }
}
