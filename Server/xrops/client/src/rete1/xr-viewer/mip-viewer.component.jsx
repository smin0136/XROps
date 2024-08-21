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

var baseURL="https://vience.io:6040/";


const Viewer = (props) => {

  useEffect(() => {

  }, []);



  return (
    <div
      style={{display: "flex",flexDirection: "column", alignItems: "center"}}
    >
        <img id="image-obj" 
            src={baseURL+"holoSensor/get_mip/"+props.path} 
            style={{width: "Min(80vw, 80vh)", height: "Min(80vw, 80vh)"}}
        />

    </div>
  );
};

export default Viewer;
