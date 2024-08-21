import { useState, useEffect, useRef } from "react";
import Rete from "rete";
import ReactRenderPlugin from "rete-react-render-plugin";
import ConnectionPlugin from "rete-connection-plugin";
import ContextMenuPlugin from "rete-context-menu-plugin";
import AreaPlugin from "rete-area-plugin";
import API from "../utils/axios";
import { getEditorJsonAPI, postEditorJsonAPI } from "./api";
import { TextComponent } from "./text";
import { NumComponent } from "./num";
import { AddComponent } from "./add";
import { WSIDataComponent } from "./WSIData";
import { ImageComponent } from "./viewer-basic";
import { ImageComponentThrehsold } from "./viewer-threshold";
import { ImageComponentROISelector } from "./viewer-roiSelector";
import { ImageComponentBlend } from "./viewer-blend";
import { FilterComponent } from "./filter";
import { DetectionComponent } from "./detection";
import { TwoInputFilterComponent } from "./two-input-filter";
import { ColorMapComponent } from "./colormap";
import { PlayComponent } from "./play";
import { CodeComponent } from "./code";
import { LiverComponent } from "./liver";
import { SaveComponent } from "./save";
import { ForgroundComponent } from "./forground_mask";
import { CellDataComponent } from "./CellData";
import { cellDensityComponent } from "./cellDensity";

import { ImageComponentCellPlate } from "./viewer-cellPlate";
import { XRDeviceComponent } from "./XRDevice";
import { XRInputComponent } from "./XRInput";
import { XRSensorDataComponent } from "./XRSensorData";
import { XRSetSensorComponent } from "./XRSetSensor";
import { XRSetGestureComponent } from "./XRSetGesture";
import { XRDepthToPointCloudComponent } from "./XRDepthToPointCloud";
import { XRSendPointCloudComponent } from "./XRSendPointCloud";
import { XRDXRParserComponent } from "./XRDXRParser";

import { XRSendComponent } from "./XRSend";
import { XRDataFileComponent } from "./XRDataFile";
import { XRImageFileComponent } from "./XRImageFile";
import { XRInfoVisComponent } from "./XRInfoVis";
import { XRDataQueueComponent } from "./XRDataQueue";
import { XRAPIDataComponent } from "./XRAPIData";

import { XRFaceDetectionComponent } from "./XRFaceDetection";
import { XRImageToPointDataComponent } from "./XRImageToPointData";
import { XRRegionSelectionComponent } from "./XRRegionSelection";
import { XRImageFile3DComponent } from "./XRImageFile3D";

import { XRISOSurfacingComponent } from "./XRISOSurfacing";
import { XRVolumeToPointDataComponent } from "./XRVolumeToPointData";
import { XROutlierRemovingComponent } from "./XROutlierRemoving";
import { XRCalculateCurvatureComponent } from "./XRCalculateCurvature";
import { XRDataFilteringComponent } from "./XRDataFiltering";
import { XRICPComponent } from "./XRICP";
import { XRTransformComponent } from "./XRTransform";
import { XRMixedRealityViewComponent } from "./XRMixedRealityView";
import { XRVisPositionComponent } from "./XRVisPosition";


import { tempXRInfoVisComponent } from "./temp-XRInfoVis";

import { getWorkspace, saveWorkspace } from "./api";
import { XRImageToPosComponent } from "./XRImageToPos";
import { XRImageProcessCustomComponent } from "./XRImageProcessCustom";
import { XRAIFaceDetectionComponent } from "./XRAIFaceDetection";
import { XRAIFaceRegistrationComponent } from "./XRAIFaceRegistraction";
import { XRGetSpatialPositionComponent } from "./XRGetSpatialPosition";
import { XRFindVolumeROIComponent } from "./XRFindVolumeROI";
import { XRVolumeISOSurfaceComponent } from "./XRVolumeISOSurface";
import { XRMarkerTrackingComponent } from "./XRMarkerTracking";
import { XRGestureRecognitionComponent } from "./XRGestureRecognition";
import { XRObjectRecognitionComponent } from "./XRObjectRecognition";
import { XRWorldPositioningComponent } from "./XRWorldPositioning";
import { XRGenerateSpatialAnchorComponent } from "./XRGenerateSpatialAnchor";
import { XRCustomProcessingComponent } from "./XRCustomProcessing";


export var numSocket = new Rete.Socket("Number value");
export var textSocket = new Rete.Socket("");

export var currentEditor;

var components = [
  new WSIDataComponent(),
  new CellDataComponent(),
  new ImageComponent(),
  new ImageComponentThrehsold(),
  new LiverComponent("Steatosis Detection"),
  new ImageComponentROISelector(),
  new SaveComponent(),
  new ImageComponentBlend(),
  new ForgroundComponent("DL (Forground Mask)"),
  new ImageComponentCellPlate(),
  new cellDensityComponent("Cell Density Feature"),
  new XRDeviceComponent(),
  new XRInputComponent(),
  new XRSensorDataComponent(),
  new XRSetSensorComponent(),
  new XRSetGestureComponent(),
  new XRDepthToPointCloudComponent(),
  new XRSendPointCloudComponent(),
  new XRDXRParserComponent(),
  new XRSendComponent(),
  new XRDataFileComponent(),
  new XRImageFileComponent(),
  new XRInfoVisComponent(),
  new XRDataQueueComponent(),
  new XRAPIDataComponent(),
  new XRFaceDetectionComponent(),
  new XRImageToPointDataComponent(),
  new XRRegionSelectionComponent(),
  new XRImageFile3DComponent(),
  new XRISOSurfacingComponent(),
  new XRVolumeToPointDataComponent(),
  new XROutlierRemovingComponent(),
  new XRCalculateCurvatureComponent(),
  new XRDataFilteringComponent(),
  new XRICPComponent(),
  new XRTransformComponent(),
  new XRMixedRealityViewComponent(),
  new XRVisPositionComponent(),
  new XRImageToPosComponent(),
  new XRImageProcessCustomComponent(),
  new tempXRInfoVisComponent(),
  new XRAIFaceDetectionComponent(),
  new XRAIFaceRegistrationComponent(),
  new XRGetSpatialPositionComponent(),
  new XRFindVolumeROIComponent(),
  new XRVolumeISOSurfaceComponent(),
  new XRMarkerTrackingComponent(),
  new XRGestureRecognitionComponent(),
  new XRObjectRecognitionComponent(),
  new XRWorldPositioningComponent(),
  new XRGenerateSpatialAnchorComponent(),
  new XRCustomProcessingComponent(),
];

export var access_code=''
export var is_update=''

export function useRete(state1,flag) {
  const [container, setContainer] = useState(null);
  const editorRef = useRef();
  access_code = state1;
  is_update = flag;

  useEffect(() => {
    if (container) {
      console.log(state1);
      createEditor(container).then((value) => {
        console.log(container);
        console.log(value);
        console.log("created");
        editorRef.current = value;
      });
    }
  }, [container]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        console.log("destroy");
        editorRef.current.destroy();
      }
    };
  }, []);

  return [setContainer];
}

export const createNode = async (node_ind) => {
  var rete_obj = document.getElementsByClassName("rete");
  var orign_obj = rete_obj[0].firstChild;
  var transform_str = orign_obj.style.transform;
  var transform_x = parseFloat(transform_str.split('(')[1].split(')')[0].split(',')[0].split('px')[0].trim());
  var transform_y = parseFloat(transform_str.split('(')[1].split(')')[0].split(',')[1].split('px')[0].trim());
  var transform_scale = parseFloat(transform_str.split('(')[2].split(')')[0]);
  var new_node = await components[node_ind].createNode();
  new_node.position = [-(transform_x-350)/transform_scale,-(transform_y-50)/transform_scale];
  currentEditor.addNode(new_node);
};


export async function createEditor(container) {

  var editor = new Rete.NodeEditor("demo@0.1.0", container);
  editor.use(ConnectionPlugin);
  editor.use(ReactRenderPlugin);
  editor.use(ContextMenuPlugin, {
    searchBar: true,
    delay: 100,
    allocate(component) {
      return ["Add Components"];
    },
    rename(component) {
      return component.name;
    },
  });


  var engine = new Rete.Engine("demo@0.1.0");

  components.map((c) => {
    editor.register(c);
    engine.register(c);
  });



  var workspace_data = await getWorkspace(access_code);

  var _msg = workspace_data["message"];

  if(_msg==="Success"){
    var workdir='';
    var json = null;
    try {
      json = workspace_data ? JSON.parse(workspace_data["data"]) : null;
    } catch (e) {
      json = null;
    }
    if (json) {
      console.log(json);  
      editor.fromJSON(json);
    }
  }

  editor.on('zoom', ({ source }) => {
    return source !== 'dblclick';
});

  // editor.on("process", async () => {
  //   if (editor.silent) return;
  //   console.log("process");
  //   await engine.abort();
  //   await engine.process(editor.toJSON());
  // });
  editor.on(
    "process nodecreated noderemoved connectioncreated connectionremoved",
    async () => {
      if (editor.silent) return;
      await engine.abort();
      await engine.process(editor.toJSON());
      console.log("change");
      if(is_update){
        var data = {
          access_code: access_code,
          data: JSON.stringify(editor.toJSON())
        };
        console.log(data);
        await saveWorkspace(data);
      }
    }
  );

  editor.view.resize();
  editor.trigger("process");
  AreaPlugin.zoomAt(editor, editor.nodes);

  currentEditor=editor;

  return editor;
}

export const handleSaveWorkspace = async (saveCode) => {
  var data = {
    access_code: saveCode,
    data: JSON.stringify(currentEditor.toJSON())
  };
  console.log(data);
  await saveWorkspace(data);
  return '(saved)';
}