import "rsuite/dist/rsuite.min.css";
import "./control-panel.styles.scss";
import { Panel, PanelGroup, Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';
import { useEffect, useState,useRef} from "react";

import DatabaseIcon from '@rsuite/icons/legacy/Database';
import ImageIcon from '@rsuite/icons/Image';
import ScatterIcon from '@rsuite/icons/Scatter';
import BarLineChartIcon from '@rsuite/icons/BarLineChart';

import StarHalfOIcon from '@rsuite/icons/legacy/StarHalfO';

import ConnectdevelopIcon from '@rsuite/icons/legacy/Connectdevelop';
import SaveIcon from '@rsuite/icons/legacy/Save';
import AppSelectIcon from '@rsuite/icons/AppSelect';

import GridIcon from '@rsuite/icons/Grid';
import RateIcon from '@rsuite/icons/Rate';
import DeviceIcon from '@rsuite/icons/Device';
import DragableIcon from '@rsuite/icons/Dragable';
import VisibleIcon from '@rsuite/icons/Visible';
import CameraIcon from '@rsuite/icons/legacy/Camera';
import HandLizardOIcon from '@rsuite/icons/legacy/HandLizardO';
import SpinnerIcon from '@rsuite/icons/legacy/Spinner';

import SearchPeoplesIcon from '@rsuite/icons/legacy/SearchPeoples';

import SmileOIcon from '@rsuite/icons/legacy/SmileO';
import ObjectGroupIcon from '@rsuite/icons/legacy/ObjectGroup';
import Asterisk from '@rsuite/icons/legacy/Asterisk';
import ArrowsAlt from '@rsuite/icons/legacy/ArrowsAlt';

import Paragraph from '@rsuite/icons/Paragraph';
import Cube from '@rsuite/icons/legacy/Cube';
import Magic from '@rsuite/icons/legacy/Magic';
import MapO from '@rsuite/icons/legacy/MapO';
import Sliders from '@rsuite/icons/legacy/Sliders';
import Squares from '@rsuite/icons/legacy/Squares';
import Combination from '@rsuite/icons/Combination';

import ListIcon from '@rsuite/icons/List';

import { createNode } from "../rete";

import ArrowDown from '@rsuite/icons/ArrowDown';
import ArrowUp from '@rsuite/icons/ArrowUp';

import SmileO from '@rsuite/icons/legacy/SmileO'



const ControlPanel = (props) => {

  // const [size, setSize] = useState();
  // const [open, setOpen] = useState(false);

  // const handleOpen = () => {
  //   setSize('full');
  //   setOpen(true);
  // }

  // const handleClose = () => setOpen(false);


  const createDataNode = async () => {
    await createNode(0);
  };
  const createCellDataNode = async () => {
    await createNode(1);
  };
    const createViewerNode = async () => {
    await createNode(2);
  };
  const createInteractiveViewerNode = async () => {
    await createNode(3);
  };
  const createFattyLiverNode = async () => {
    await createNode(4);
  };
  const createROISelectorNode = async () => {
    await createNode(5);
  };
  const createSaveNode = async () => {
    await createNode(6);
  };
  const createBlendViewerNode = async () => {
    await createNode(7);
  };
  const createForgroundMaskNode = async () => {
    await createNode(8);
  };
  const createCellPlateViewerNode = async () => {
    await createNode(9);
  };
  const createCellDensityNode = async () => {
    await createNode(10);
  };
  const createXRDeviceNode = async () => {
    await createNode(11);
  };
  const createXRInputNode = async () => {
    await createNode(12);
  };
  const createSensorDataNode = async () => {
    await createNode(13);
  };
  const createSetSensorNode = async () => {
    await createNode(14);
  };
  const createSetGestureNode = async () => {
    await createNode(15);
  };
  const createDepthToPointCloudNode = async () => {
    await createNode(16);
  };
  const createSendPointCloudNode = async () => {
    await createNode(17);
  };
  const createDXRParserNode = async () => {
    await createNode(18);
  };
  const createSendNode = async () => {
    await createNode(19);
  };
  const createXRDataFileNode = async () => {
    await createNode(20);
  };
  const createXRImageFileNode = async () => {
    await createNode(21);
  };

  const createInfoVisNode = async () => {
    await createNode(22);
  };
  const createDataQueueNode = async () => {
    await createNode(23);
  };
  const createAPIDataNode = async () => {
    await createNode(24);
  };
  const createFaceDetectionNode = async () => {
    await createNode(25);
  };
  const createImageToPointDataNode = async () => {
    await createNode(26);
  };
  const createRegionSelectionNode = async () => {
    await createNode(27);
  };
  const createXRImageFile3DNode = async () => {
    await createNode(28);
  };
  const createXRISOSurfacingNode = async () => {
    await createNode(29);
  };
  const createXRVolumeToPointDataNode = async () => {
    await createNode(30);
  };
  const createXROutlierRemovingNode = async () => {
    await createNode(31);
  };
  const createXRCalculateCurvatureNode = async () => {
    await createNode(32);
  };
  const createXRDataFilteringNode = async () => {
    await createNode(33);
  };
  const createXRICPNode = async () => {
    await createNode(34);
  };
  const createXRTransformNode = async () => {
    await createNode(35);
  };
  const createXRMixedRealityViewNode = async () => {
    await createNode(36);
  };
  const createXRVisPositionNode = async () => {
    await createNode(37);
  };
  const createXRImageToPosNode = async () => {
    await createNode(38);
  };

  const createXRAIFaceDetectionNode = async () => {
    await createNode(41);
  };

  const createXRAIFaceRegistrationNode = async () => {
    await createNode(42);
  };

  const createXRGetSpatialPositionNode = async () => {
    await createNode(43);
  };
  const createXRFindVolumeROINode = async () => {
    await createNode(44);
  };
  const createXRVolumeISOSurfaceNode = async () => {
    await createNode(45);
  };

  const createXRMarkerTrackingNode = async () => {
    await createNode(46);
  };
  const createXRGestureRecognitionNode = async () => {
    await createNode(47);
  };
  const createXRObjectRecognitionNode = async () => {
    await createNode(48);
  };
  const createXRWorldPositioningNode = async () => {
    await createNode(49);
  };
  const createXRGenerateSpatialAnchorNode = async () => {
    await createNode(50);
  };

  const createXRCustomProcessingNode = async () => {
    await createNode(51);
  };

  const panelToggle = (e) => {
    var target = e.target.id;
    if(target === ''){
      target = e.target.parentElement.id;
      if(target === ''){
        target = e.target.parentElement.parentElement.id;
      }
    }
    const menu = document.querySelector('.'+target);
    if(menu.style.display === 'none'){
      menu.style.display = 'block';
    }
    else{
      menu.style.display = 'none';
    }
  };



  return (
    <div>
      <Panel header="" className="panel" style={{overflowY: "auto", maxHeight: "90%"}}>
      <div style={{display: "block", marginBottom: "20px"}}>
        <div style={{ display: "flex", flexDirection: "row" }}>

          <img src="XR.png" style={{width:"20%"}} />
          <p className="panel-title-text" style={{color:"rgb(125,255,255)"}}>Node Panel</p>
          <div>
            <IconButton id="xrops" onClick={panelToggle} className="button-1" icon={<ArrowDown />} appearance="ghost" size="xs" active 
                      style={{marginTop: "15px", marginLeft: "10px",borderRadius: "20px / 20px"}}/>
          </div>
  
        </div>

        <div className="xrops" style={{display: "block", backgroundColor: "#abb6c02c", borderRadius: "16px", boxShadow: "0px 5px 10px 0px rgba(0, 0, 0, 0.2)", padding: "5px 5px 5px 5px"}}>
          <p className="text">Device</p>
          <div className="button-container-1">
            <IconButton onClick={createXRDeviceNode} className="button-1" id="data_node_button" icon={<DragableIcon />} color="violet" appearance="primary" placement="left">
              <p className="panel-text-body">XR Device<br />Connector</p> 
            </IconButton>

          </div>
          {/* <div className="button-container-1">
            <IconButton onClick={createSetSensorNode} className="button-1" id="data_node_button" icon={<VisibleIcon />} color="violet" appearance="primary" placement="left">
            <p className="panel-text-body">Sensor<br />Setting</p> 
            </IconButton>
            <IconButton onClick={createSetGestureNode} className="button-1" id="data_node_button" icon={<HandLizardOIcon />} color="violet" appearance="primary" placement="left">
            <p className="panel-text-body">Gesture<br />Setting</p> 
            </IconButton>

          </div> */}

          <p className="text">Input</p>
          <div className="button-container-1">
            <IconButton onClick={createXRInputNode} className="button-1" id="data_node_button" icon={<DeviceIcon />} color="violet" appearance="primary" placement="left">
              XR Input
            </IconButton>
            <IconButton onClick={createXRDataFileNode} className="button-1" id="data_node_button" icon={<BarLineChartIcon />} color="violet" appearance="primary" placement="left">
              Data File
            </IconButton>

          </div>
          <div className="button-container-1">
            <IconButton onClick={createXRImageFileNode} className="button-1" id="data_node_button" icon={<ImageIcon />} color="violet" appearance="primary" placement="left">
              Image File
            </IconButton>
            <IconButton onClick={createDataQueueNode} className="button-1" id="data_node_button" icon={<ListIcon />} color="violet" appearance="primary" placement="left">
              Data Queue
            </IconButton>

          </div>
          <div className="button-container-1">
            <IconButton onClick={createAPIDataNode} className="button-1" id="data_node_button" icon={<BarLineChartIcon />} color="violet" appearance="primary" placement="left">
              API Data
            </IconButton>
            <IconButton onClick={createXRImageFile3DNode} className="button-1" id="data_node_button" icon={<Cube />} color="violet" appearance="primary" placement="left">
              3D Image File
            </IconButton>
          </div>

          <p className="text" style={{marginBottom: "0"}}>Processing</p>
          <p className="text"style={{marginTop: "0"}}>- Sensor</p>

          <div className="button-container-1">
            <IconButton onClick={createSensorDataNode} className="button-1" id="data_node_button" icon={<CameraIcon />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Taking<br />Sensor Data</p> 
            </IconButton>
            {/* <IconButton onClick={createXRGetSpatialPositionNode} className="button-1" id="data_node_button" icon={<CameraIcon />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Get Spatial<br />Position</p> 
            </IconButton> */}
            {/* <IconButton onClick={createDepthToPointCloudNode} className="button-1" id="data_node_button" icon={<SpinnerIcon />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Depth To<br />Point Cloud</p> 
            </IconButton> */}
          </div>
          <div className="button-container-1">
            <IconButton onClick={createXRMarkerTrackingNode } className="button-1" id="data_node_button" icon={<CameraIcon />} color="yellow" appearance="primary" placement="left">
              <p className="panel-text-body">Marker<br />Tracking</p> 
            </IconButton>
            <IconButton onClick={createXRGestureRecognitionNode } className="button-1" id="data_node_button" icon={<CameraIcon />} color="yellow" appearance="primary" placement="left">
              <p className="panel-text-body">Gesture<br />Recognition</p> 
            </IconButton>
          </div>
          <div className="button-container-1">
            <IconButton onClick={createXRObjectRecognitionNode  } className="button-1" id="data_node_button" icon={<CameraIcon />} color="yellow" appearance="primary" placement="left">
              <p className="panel-text-body">Object<br />Recognition</p> 
            </IconButton>
            <IconButton onClick={createXRWorldPositioningNode  } className="button-1" id="data_node_button" icon={<CameraIcon />} color="yellow" appearance="primary" placement="left">
              <p className="panel-text-body">World<br />Positioning</p> 
            </IconButton>
          </div>
          <div className="button-container-1">
            <IconButton onClick={createXRGenerateSpatialAnchorNode   } className="button-1" id="data_node_button" icon={<CameraIcon />} color="yellow" appearance="primary" placement="left">
              <p className="panel-text-body">Generate<br />Spatial Anchor</p> 
            </IconButton>
          </div>


          <p className="text">- Data</p>


          <div className="button-container-1">
            <IconButton onClick={createXRFindVolumeROINode} className="button-1" id="data_node_button" icon={<Cube />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Find<br />Volume ROI</p> 
            </IconButton>
            <IconButton onClick={createXRVolumeISOSurfaceNode} className="button-1" id="data_node_button" icon={<Cube />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Volume ISO<br />Surfacing</p> 
            </IconButton>

          </div>
          <div className="button-container-1">
            <IconButton onClick={createFaceDetectionNode} className="button-1" id="data_node_button" icon={<SmileOIcon />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">ROI Face<br />Detection</p> 
            </IconButton>
            <IconButton onClick={createRegionSelectionNode} className="button-1" id="data_node_button" icon={<ObjectGroupIcon />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Region<br />Selection</p> 
            </IconButton>
          </div>
          <div className="button-container-1">
            <IconButton onClick={createXRISOSurfacingNode} className="button-1" id="data_node_button" icon={<Combination />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">ISO<br />Surfacing</p> 
            </IconButton>
            <IconButton onClick={createXRVolumeToPointDataNode} className="button-1" id="data_node_button" icon={<SpinnerIcon />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Volume To<br />Point Data</p> 
            </IconButton>
            
          </div>
          <div className="button-container-1">
            <IconButton onClick={createXROutlierRemovingNode} className="button-1" id="data_node_button" icon={<Magic />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Outlier<br />Removing</p> 
            </IconButton>
            <IconButton onClick={createXRCalculateCurvatureNode} className="button-1" id="data_node_button" icon={<MapO />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Curvature<br />Calculation</p> 
            </IconButton>
                        
          </div>
          <div className="button-container-1">
            <IconButton onClick={createXRDataFilteringNode} className="button-1" id="data_node_button" icon={<Sliders />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Data<br />Filtering</p> 
            </IconButton>
            <IconButton onClick={createXRICPNode} className="button-1" id="data_node_button" icon={<Asterisk />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">ICP &#40; Point<br />Registration &#41;</p> 
            </IconButton>
    
          </div>
          <div className="button-container-1">
            <IconButton onClick={createXRCustomProcessingNode} className="button-1" id="data_node_button" icon={<Paragraph />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Custom<br />&#40; Processing &#41;</p> 
            </IconButton>
            <IconButton onClick={createImageToPointDataNode} className="button-1" id="data_node_button" icon={<SpinnerIcon />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Image to<br />Point Data</p> 
            </IconButton>

          </div>
          <div className="button-container-1">
            <IconButton onClick={createXRAIFaceDetectionNode} className="button-1" id="data_node_button" icon={<SmileO />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">AI Face<br />Detection</p> 
            </IconButton>
            <IconButton onClick={createXRAIFaceRegistrationNode} className="button-1" id="data_node_button" icon={<Asterisk />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">AI Face<br />Registration</p> 
            </IconButton>
          </div>
          <div>
            <IconButton onClick={createXRTransformNode} className="button-1" id="data_node_button" icon={<ArrowsAlt />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Point<br />Transform</p> 
            </IconButton>
          </div>



          <p className="text">- Position</p>
          <div className="button-container-1">
            <IconButton onClick={createXRVisPositionNode} className="button-1" id="data_node_button" icon={<Squares />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Vis<br />Linking</p> 
            </IconButton>
            <IconButton onClick={createXRImageToPosNode} className="button-1" id="data_node_button" icon={<Asterisk />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Depth to<br />Position</p> 
            </IconButton>

          </div>

          <p className="text">- Encoding</p>
          <div className="button-container-1">
            <IconButton onClick={createDXRParserNode} className="button-1" id="data_node_button" icon={<Paragraph />} color="blue" appearance="primary" placement="left">
              <p className="panel-text-body">Visual<br />Encoding</p> 
            </IconButton>
          </div>
          
          <p className="text">Rendering</p>
          <div className="button-container-1">
            <IconButton onClick={createInfoVisNode} className="button-1" id="data_node_button" icon={<BarLineChartIcon />} color="green" appearance="primary" placement="left">
              Visualization
            </IconButton>
            <IconButton onClick={createXRMixedRealityViewNode} className="button-1" id="data_node_button" icon={<Cube />} color="green" appearance="primary" placement="left">
            <p className="panel-text-body">Mixed<br />Reality View</p> 
            </IconButton>

          </div>
          <div className="button-container-1">
            {/* <IconButton onClick={createSendPointCloudNode} className="button-1" id="data_node_button" icon={<ScatterIcon />} color="green" appearance="primary" placement="left">
              Point Cloud
            </IconButton> */}
            <IconButton onClick={createSendNode} className="button-1" id="data_node_button" icon={<DragableIcon />} color="green" appearance="primary" placement="left">
            <p className="panel-text-body">XR<br />Visualization</p> 
            </IconButton>

          </div>

        </div>

      </div>


      </Panel>
    </div>
  );
};

export default ControlPanel;
