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
  getFoldersAPI
} from "../api";


var baseURL="https://vience.io:6040/";


const Explorer = (props) => {
  console.log(props);
  var [dir,setDir] = useState(props.path);

  var [file,setFile] = useState(props.file);


  var [fileList,setFileList] = useState([]);
  var [folderList,setFolderList] = useState([]);

  var [comment,setComment] = useState('');
  var [width_text,setWidth_text] = useState('');
  var [height_text,setHeight_text] = useState('');


  async function getFileList(){
    const data = await getFilesAPI(dir,'.tif,.png,.jpg');
    fileList = data.map((a) => a.file_id);
    setFileList(fileList);
  }
  async function getFolderList(){
    const data = await getFoldersAPI(dir);
    folderList = data.map((a) => a.file_id);
    if(dir==='' || dir==='/' || dir==='.' || dir==='./'){

    }
    else {
      folderList.splice(0,0,[".. (back)"]);
    }
    setFolderList(folderList);
  }

  const changeFile = async (e) => {
    var v = {target: {value: e.target.id}};
    props.changeFile(v);
    file = e.target.id;
    await getMetaInfo();
    setFile(file);
  };

  const changeFolder = (e) => {
    console.log('change folder: ');
    console.log(e);
    var target = e.target.id;
    if(target==='.. (back)'){
      var dirs = dir.split('/');
      var endInd;
      if(dirs[dirs.length-1]==='/'){
        endInd = dirs.length-2;
      }
      else{
        endInd = dirs.length-1;
      }
      dir = dirs.slice(0,endInd).join("/");
    }
    else{
      var dirs = dir.split('/');
      if(dirs[dirs.length-1]==='/' || dirs[dirs.length-1]===''){
        dir = dir + target;
      }
      else{
        dir = dir + '/' + target;
      }
      var v = {target: {value: dir}};
    }
    var v = {target: {value: dir}};
    props.setPath(v);
    setDir(dir);
    getFileList();
    getFolderList();  
    props.updateFiles();  
};


  useEffect(() => {
    getFileList();
    getFolderList();
    getMetaInfo();
  }, []);



  var path;
  if(file==='' || file===undefined){
  }
  else{
    if(dir.length==0 || dir.slice(-1)==='/'){
      path=dir + file;
    }
    else{
      path=dir + '/' +  file;
    }
  }


  var folder_list_html = [];
  for (let i = 0; i < folderList.length; i++) {
    folder_list_html.push(
      <p id={folderList[i]} className="folder-text" onClick={changeFolder}>{folderList[i]}</p>
    );
  }

  var file_list_html = [];
  for (let i = 0; i < fileList.length; i++) {
    var each_path;
    if(fileList[i]==='' || fileList[i]===undefined){
    }
    else{
      if(dir.length==0 || dir.slice(-1)==='/'){
        each_path=dir + fileList[i];
      }
      else{
        each_path=dir + '/' +  fileList[i];
      }
    }  
    if(fileList[i]===file){
      file_list_html.push(
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
          <div id={fileList[i]} className="file-snapshot selected" onClick={changeFile} 
            style={{backgroundImage: "url("+baseURL+"holoSensor/get_snapshot//workspace/xrops/users/"+each_path+")"}}></div>
          <p className="file-text">{fileList[i]}</p>
        </div>
      );  
    }
    else{
      file_list_html.push(
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
          <div id={fileList[i]} className="file-snapshot" onClick={changeFile} 
            style={{backgroundImage: "url("+baseURL+"holoSensor/get_snapshot//workspace/xrops/users/"+each_path+")"}}></div>
          <p className="file-text">{fileList[i]}</p>
        </div>
      );
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
            <p style={{color: "white",fontWeight: "700"}}>{dir}</p>
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

          <div className="preview-panel" style={{backgroundImage: "url("+baseURL+"holoSensor/get_snapshot//workspace/xrops/users/"+path+")", backgroundPosition: "center", backgroundRepeat: "no-repeat"}}> 
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
