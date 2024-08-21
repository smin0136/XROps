import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../utils/axios";
import "./file-explorer.styles.scss";
import PlusIcon from '@rsuite/icons/Plus';
import CloseIcon from '@rsuite/icons/Close';
import { Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';
import {
  getTaskStatus,
  getFilesAPI,
  getFoldersAPI,
  XRGetPrefixFilesAPI
} from "../api";


var baseURL="https://vience.io:6040/";


const Explorer = (props) => {
  console.log(props);
  var [dir,setDir] = useState(props.path.split('/').slice(0, -1).join('/'));

  var [file,setFile] = useState('');

  var [fileList,setFileList] = useState([]);

  var [comment,setComment] = useState('');

  const changeFile = async (e) => {
    var v = {target: {value: e.target.id}};
    file = e.target.id;
    await getMetaInfo();
    setFile(file);
  };

  async function getFileList(){
    fileList = await XRGetPrefixFilesAPI(props.path);
    setFileList(fileList);
  }

  useEffect(() => {
    getFileList();
  }, []);


  var folder_list_html = [];
  folder_list_html.push(
    <p id={props.path} className="folder-text">{props.path}</p>
  );

  var file_list_html = [];
  for (let i = 0; i < fileList.length; i++) {
    var file_name = fileList[i].split("/").at(-1);
    var file_ext = fileList[i].split(".").at(-1);
    if(file_ext === 'tif' || file_ext === 'tiff' || file_ext === 'png' || file_ext === 'jpg'){
      if(file_name===file){
        file_list_html.push(
          <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <div id={file_name} className="file-snapshot selected" onClick={changeFile} 
              style={{backgroundImage: "url("+baseURL+"holoSensor/get_snapshot/"+fileList[i]+")"}}></div>
            <p className="file-text">{file_name}</p>
          </div>
        );  
      }
      else{
        file_list_html.push(
          <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <div id={file_name} className="file-snapshot" onClick={changeFile} 
              style={{backgroundImage: "url("+baseURL+"holoSensor/get_snapshot/"+fileList[i]+")"}}></div>
              <p className="file-text">{file_name}</p>
          </div>
        );
      }  
    }
    else{
      if(file_name===file){
        file_list_html.push(
          <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <div id={file_name} className="file-snapshot selected" onClick={changeFile} style={{backgroundImage: "url(data.png)"}}></div>
            <p className="file-text">{file_name}</p>
          </div>
        );  
      }
      else{
        file_list_html.push(
          <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <div id={file_name} className="file-snapshot" onClick={changeFile} style={{backgroundImage: "url(data.png)"}}></div>
              <p className="file-text">{file_name}</p>
          </div>
        );
      }  
    }
  }




  const getMetaInfo = async () => {

  };
  

  return (
    <div
      style={{display: "flex",flexDirection: "column"}}
    >
      <p style={{color: "white",fontWeight: "700",fontSize: "20px", marginBottom: "20px"}}>Cloud Storage Explorer</p>
      
      <div
        style={{display: "flex",flexDirection: "row"}}
      >
        <div className="left-panel">
          <div style={{display: "flex", alignItems: "end", marginBottom: "10px"}}>
            <IconButton className="button-1" icon={<PlusIcon />} appearance="default" active 
                        style={{marginLeft: "auto",marginRight: "10px",marginTop: "10px", marginBottom: "10px", borderRadius: "20px / 20px"}}/>
          </div>
          <div style={{display: "flex", alignItems: "baseline", marginBottom: "10px",marginLeft: "15px"}}>
            {/* <p style={{color: "white",fontWeight: "700"}}>{dir}</p> */}
          </div>
          <div className="list-panel">
            <folder-list>
              {folder_list_html}
            </folder-list>
          </div>
        </div>
        <div className="middle-panel">
          <div style={{display: "flex", alignItems: "end", marginBottom: "10px"}}>
            <IconButton className="button-1" icon={<PlusIcon />} appearance="default" active 
                        style={{marginLeft: "auto",marginRight: "10px",marginTop: "10px", marginBottom: "10px",borderRadius: "20px / 20px"}}/>
          </div>
          <file-list>
            {file_list_html}
          </file-list>

        </div>

        <div className="right-panel">

          <div className="preview-panel" style={{backgroundImage: "url("+baseURL+"holoSensor/get_snapshot/"+dir+"/"+file+")", backgroundPosition: "center", backgroundRepeat: "no-repeat"}}> 
          </div>
          <div className="metadata-panel">
            <p style={{paddingTop: "20px", color: "white",fontWeight: "700",textDecoration: "underline"}}>Annotation</p>

            <textarea className="annotation-panel"
              placeholder="write annotation..."
              value={comment}
            />

          </div>

        </div>
      </div>

    </div>
  );
};

export default Explorer;
