import { useNavigate } from "react-router-dom";
import "./demo1-main.styles.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { faCloud } from "@fortawesome/free-solid-svg-icons";
import { Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';
import { useEffect, useState } from "react";
import CheckOutline from '@rsuite/icons/CheckOutline';
import { useLocation } from "react-router";
import App from "./demo1-diagram.component"

{/* <embed src="http://117.52.72.211:6030/" style={{width: "100%", height: "100vh"}}>
</embed> */}

{/* <iframe type="text/html" src="http://117.52.72.211:3303/" style={{width: "100%", height: "99vh"}}>
</iframe> */}


var doc_url = { "training":"https://docs.google.com/document/d/e/2PACX-1vQT9-iiQCi9PWRBPl17O9PIuHPxPznPXlO8bQ2BksUM73yNCTLPXiUIjrdKpXq83TCe4Ub87m9_uCDZ/pub?embedded=true",
                "demo1":"https://docs.google.com/document/d/e/2PACX-1vRLoxszWbRRHyt1IY0fsWcqh16MymKeck3Jx1H3BVyxvspmDYxcs4UIpaH1jlCxP06lOi2AHNDDFVdE/pub?embedded=true",
                "demo2":"https://docs.google.com/document/d/e/2PACX-1vTZDR58c9hD_ZhvG6ClfaLKHPSJPH4XTpyy1fsO6C8CRKgWJ4zFv_ts-B0zdVkCw1tF_9B8-DqTtbbz/pub?embedded=true",
                "demo3":"https://docs.google.com/document/d/e/2PACX-1vR2a2GLq1YLxzEUEAjThaYNXZGJ0GJdmj01NhtPNlcksjlLdMkPrZ3HXt-G2XQua8P41RzdsBy2kVab/pub?embedded=true",
                "demo4":"https://docs.google.com/document/d/e/2PACX-1vT_rixtu9uvInqagjBJIW1zO8dVk3lakT7ITQER7xr1qR8oto6AmQbMg3GO1ysr_ED-Slxp0GIKWyNA/pub?embedded=true",
                "demo5":"https://docs.google.com/document/d/e/2PACX-1vQmivSdh5JWsshUJYU-UJOxzzD422jH53H7WUZj19YmzCTwk2MtVmZr8vg5rnOrj-W8zZDLriNEqJ58/pub?embedded=true",
                "demo6":"https://docs.google.com/document/d/e/2PACX-1vRfGs1N1P_4gMSdfVcfM8cQ2FO0eFCvoLa6xUGemB3ORtoJW_1IU5ebCcxEenFCmdTbSkHd5dGEsA8w/pub?embedded=true"}

const Demo1 = () => {

  const { state } = useLocation();
  console.log("Access Code: ",state);

  const [open, setOpen] = useState('none');

  const handleManual = () => {
    if(open==='none'){
      setOpen('flex');
    }
    else{
      setOpen('none');
    }
  };


  return (
    <div style={{display:"flex", flexDirection:"row"}}>
      <div style={{width:"100%", overflow: "auto"}}>
        <App access_code={state} />
      </div>

      <Button style={{backgroundColor: "#3848a1"}} onClick={handleManual}> <span style={{color: "white", fontWeight:"900"}}>Manual</span> </Button>

      <div style={{display: open, width:"40%"}}>
        <iframe src={doc_url[state]}
                style={{width:"100%", height: "90%"}}>
        </iframe>      
      </div>
    </div>
  );
};

export default Demo1;
