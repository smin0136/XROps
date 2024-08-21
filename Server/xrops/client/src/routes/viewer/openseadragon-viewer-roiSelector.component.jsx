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
import Magic2Icon from '@rsuite/icons/legacy/Magic2';

const OpenSeaDragonViewer = (props) => {
  var viewer = null;
  var seaGL = null;
  var pointed_color = null;
  var prev_pointed_color = null;
  console.log(props);

  const viewerComponent = useRef();


  var toggleFunc = async () =>{
    if(seaGL){
      seaGL.viaGL.on++;
      viewer.world.resetItems();
    }
  };

  const glMount = async () =>{
    // Make a link to webGL
    seaGL = new window.openSeadragonGL(viewer);
    seaGL.vShader = 'shaders/vertex/square.glsl';
//    seaGL.fShader = 'shaders/fragment/sobel3.glsl';
//    seaGL.fShader = 'shaders/fragment/gradient.glsl';
    seaGL.fShader = 'shaders/fragment/threshold.glsl';

    var load = async function(callback, e) {
        var source = e.tiledImage.source;
        if (e.tile.url.slice(-1) === '1') {
            // Make the entire top tile transparent
            e.tiledImage.setOpacity(1.0);
            //console.log(e);
            // via webGL
            e.pointed_color = pointed_color;
            await callback(e);
        }
    };

    var draw = async function(callback, e) {
        if (e.tile.loaded !==1) {
            await load(callback, e);
            e.tile.loaded = 1;
        }
    };

    seaGL.addHandler('tile-drawing',draw);

    seaGL.init();


    console.log("gl mounted");
  };

  const InitOpenseadragon = () => {

    viewer && viewer.destroy();


    var src = "https://vience.io:6040/"+props.server +"/"+props.dataPath+"/slide.dzi";

    viewer = OpenSeaDragon({
        id: "openSeaDragon",
        prefixUrl: "openseadragon-images/",
        tileSources: [src+'?l=0', src+'?l=1'],
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
        overlays: [{
          x: 0.3,
          y: 0.2,
          width: 0.1,
          height: 0.15,
          // px: 6425,
          // py: 0,
          id: 'roi1'
        },
        {
          x: 0.5,
          y: 0.3,
          width: 0.05,
          height: 0.2,
          id: 'roi2'
        }],
        // fullPageButton: "pv_full-page",
    });

    viewer.gestureSettingsMouse.clickToZoom = false;
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    viewer.addHandler('canvas-nonprimary-press', function(event) {
      // The canvas-click event gives us a position in web coordinates.
      var webPoint = event.position;
  
      // Convert that to viewport coordinates, the lingua franca of OpenSeadragon coordinates.
      var viewportPoint = viewer.viewport.pointFromPixel(webPoint);
  
      // Convert from viewport coordinates to image coordinates.
      var imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
  
      // Show the results.
//      console.log(webPoint.toString(), viewportPoint.toString(), imagePoint.toString());

      var drawer = viewer.drawer;
//      console.log(drawer.canvas.getContext("2d").getImageData(webPoint.x, webPoint.y, 1, 1).data);

      pointed_color = drawer.canvas.getContext("2d").getImageData(webPoint.x, webPoint.y, 1, 1).data;
      if(prev_pointed_color){
        if(Math.abs(pointed_color[0]-prev_pointed_color[0]) + Math.abs(pointed_color[1]-prev_pointed_color[1]) + Math.abs(pointed_color[2]-prev_pointed_color[2])
          > 10){
            prev_pointed_color = pointed_color;
            viewer.world.resetItems();
          }
      }
      else{
        prev_pointed_color = pointed_color;
      }

    });

    var addTracker = (roi_id) => {
      new OpenSeaDragon.MouseTracker({
        userData: roi_id+'.Tracker',
        element: roi_id,
        preProcessEventHandler: function (eventInfo) {
          switch (eventInfo.eventType) {
            case 'pointerdown':
            case 'pointerup':
              // prevent drag, click, pinch, etc. gestures on the viewer
              // when events bubble, preventDefault true indicates to viewer
              //    that we handled the events
              eventInfo.preventDefault = true;
              break;
            case 'contextmenu':
              // prevent context menu from popping up
              eventInfo.preventDefault = true;
              break;
            default:
              break;
          }
        },
        dragHandler: function(e) {
          // drag the overlay
          var overlay = viewer.getOverlayById(roi_id);
          if(overlay){
            var delta = viewer.viewport.deltaPointsFromPixels(e.delta);
            overlay.update({ location: overlay.location.plus(delta) });
            overlay.drawHTML(viewer.overlaysContainer, viewer.viewport );
          }
        }
      });
    };
    addTracker('roi1');
    addTracker('roi2');
    
  };

  
  useEffect(() => {
    if(props.dataPath){
//      componentMount();
      InitOpenseadragon();
      glMount();
  
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
        <IconButton onClick={toggleFunc} className="toolbarItem" icon={<Magic2Icon />} appearance="primary"/>
        <label className="dataName"> [{props.dataPath}]</label>
        
      </div>
      <div
        id="openSeaDragon"
        style={{
          height: "80vh",
          width: "80vw",
        }}
      >
      </div>
      <div id="roi1">
      </div>
      <div id="roi2">
      </div>

    </div>
  );
};
export { OpenSeaDragonViewer };
