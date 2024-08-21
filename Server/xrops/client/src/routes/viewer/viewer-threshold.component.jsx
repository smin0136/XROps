import React, { useEffect, useState } from "react";
import { OpenSeaDragonViewer } from "./openseadragon-viewer-threshold.component";
import { useParams } from "react-router-dom";
import API from "../../utils/axios";
import "./viewer.styles.scss";

const Viewer = (props) => {
  console.log(props);
  const dir = props.path;
  console.log(dir);
  const user_id = props.user_id;
  const server = props.server;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center",
        margin: "0",
        width: "100%",
        height: "100%",
      }}
    >
      <div>
        <OpenSeaDragonViewer
          userId={user_id}
          dataPath={dir}
          server={server}
        />
      </div>
    </div>
  );
};

export default Viewer;
