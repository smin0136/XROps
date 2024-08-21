import OpenSeaDragon from "openseadragon";
import React, { useEffect, useState, useRef, useReducer } from "react";
import { Button, IconButton, ButtonToolbar, ButtonGroup } from "rsuite";
import "./openseadragon-viewer.styles.scss";
import { postViewAreaAPI } from "../../rete1/api";

import PlusIcon from '@rsuite/icons/Plus';
import MinusIcon from '@rsuite/icons/Minus';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import HomeIcon from '@rsuite/icons/legacy/Home';

import API from "../../utils/axios";


const OpenSeaDragonViewer = (props) => {
  var viewer = null;
  console.log(props);

  const viewerComponent = useRef();

  const [imageSize,setImageSize]=useState([0,0]);


  const InitOpenseadragon = async () => {
    viewer && viewer.destroy();

    var src = "https://vience.io:6040/"+props.server +"/"+props.dataPath+"/"+props.feature1+"/plate.dzi";

    console.log(src);

    viewer = OpenSeaDragon({
        id: "openSeaDragon",
        prefixUrl: "openseadragon-images/",
        tileSources: src,
        crossOriginPolicy: "Anonymous",
        animationTime: 0.5,
        blendTime: 1.0,
        constrainDuringPan: true,
        maxZoomPixelRatio: 2,
        minZoomLevel: 0.1,
        visibilityRatio: 1,
        zoomPerScroll: 2,
        showNavigator: true,
        toolbar: "viewerToolbar",
        zoomInButton: "pv_zoom-in",
        zoomOutButton: "pv_zoom-out",
        homeButton: "pv_home",
        //smoothTileEdgesMinZoom: 0.1,
        //imageSmoothingEnabled: false,
        //alwaysBlend: true,
        // fullPageButton: "pv_full-page",
    });

    viewer.gestureSettingsMouse.clickToZoom = false;
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // try{
    //   var xml = await API.get(
    //     "/" + props.server +"/"+props.userId+"/"+props.dataPath+"/slide.dzi"
    //   );
    //   var parser = new DOMParser();
    //   var imageMetaData = parser.parseFromString(xml.data,"text/xml");
    
    //   console.log(imageMetaData);
    //   var size=imageMetaData.getElementsByTagName("Size");
    //   var _imageSize=[size[0].getAttribute("Width"),size[0].getAttribute("Height")];
    //   if(_imageSize[0]!==imageSize[0] || _imageSize[1]!==imageSize[1]){
    //     setImageSize(_imageSize);
    //   }
    // } catch(error){
      
    // }
    
    // var tiledImage = viewer.world.getItemAt(0);
    // imageSize = [tiledImage.source.dimensions.x,tiledImage.source.dimensions.y];
    // console.log(viewer);


  };
  
  useEffect(() => {
    if(props.dataPath!==0){
      InitOpenseadragon();
      return () => {
          viewer && viewer.destroy();
      };
    }
  },);

  return (

    <div ref={viewerComponent}>
      <div id="viewerToolbar">

        <IconButton className="toolbarItem" id="pv_home" icon={<HomeIcon />} appearance="primary"/>
        <IconButton className="toolbarItem" id="pv_zoom-in" icon={<AddOutlineIcon />} appearance="primary"/>
        <IconButton className="toolbarItem" id="pv_zoom-out" icon={<CollaspedOutlineIcon />} appearance="primary"/>
        <label className="dataName"> [{props.dataPath}]</label>
        <label className="dataName"> [{String(imageSize[0]) + "x" + String(imageSize[1])}]</label>
        
      </div>
      <div
        id="openSeaDragon"
        style={{
          height: "80vh",
          width: "80vw",
        }}
      >
      </div>
    </div>
  );
};
export { OpenSeaDragonViewer };
