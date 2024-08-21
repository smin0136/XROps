import "./diagram.styles.scss";
import API from "../../utils/axios";
import ControlPanel from "../../rete1/control-panel/control-panel.component";
import { useEffect, useState, useRef } from "react";
import { Navbar, Container, Nav, NavDropdown, NavItem } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "rsuite/dist/rsuite.min.css";
import { useRete } from "../../rete1/rete";
import { getEditorJsonAPI, postEditorJsonAPI } from "../../rete1/api";
import { getWorkspace } from "../../rete1/api";

import { useLocation } from "react-router";


function App() {
  const { state } = useLocation();
  console.log("Access Code: ",state);
  const access_code = state;

  const [state1, setState1] = useState(access_code);
  const [setContainer] = useRete(state1,true);

  const [access, setAccess] = useState(false);


  const controlPanel = useRef();

  async function setInitialWorkingDir(){

    var workspace_data = await getWorkspace(access_code);
    console.log(workspace_data);

    var _msg = workspace_data["message"];

    if(_msg==="Success"){
      setAccess(true);
    }
    else{
      setAccess(false);
    }
  }



  useEffect(() => {
    setInitialWorkingDir();
  }, []);

  if(access){

    return (
      <div>
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
          <Navbar.Brand href="https://vience.io:6030/">XROps</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link href="http://vienceNas-sub.quickconnect.to/">File Browser</Nav.Link>
                <Nav.Link
                  onClick={async () => {
                    // await deleteAllAPI();
                  }}
                >
                  | Access Code [{access_code}]
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <ControlPanel parent={controlPanel}/>
        <div className="rete" code={access_code} ref={(ref) => ref && setContainer(ref)} />
      </div>
    );
  }
  else{
    return(
      <div
        style={{
          margin: "30px",
          fontWeight: "700"
        }}
        >
        Permission denied.
        <br />
        Use the correct access code or contact [ orangeblush@korea.ac.kr ] to get an access code.
      </div>
    );
  }
}

export default App;
