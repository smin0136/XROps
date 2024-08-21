import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../utils/axios";
import "./selector.styles.scss";
import PlusIcon from '@rsuite/icons/Plus';
import CloseIcon from '@rsuite/icons/Close';
import { Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';
import {
  XRGetMixedRealityViewAPI
} from "../api";
import { Slider, RangeSlider } from 'rsuite';


const Viewer = (props) => {

  console.log(props);
  var [img, setImg] = useState('');
  var [url, setURL] = useState('');

  const getRendering = async () => {
    img = await XRGetMixedRealityViewAPI(props.path);
    if(img!==-1 && img!==undefined && img!==null){
      console.log(img);
      url = 'https://vience.io:6040/holoSensor/get_snapshot/' + img;
      setURL(url);
      setImg(img);
    }
  }


  useEffect(() => {
  }, []);


  return (
    <div
      style={{display: "flex",flexDirection: "column", alignItems: "center"}}
    >
        <Button style={{width: "Min(80vw, 80vh)",marginBottom: "20px"}} onClick={getRendering}><strong>Capture</strong></Button>

        <img id="image-obj" 
            src={url} 
            style={{width: "Min(80vw, 80vh)", height: "Min(80vw, 80vh)"}}
        />

    </div>
  );
};

export default Viewer;
