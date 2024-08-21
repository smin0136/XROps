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

import { Slider, RangeSlider } from 'rsuite';

const OpenSeaDragonViewer = (props) => {
  var viewer = null;
//  console.log(props);

  const viewerComponent = useRef();
//  const [blendFactor,setBlendFactor]=useState(0.5);
  var blendFactor=0.5;

  const InitOpenseadragon = async () => {
    viewer && viewer.destroy();

    var src1 = "https://vience.io:6040/"+props.server[0] +"/"+props.dataPath[0]+"/slide.dzi";
    var src2 = "https://vience.io:6040/"+props.server[1] +"/"+props.dataPath[1]+"/slide.dzi";


//    console.log(src1)
//    console.log(src2)

    viewer = OpenSeaDragon({
        id: "openSeaDragon",
        prefixUrl: "openseadragon-images/",
        tileSources: [src1,src2],
        crossOriginPolicy: "Anonymous",
        animationTime: 0.5,
        blendTime: 0.1,
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
        // alwaysBlend: true,
        // fullPageButton: "pv_full-page",
    });

    viewer.gestureSettingsMouse.clickToZoom = false;
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    viewer.addHandler('tile-drawing',function(event){
      var tiledImage2 = viewer.world.getItemAt(1);
      tiledImage2.setOpacity(blendFactor);
    });




    
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
        <label className="additionalValue"> [{props.additional_value===-1?'':'Steatosis Percentage: ' + props.additional_value + '%'}]</label>           
      </div>
      <Slider
        progress
        defaultValue={50}
        onChange={value => {
          blendFactor=value/100.0;
          var tiledImage2 = viewer.world.getItemAt(1);
          tiledImage2.setOpacity(blendFactor);
          viewer.world.update();
        }} />
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
