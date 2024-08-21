import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../utils/axios";
import "./selector.styles.scss";
import PlusIcon from '@rsuite/icons/Plus';
import CloseIcon from '@rsuite/icons/Close';
import { Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';
import {
  getTaskStatus,
  getFilesAPI,
  getFoldersAPI
} from "../api";

import { AreaSelector, IArea } from '@bmunozg/react-image-area'


var baseURL="https://vience.io:6040/";


const Selector = (props) => {

  var [area, setArea] = useState([]);
  const onChangeHandler = (area) => {

    var img = document.querySelector("#image-obj");
    var width = img.width;
    var height = img.height;
    var realWidth = img.naturalWidth;
    var realHeight = img.naturalHeight;
    var xscale = realWidth / width;
    var yscale = realHeight / height;

    var xmin = area[0].x * xscale;
    var xmax = area[0].x * xscale + area[0].width * xscale;
    var ymin = area[0].y * yscale;
    var ymax = area[0].y * yscale + area[0].height * yscale;
       
    if(xmin>realWidth){
      xmin = realWidth;
      xmax = realWidth;
    }
    if(ymin>realHeight){
      ymin = realHeight;
      ymax = realHeight;
    }
    if(xmax<0){
      xmin = 0;
      xmax = 0;
    }
    if(ymax<0){
      ymin = 0;
      ymax = 0;
    }
    if(xmax>realWidth){
      xmax = realWidth;
    }
    if(ymax>realHeight){
      ymax = realHeight;
    }
    if(xmin<0){
      xmin = 0;
    }
    if(ymin<0){
      ymin = 0;
    }
    props.ROI.xmin = Math.round(xmin);
    props.ROI.xmax = Math.round(xmax);
    props.ROI.ymin = Math.round(ymin);
    props.ROI.ymax = Math.round(ymax);

    setArea(area);
  }
  const init = () => {
    if(props.ROI.xmin!==-1){
      var img = document.querySelector("#image-obj");
      if(img===null)return;
      var width = img.width;
      var height = img.height;
      var realWidth = img.naturalWidth;
      var realHeight = img.naturalHeight;
      var xscale_inv = width / realWidth;
      var yscale_inv = height / realHeight;
  

      var init_area = {x: -1, y: -1, width: -1, height: -1,isChanging: true,isNew: true,unit: "px"};
      init_area.x = props.ROI.xmin * xscale_inv;
      init_area.width = props.ROI.xmax * xscale_inv - props.ROI.xmin * xscale_inv;
      init_area.y = props.ROI.ymin * yscale_inv;
      init_area.height = props.ROI.ymax * yscale_inv - props.ROI.ymin * yscale_inv;
      area = []
      area.push(init_area);
      setArea(area);
    }
  }


  useEffect(() => {

  }, []);



  return (
    <div
      style={{display: "flex",flexDirection: "column", alignItems: "center"}}
    >
        <AreaSelector
            maxAreas = {1}
            areas={area}
            globalAreaStyle={{
              border: '3px dashed cyan',
              backgroundColor: 'rgba(144,252,227,0.15)',
              opacity: '1.0'
            }}
          
            onChange={onChangeHandler}
        >
            <img id="image-obj" 
                src={baseURL+"holoSensor/get_snapshot/"+props.path} 
                style={{width: "Min(80vw, 80vh)", height: "Min(80vw, 80vh)"}}
                onLoad={init} />
        </AreaSelector>

    </div>
  );
};

export default Selector;
