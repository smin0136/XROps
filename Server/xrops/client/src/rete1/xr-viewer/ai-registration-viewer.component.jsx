import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../utils/axios";
import "./selector.styles.scss";
import PlusIcon from '@rsuite/icons/Plus';
import CloseIcon from '@rsuite/icons/Close';
import { Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';
import {
  XRGetYOLORenderingAPI
} from "../api";
import { Slider, RangeSlider } from 'rsuite';


const Viewer = (props) => {

  var [img, setImg] = useState('');
  var [url, setURL] = useState('');

  var [rotY, setRotY] = useState(0);
  var [rotZ, setRotZ] = useState(0);


  const getRendering = async () => {
    img = await XRGetYOLORenderingAPI(props['path1'],props['path2'],props['matrix'],rotY,rotZ);
    if(img!==-1 && img!==undefined && img!==null){
      console.log(img);
      url = 'https://vience.io:6040/holoSensor/get_snapshot/' + img;
      setURL(url);
      setImg(img);
    }
  }

  const rotationY = async (v,e) => {
    rotY=v;
    setRotY(rotY);
    img = await XRGetYOLORenderingAPI(props['path1'],props['path2'],props['matrix'],rotY,rotZ);
    if(img!==-1 && img!==undefined && img!==null){
      console.log(img);
      url = 'https://vience.io:6040/holoSensor/get_snapshot/' + img;
      setURL(url);
      setImg(img);
    }
  }
  const rotationZ = async (v,e) => {
    rotZ=v;
    setRotZ(rotZ);
    img = await XRGetYOLORenderingAPI(props['path1'],props['path2'],props['matrix'],rotY,rotZ);
    if(img!==-1 && img!==undefined && img!==null){
      console.log(img);
      url = 'https://vience.io:6040/holoSensor/get_snapshot/' + img;
      setURL(url);
      setImg(img);
    }
  }



  useEffect(() => {
    getRendering();
  }, []);



  return (
    <div
      style={{display: "flex",flexDirection: "row", alignItems: "center"}}
    >
      <div
            style={{marginLeft: "auto"}}
      >
        <Slider
          progress
          vertical
          defaultValue={0}
          onChangeCommitted={rotationZ}
          min={0}
          max={360}     
          style={{height: "Min(80vw, 80vh)", marginRight: "20px"}} />

      </div>
      <div
        style={{display: "flex",flexDirection: "column", alignItems: "center",marginRight:"auto"}}
      >
        <Slider
          progress
          defaultValue={0}
          onChangeCommitted={rotationY}
          min={0}
          max={360}     
          style={{width: "Min(80vw, 80vh)", marginBottom: "20px"}} />


        <img id="image-obj" 
            src={url} 
            style={{width: "Min(80vw, 80vh)", height: "Min(80vw, 80vh)"}}
        />
      </div>

    </div>
  );
};

export default Viewer;
