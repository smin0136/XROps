import { useNavigate } from "react-router-dom";
import "./home.styles.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { faCloud } from "@fortawesome/free-solid-svg-icons";
import { Modal, Button, ButtonToolbar, Placeholder, IconButton } from 'rsuite';
import { useEffect, useState } from "react";
import CheckOutline from '@rsuite/icons/CheckOutline';

const Home = () => {
  let navigate = useNavigate();

  const [size, setSize] = useState();
  const [open, setOpen] = useState(false);

  // console.log(value);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [code, setCode] = useState('');

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const submitCode = () => {
    navigate("/platform",{state: code});
  };



  const [open_demo1, setOpen_demo1] = useState(false);

  // console.log(value);

  const handleOpen_demo1 = () => setOpen_demo1(true);
  const handleClose_demo1 = () => setOpen_demo1(false);

  const [code_demo1, setCode_demo1] = useState('');

  const handleCodeChange_demo1 = (e) => {
    setCode_demo1(e.target.value);
  };
  const submitCode_demo1 = () => {
    navigate("/demo",{state: code_demo1});
  };

  return (
    <div className="home-background">
      <div className="home-box">
        <div className="title-buttons-container">
          <h1 className="home-title">XROps</h1>
          <p className="sub-title">
            Visual Programming-based XR Authoring Platform. Ver 1.2.0
          </p>
          <div className="home-buttons-container">
            <ButtonToolbar>
              <Button className="button-start" onClick={handleOpen}> Platform </Button>
            </ButtonToolbar>
            <Modal className="access-modal" open={open} onClose={handleClose}>
              <Modal.Header>
                <Modal.Title className="access-modal-text"> Access Code: </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <input className="textEdit"
                  type="text"
                  placeholder=""
                  value={code} onChange={handleCodeChange}
                />
                <IconButton onClick={submitCode} icon={<CheckOutline />} color="yellow" appearance="primary" />

              </Modal.Body>
              <Modal.Footer>
                If you want to try this plaform, please contact us <br /> [ orangeblush@korea.ac.kr ]
              </Modal.Footer>
            </Modal>
            {/* 
            <button
              className="button-start"
              onClick={() => {
                navigate("/platform");
              }}
            >
              Platform
            </button> */}
            {/* <button
              className="button-docs"
              onClick={() => {
                window.open("http://vienceNas-sub.quickconnect.to/", "_blank");
              }}
            >
              <FontAwesomeIcon icon={faCloud} className="icon" size="1x" />
              Repository
            </button> */}

            <button
              className="button-docs"
              onClick={() => {
                window.open("https://sites.google.com/view/xrops", "_blank");
              }}
            >
              <FontAwesomeIcon icon={faBook} className="icon" size="1x" />
              Documentation
            </button>


            <ButtonToolbar>
              <Button className="button-start" onClick={handleOpen_demo1}> Demo </Button>
            </ButtonToolbar>
            <Modal className="access-modal" open={open_demo1} onClose={handleClose_demo1}>
              <Modal.Header>
                <Modal.Title className="access-modal-text"> Access Code: </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <input className="textEdit"
                  type="text"
                  placeholder=""
                  value={code_demo1} onChange={handleCodeChange_demo1}
                />
                <IconButton onClick={submitCode_demo1} icon={<CheckOutline />} color="yellow" appearance="primary" />

              </Modal.Body>
              <Modal.Footer>
                If you want to try this plaform, please contact us <br /> [ orangeblush@korea.ac.kr ]
              </Modal.Footer>
            </Modal>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
