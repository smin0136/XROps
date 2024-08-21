import API from "../utils/axios";
import API2 from "../utils/axios2";


export const getRepoFileAPI = async (fileName) => {
  console.log(fileName);
  try {
    const { data } = await API.get(
      `/storage/find_in_repo/exp_user1/${fileName}`
    );
    console.log(
      `/storage/find_in_repo/exp_user1/${fileName}`
    );
    console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const getFilteredImageAPI = async (inputData) => {
  const body = {
    user_id: inputData["userId"],
    storage_file_path: inputData["storageFilePath"],
    node_id: inputData["nodeId"],
    node_type: inputData["nodeType"],
    amount: inputData["amount"],
    do_background: inputData["doBackground"],
    min_col: inputData["minCol"],
    max_col: inputData["maxCol"],
    min_row: inputData["minRow"],
    max_row: inputData["maxRow"],
    cur_level: inputData["curLevel"],
    all_tiles: inputData["allTiles"],
    skip: inputData["skip"],
    top_level: inputData["topLevel"],
    with_pyramid: inputData["withPyramid"],
    highest_level_all: inputData["highestLevelAll"],
    mode: inputData["mode"],
  };
  console.log(body);
  try {
    const { data } = await API.post(
      `/node/filter/${inputData["inputType"]}/${inputData["filterType"]}?by_tile=True`,
      body
    );
    data["amount"] = inputData["amount"];
    console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const getFilteredImage2API = async (inputData1, inputData2) => {
  const body = {
    user_id: inputData1["userId"],
    storage_file_path: inputData1["storageFilePath"],
    node_id: inputData1["nodeId"],
    node_type: inputData1["nodeType"],
    amount: inputData1["amount"],
    do_background: inputData1["doBackground"],
    min_col: inputData1["minCol"],
    max_col: inputData1["maxCol"],
    min_row: inputData1["minRow"],
    max_row: inputData1["maxRow"],
    cur_level: inputData1["curLevel"],
    all_tiles: inputData1["allTiles"],
    storage_file_path2: inputData2["storageFilePath"],
    skip: inputData1["skip"],
    top_level: inputData1["topLevel"],
    with_pyramid: inputData1["withPyramid"],
    highest_level_all: inputData1["highestLevelAll"],
    beers: inputData1["beers"],
    filter: inputData1["filter"],
  };
  console.log(body);
  console.log(inputData1["filterType"]);
  try {
    const { data } = await API.post(
      `/node/${inputData1["filterType"]}/${inputData1["inputType"]}/${inputData2["inputType"]}`,
      body
    );
    data["amount"] = inputData1["amount"];
    console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const getDetectionAPI = async (inputData) => {
  const body = {
    user_id: inputData["userId"],
    storage_file_path: inputData["storageFilePath"],
    node_id: inputData["nodeId"],
    amount: inputData["amount"],
    do_background: inputData["doBackground"],
    min_col: inputData["minCol"] ? inputData["minCol"] : 0,
    max_col: inputData["maxCol"] ? inputData["maxCol"] : 0,
    min_row: inputData["minRow"] ? inputData["minRow"] : 0,
    max_row: inputData["maxRow"] ? inputData["maxRow"] : 0,
    cur_level: inputData["curLevel"] ? inputData["curLevel"] : 0,
    all_tiles: inputData["allTiles"],
    tissue_file_path: inputData["tissueFilePath"],
    skip: inputData["skip"],
    top_level: inputData["topLevel"],
    with_pyramid: inputData["withPyramid"],
    highest_level_all: inputData["highestLevelAll"],
  };
  console.log(body);
  try {
    const { data } = await API.post(
      `/node/detect_cancer/${inputData["inputType"]}/${inputData["tissueInputType"]}`,
      body
    );
    data["amount"] = inputData["amount"];
    console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const getLiverAPI = async (inputData) => {
  const body = {
    user_id: inputData["userId"],
    storage_file_path: inputData["storageFilePath"],
    node_id: inputData["nodeId"],
    amount: inputData["amount"],
    do_background: inputData["doBackground"],
    min_col: inputData["minCol"] ? inputData["minCol"] : 0,
    max_col: inputData["maxCol"] ? inputData["maxCol"] : 0,
    min_row: inputData["minRow"] ? inputData["minRow"] : 0,
    max_row: inputData["maxRow"] ? inputData["maxRow"] : 0,
    cur_level: inputData["curLevel"] ? inputData["curLevel"] : 0,
    all_tiles: inputData["allTiles"],
    mask_file_path: inputData["maskFilePath"],
    skip: inputData["skip"],
    top_level: inputData["topLevel"],
    with_pyramid: inputData["withPyramid"],
    highest_level_all: inputData["highestLevelAll"],
  };
  console.log(body);
  try {
    const { data } = await API.post(
      `/node/fatty_liver/${inputData["inputType"]}/${inputData["maskInputType"]}`,
      body
    );
    data["amount"] = inputData["amount"];
    console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const getColormapAPI = async (inputData) => {
  const body = {
    user_id: inputData["userId"],
    storage_file_path: inputData["storageFilePath"],
    node_id: inputData["nodeId"],
    do_background: inputData["doBackground"],
    min_col: inputData["minCol"] ? inputData["minCol"] : 0,
    max_col: inputData["maxCol"] ? inputData["maxCol"] : 0,
    min_row: inputData["minRow"] ? inputData["minRow"] : 0,
    max_row: inputData["maxRow"] ? inputData["maxRow"] : 0,
    cur_level: inputData["curLevel"] ? inputData["curLevel"] : 0,
    all_tiles: inputData["allTiles"],
    min_v: inputData["minV"],
    max_v: inputData["maxV"],
    min_r: inputData["minR"],
    min_g: inputData["minG"],
    min_b: inputData["minB"],
    min_a: inputData["minA"],
    max_r: inputData["maxR"],
    max_g: inputData["maxG"],
    max_b: inputData["maxB"],
    max_a: inputData["maxA"],
    skip: inputData["skip"],
    top_level: inputData["topLevel"],
    with_pyramid: inputData["withPyramid"],
    highest_level_all: inputData["highestLevelAll"],
  };
  console.log(body);
  try {
    const { data } = await API.post(
      `/node/color_map/${inputData["inputType"]}`,
      body
    );
    data["amount"] = inputData["amount"];
    console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const postEditorJsonAPI = async (inputData) => {
  const body = {
    user_id: inputData["userId"],
    id: inputData["id"],
    data: inputData["data"],
    workingDir: inputData["workingDir"],
  };
  console.log(body);
  try {
    await API2.post(`/post_json`, body);
  } catch (e) {
    console.error(e);
  }
};
export const getEditorJsonAPI = async (inputData) => {
  try {
    const { data } = await API2.get(
      `/get_json/${inputData["userId"]}/${inputData["id"]}`
    );
    console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const postDziAPI = async (inputData) => {
  const body = {
    user_id: inputData["userId"],
    storage_file_path: inputData["storageFilePath"],
    data_type: inputData["dataType"],
    do_background: inputData["doBackground"],
    min_col: inputData["minCol"],
    max_col: inputData["maxCol"],
    min_row: inputData["minRow"],
    max_row: inputData["maxRow"],
    cur_level: inputData["curLevel"],
    all_tiles: inputData["allTiles"],
    skip: inputData["skip"],
    top_level: inputData["topLevel"],
    with_pyramid: inputData["withPyramid"],
    highest_level_all: inputData["highestLevelAll"],
  };
  console.log(body);
  try {
    const { data } = await API.post(`/data/create_deepzoom`, body);
    console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
// export const getDziAPI = async (inputData) => {
//   try {
//     const { data } = await API.get(
//       `/data/get_deepzoom/${inputData["userId"]}/${inputData["storageFilePath"]}/${inputData["dataType"]}`
//     );
//     console.log(data);
//     return data;
//   } catch (e) {
//     console.error(e);
//   }
// };
export const getTaskStatus = async (inputData) => {
  try {
    const { data } = await API.get(
      `/data/get_task_status?task_id=${inputData}`
    );
    // console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const postViewAreaAPI = async (inputData) => {
  const body = {
    node_id: inputData["nodeId"],
    storage_file_path: inputData["storageFilePath"],
    min_col: inputData["minCol"],
    max_col: inputData["maxCol"],
    min_row: inputData["minRow"],
    max_row: inputData["maxRow"],
    cur_level: inputData["curLevel"],
    top_level: inputData["topLevel"],
  };
  try {
    const { data } = await API.post(`/viewer/save_viewarea`, body);
    console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const getViewAreaAPI = async () => {
  try {
    const { data } = await API.get(`/viewer/get_viewarea`);
    // console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const getViewAreaFromPathAPI = async (inputData) => {
  try {
    const { data } = await API.get(
      `/viewer/get_viewarea?storage_file_path=${inputData}`
    );
    // console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const purgeAPI = async () => {
  try {
    const { data } = await API.post(`/node/purge`);
    // console.log(data);
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const getFilesAPI = async (dir, ext) => {
  try {
    const { data } = await API.get(
      `/storage/get_storage_files/` + ext + '/' + dir
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const getFoldersAPI = async (dir) => {
  try {
    const { data } = await API.get(
      `/storage/get_storage_folders/` + dir
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};



export const getCellFilesAPI = async (dir) => {
  try {
    const { data } = await API.get(
      `/storage/get_cell_files/` + dir
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const getWorkspace = async (code) => {
  try {
    const { data } = await API2.get(
      '/get_workspace/' + code
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};




export const saveWorkspace = async (inputData) => {
  const body = {
    access_code: inputData["access_code"],
    data: inputData["data"],
  };
  console.log(body);
  try {
    await API2.post('/save_workspace/', body);
  } catch (e) {
    console.error(e);
  }
};

export const XRDeviceConnectAPI = async (ip,port) => {
  try {
    const { data } = await API.get(
      `/holoSensor/device/connect/` + ip + '/' + port
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRDeviceDisconnectAPI = async (ip,port) => {
  try {
    const { data } = await API.get(
      `/holoSensor/device/disconnect/` + ip + '/' + port
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};



export const XRListAPI = async () => {
  try {
    const { data } = await API.get(
      `/holoSensor/device/get_list/`
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};



export const XRSensorDataStartAPI = async (key,sensor,gesture,id) => {
  try {
    const { data } = await API.get(
      `/holoSensor/receive/sensor/start/` + key + '/' + sensor.toString() + '/' + gesture.toString() + '/' + id
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRSensorDataStopAPI = async (key) => {
  try {
    const { data } = await API.get(
      `/holoSensor/receive/sensor/stop/` + key
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRSensorDataStatusAPI = async (key) => {
  try {
    const { data } = await API.get(
      `/holoSensor/receive/sensor/status/` + key
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRDepthToPointCloudAPI = async (result) => {
  var temp = result;
  // for (let i = 1; i < result.length; i++) {
  //   temp = temp + ',' + result[i];
  // }

  try {
    const { data } = await API.get(
      `/holoSensor/processing/depth_to_pc/` + temp);
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRSendPointCloudAPI = async (key,path) => {
  // const body = {
  //   key: key,
  //   point_list: points,
  // };
  try {
    const { data } = await API.get(
      `/holoSensor/send/point_cloud/` + key + '/' + path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRGetFieldsAPI = async (path) => {
  try {
    const { data } = await API.get(
      `/holoSensor/data/fields/` +  path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRSendDXRData = async (key,path,mark,encoding_list,id) => {
  const body = {
    key: key,
    data: path,
    mark: mark,
    encoding_num: encoding_list.length,
    encoding: encoding_list,
  };
//  encoding: [{channel: 'ya',data_field: 'ne',data_type: 'imma'},{channel: 'ya2',data_field: 'ne2',data_type: 'imma2'}],
  try {
    console.log('XR Send DXRData API: ');
    console.log(id);
    console.log(body);
      const { data } = await API.post(
      `/holoSensor/send/dxr/`+id+'/',body
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRSendDXRSpec = async (key,spec,pos,id,link) => {
  const body = {
    spec: spec,
    transform: pos,
    link: link
  };
//  encoding: [{channel: 'ya',data_field: 'ne',data_type: 'imma'},{channel: 'ya2',data_field: 'ne2',data_type: 'imma2'}],
  try {
    console.log('XR Send DXR Spec API: ');
    console.log(id);
    console.log(body);
      const { data } = await API.post(
      `/holoSensor/send/dxr/`+id + '/' + key + '/',body
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRGetTextAPI = async (path) => {
  try {
      const { data } = await API.get(
      `holoSensor/get_text/`+path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRGetCSVAPI = async (path) => {
  try {
      const { data } = await API.get(
      `holoSensor/get_csv/`+path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRGetJSONAPI = async (path) => {
  try {
      const { data } = await API.get(
      `holoSensor/get_json/`+path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const XRGetAPIAPI = async (path) => {
  try {
      const { data } = await API.get(
      `holoSensor/get_api/`+path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRGetPrefixFilesAPI = async (path) => {
  // const body = {
  //   key: key,
  //   point_list: points,
  // };
  try {
    const { data } = await API.get(
      `/storage/get_storage_files_by_prefix/` + path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRSetVisPosAPI = async (key,pos,id) => {
  const body = {
    transform: pos 
  };
//  encoding: [{channel: 'ya',data_field: 'ne',data_type: 'imma'},{channel: 'ya2',data_field: 'ne2',data_type: 'imma2'}],
  try {
      const { data } = await API.post(
      `/holoSensor/send/set_position/`+id + '/' + key,body
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRGetVisPosAPI = async (key,id) => {
//  encoding: [{channel: 'ya',data_field: 'ne',data_type: 'imma'},{channel: 'ya2',data_field: 'ne2',data_type: 'imma2'}],
  try {
      const { data } = await API.get(
      `/holoSensor/send/get_position/`+id + '/' + key,
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRDeleteVisAPI = async (key,id) => {
    try {
        const { data } = await API.post(
        `/holoSensor/send/delete_vis/`+id + '/' + key,
      );
      return data;
    } catch (e) {
      console.error(e);
    }
};
  

export const XRFaceDetectionAPI = async (path,ROI) => {

  try {
    const { data } = await API.get(
      `/holoSensor/processing/face_detection/`+ ROI.xmin + '/' + ROI.xmax + '/' 
                                              + ROI.ymin + '/' + ROI.ymax + '/' + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRAIFaceDetectionAPI = async (path) => {
  try {
    const { data } = await API.get(
      '/holoSensor/processing/yolo/facefeature/' + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRImageToPointDataAPI = async (id,path,ROI) => {

  try {
    const { data } = await API.get(
      `/holoSensor/processing/image_to_pc/`+ id + '/' + ROI.xmin + '/' + ROI.xmax + '/' 
                                           + ROI.ymin + '/' + ROI.ymax + '/' + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRISOSurfacingAPI = async (id,path,option) => {

  try {
    const { data } = await API.get(
      `/holoSensor/processing/iso_surfacing/`+ id + '/' + option + '/' + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRVolumeToPointDataAPI = async (id,path) => {

  try {
    const { data } = await API.get(
      `/holoSensor/processing/volume_to_pc/` + id + '/' + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const XROutlierRemovingAPI = async (id,path) => {

  try {
    const { data } = await API.get(
      `/holoSensor/processing/remove_outlier/` + id + '/' + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const XRCalculateCurvatureAPI = async (id,path) => {

  try {
    const { data } = await API.get(
      `/holoSensor/processing/calculate_curvature/` + id + '/' + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const XRDataFilteringAPI = async (id,path,field,vmin,vmax) => {

  try {
    const { data } = await API.get(
      `/holoSensor/processing/data_filtering/` + id + '/' + field 
                                            + '/' + vmin.toString() + '/' + vmax.toString() 
                                            + '/' + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRICPAPI = async (source,target) => {
  const body = {
    source: source,
    destination: target 
  };
  try {
      const { data } = await API.post(
      '/holoSensor/processing/icp/',body
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRAIFaceRegistrationAPI = async (source,target) => {
  const body = {
    source: source,
    destination: target 
  };
  try {
      const { data } = await API.post(
      '/holoSensor/processing/yolo/registration/',body
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRTransformAPI = async (id,input,matrix) => {
  const body = {
    source: input,
    transform: matrix 
  };
  try {
      const { data } = await API.post(
      '/holoSensor/processing/transform/' + id + '/',body
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRGetICPRenderingAPI = async (target,source,matrix,rotY,rotZ) => {
  const body = {
    source: source,
    destination: target,
    transform: matrix 
  };
  try {
    console.log(body);
      const { data } = await API.post(
      '/holoSensor/processing/icp_rendering/'+String(rotZ)+'/'+String(rotY)+'/',body
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const XRGetYOLORenderingAPI = async (target,source,matrix,rotY,rotZ) => {
  const body = {
    source: source,
    destination: target,
    transform: matrix 
  };
  try {
    console.log(body);
      const { data } = await API.post(
      '/holoSensor/processing/yolo_rendering/'+String(rotZ)+'/'+String(rotY)+'/',body
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRGetPointRenderingAPI = async (path,rotY,rotZ) => {

  try {
      const { data } = await API.post(
      '/holoSensor/processing/point_rendering/'+String(rotZ)+'/'+String(rotY)+'/'+path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const XRGetMixedRealityViewAPI = async (key) => {

  try {
      const { data } = await API.get(
      '/holoSensor/rendering/mixed_reality_view/'+key
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRGetDataMaxAPI = async (field,path) => {

  try {
      const { data } = await API.get(
      '/holoSensor/get_max/'+field+'/'+path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};
export const XRGetDataMinAPI = async (field,path) => {

  try {
      const { data } = await API.get(
      '/holoSensor/get_min/'+field+'/'+path
    );
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRImageToPosAPI = async (path,ROI,type) => {

  try {
    const { data } = await API.get(
      `/holoSensor/processing/image_to_pos/` + type + '/' + ROI.xmin + '/' + ROI.xmax + '/' 
                                           + ROI.ymin + '/' + ROI.ymax + '/' + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};


export const XRImageProcessCustomAPI = async (path,func) => {
  const body = {
    path: path,
    func: func
  };

  try {
    const { data } = await API.post(
      `/holoSensor/processing/custom/image/`,body);
    return data;
  } catch (e) {
    console.error(e);
  }
};

export const XRGetMeshAPI = async (path) => {

  try {
    const { data } = await API.get(
      `/holoSensor/processing/generate_mesh/` + path);
    return data;
  } catch (e) {
    console.error(e);
  }
};
