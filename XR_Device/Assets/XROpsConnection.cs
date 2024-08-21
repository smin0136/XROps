using System;
using System.Collections;
using System.Net.Sockets;
using System.Net;
using UnityEngine;
using UnityEngine.Networking;
using SimpleJSON;
using DxR;
using System.Collections.Generic;
using Microsoft.MixedReality.Toolkit.Input;
using UnityEngine.XR.OpenXR.Input;
using System.Runtime.CompilerServices;


public class XROpsConnection : MonoBehaviour
{
    // Start is called before the first frame update

    void Awake()
    {
        ConncetionStatus.material.color = Color.red;
    }

    private void OnApplicationFocus(bool focus)
    {
        if (!focus)
        {
            startDisconnection();
            Debug.Log("end");
        }
    }



    [SerializeField]
    string hostIPAddress, port;

    public Renderer ConncetionStatus;
    public UnityEngine.UI.Text text;
    public bool connected = false;
    public bool frontConnection = false;
    public GameObject sensorSave;
    public string key = "";
    private string pwd = "";
    private string publicIP;

    JSONNode serverVisSpec = null;
    GenerateVis gv;
    tempCapture tc;
    SideLoadFromXROps sl;
    public Vis targetVis = null;
    public GameObject imagePrefab;                           // Prefab game object for instantiating marks.
    List<GameObject> renderedImages = new List<GameObject>();
    List<GameObject> renderedMeshes = new List<GameObject>();
    List<GameObject> renderedVolumes = new List<GameObject>();



    public JSONNode GetServerVisSpecs()
    {
        return serverVisSpec;
    }



    public bool Connected
    {
        get { return connected; }
    }

    [System.Serializable]
    public class MeshData
    {
        public List<Vector3> vertices;
        public int[] faces;
        public List<Vector3> normals;
    }

    public MeshData LoadMeshDataFromJSON(string path)
    {
        TextAsset meshJson = Resources.Load<TextAsset>(path);
        if (meshJson != null)
        {
            return JsonUtility.FromJson<MeshData>(meshJson.text);
        }
        else
        {
            Debug.LogError("Failed to load mesh data.");
            return null;
        }
    }

    void Start()
    {

        gv = GetComponent<GenerateVis>();
        sl = GetComponent<SideLoadFromXROps>();
        tc = GetComponent<tempCapture>();


    }

    // Update is called once per frame
    void Update()
    {

    }

    private void checkStatusStart ()
    {
        StartCoroutine(checkStatus());
    }

    public void startConnection()
    {
        StartCoroutine(getUserName());

    }

    public void ConnectServerEvent()
    {
        if (!connected) startConnection();
        else startDisconnection();
    }


    private IEnumerator getUserName()
    {
        string url = "https://vience.io:6040/holoSensor/device/get_username/";
        UnityWebRequest webRequest = UnityWebRequest.Get(url);
        yield return webRequest.SendWebRequest();

        if (webRequest.result == UnityWebRequest.Result.ConnectionError ||
            webRequest.result == UnityWebRequest.Result.ProtocolError)
        {
            Debug.LogError("Error: " + webRequest.error);
            ConncetionStatus.material.color = Color.red;


        }
        else
        {
            // Or retrieve results as binary data
            string key_encoded = webRequest.downloadHandler.text;

            string[] idpwd = key_encoded.Split(new string[] { "," }, StringSplitOptions.None);
            key = idpwd[0].Replace("\"", "");
            pwd = idpwd[1].Replace("\"", "");
            text.text = "your id: " + key + "\n your pwd: " + pwd;
            connected = true;
            ConncetionStatus.material.color = Color.yellow;
            if (key != "" && connected == true)
            {
                InvokeRepeating("checkStatusStart", 0, 1);
            }
        }
    }

    public static string GetLocalIPAddress()
    {
        var host = Dns.GetHostEntry(Dns.GetHostName());
        foreach (var ip in host.AddressList)
        {
            if (ip.AddressFamily == AddressFamily.InterNetwork)
            {
                return ip.ToString();
            }
        }
        throw new System.Exception("No network adapters with an IPv4 address in the system!");
    }

    private IEnumerator sendAddress()
    {
        string ip = GetLocalIPAddress();
        string url = "https://vience.io:6040/holoSensor/device/socket_address/" + key + "/" + ip + "/0000/";
        UnityWebRequest webRequest = UnityWebRequest.Get(url);
        yield return webRequest.SendWebRequest();

        if (webRequest.result == UnityWebRequest.Result.ConnectionError ||
            webRequest.result == UnityWebRequest.Result.ProtocolError)
        {
            Debug.LogError("Error: " + webRequest.error);
            ConncetionStatus.material.color = Color.red;


        }
        else
        {
            // Or retrieve results as binary data
            string result = webRequest.downloadHandler.text;
            result = result.Trim('\"');

            if (result == "success")
            {
                text.text = "";
                frontConnection = true;
                ConncetionStatus.material.color = Color.green;


            }
            else
            {
                text.text += publicIP;
                startDisconnection();
            }

        }
    }

    private IEnumerator checkStatus()
    {

        if (key.Length < 1)
        {
            startDisconnection() ;
        }
        else
        {
            string url = "https://vience.io:6040/holoSensor/device/status/" + key;
            UnityWebRequest webRequest = UnityWebRequest.Get(url);
            yield return webRequest.SendWebRequest();

            if (webRequest.result == UnityWebRequest.Result.ConnectionError ||
                webRequest.result == UnityWebRequest.Result.ProtocolError)
            {
                Debug.LogError("Error: " + webRequest.error);


            }
            else
            {
                // Or retrieve results as binary data
                string status = webRequest.downloadHandler.text;
                //byte[] status = webRequest.downloadHandler.data;
                //string statusToString = Encoding.UTF8.GetString(status);
                string statusToString = status.Trim('\"');

                JSONNode statusJSON = JSON.Parse(statusToString);
                string request = statusJSON["request"];

                request = request.Trim('\"');
                request = request.Trim('\\');


                if (request == "empty" && frontConnection == false)
                {
                    StartCoroutine(sendAddress());
                    //SendSocketAddr();
                }
                else if (request == "sensor")
                {
                    string sensor = statusJSON["sensor"];

                    sensor = sensor.Trim('\"');
                    sensor = sensor.Trim('\\');

                    tc.key =  statusJSON["key"];

                    string action = statusJSON["gesture"];

                    if (action == "pinch")
                    {
                        gameObject.GetComponent<InputActionHandler>().enabled = true;
                    }
                    else if (action == "button")
                    {
                        sensorSave.SetActive(true);
                    }

                    if (sensor == "pv")
                    {
                        startSensorPV();
                    }
                    else if (sensor == "research_mode")
                    {
                        startSensorRM();
                    }
                    else if (sensor == "spatial_input")
                    {
                        startSensorSI();
                    }
                }
                else if (request == "disconnect")
                {
                    ConncetionStatus.material.color = Color.red;
                    text.text = "Connect to XROps";
                    key = "";
                    pwd = "";
                    connected = false;
                    frontConnection = false;
                }
                else if (request == "waiting")
                {
                    Debug.Log("waiting");
                }
                else
                {
                    if (request == "visspec")
                    {
                        JSONNode visspec = statusJSON["visspec"];

                        //string visspec = statusJSON["visspec"];
                        //visspec = visspec.Trim('\\');
                        string spec = visspec.ToString();


                        JSONArray array = statusJSON["transformation"].AsArray;

                        float[] trans = new float[array.Count];

                        for (int i = 0; i < trans.Length; i++)
                        {
                            float value = array[i].AsFloat;
                            trans[i] = value;
                        }
                        checkVisSpecs(spec, trans);

                    }
                    else if (request == "delete")
                    {

                        string trans_id = statusJSON["id"];
                        deleteVis(trans_id);

                    }
                    else if (request == "get_position")
                    {

                        string trans_id = statusJSON["id"];
                        string key = statusJSON["key"];

                        getCurrentTransformation(trans_id, key);


                    }
                    else if (request == "set_position")
                    {

                        string trans_id = statusJSON["id"];
                        JSONArray array = statusJSON["transformation"].AsArray;

                        float[] trans = new float[array.Count];

                        for (int i = 0; i < trans.Length; i++)
                        {
                            float value = array[i].AsFloat;
                            trans[i] = value;
                        }
                        setCurrentTransformation(trans_id, trans);
                    }
                    else if (request == "image")
                    {
                        string texture = statusJSON["image"];
                        string trans_id = statusJSON["id"];

                        byte[] texturearray = Convert.FromBase64String(texture);
                        JSONArray array = statusJSON["transformation"].AsArray;

                        float[] trans = new float[array.Count];

                        for (int i = 0; i < trans.Length; i++)
                        {
                            float value = array[i].AsFloat;
                            trans[i] = value;
                        }

                        string posString = statusJSON["link"];


                        render2DImage(texturearray, trans_id, trans, posString);

                    }
                    else if (request == "volume")
                    {
                        JSONArray rawData = statusJSON["data"].AsArray;
                        int w = statusJSON["width"].AsInt;
                        int h = statusJSON["hieght"].AsInt;
                        int d = statusJSON["depth"].AsInt;
                        string id = statusJSON["id"];
                        string posString = statusJSON["link"];
                        JSONArray array = statusJSON["transformation"].AsArray;
                        int roi = statusJSON["roi"].AsInt;

                        float[] trans = new float[array.Count];

                        for (int i = 0; i < trans.Length; i++)
                        {
                            float value = array[i].AsFloat;
                            trans[i] = value;
                        }


                        ushort[] rawDataArr = new ushort[rawData.Count];

                        for (int i = 0; i < rawDataArr.Length; i++)
                        {
                            ushort value = rawData[i].AsUshort;
                            rawDataArr[i] = value;
                        }

                        //ushort[] ushortArray = new ushort[rawData.Length / 2];

                        //for (int i = 0; i < rawData.Length; i += 2)
                        //{
                        //    ushort value = (ushort)(rawData[i] | (rawData[i + 1] << 8));
                        //    ushortArray[i / 2] = value;
                        //}

                        ushort min = FindMinValue(rawDataArr);
                        ushort max = FindMaxValue(rawDataArr);


                        // ushort 배열을 정규화하여 float 배열로 변환
                        float[] floatArray = NormalizeUShortArray(rawDataArr, min, max);
                        //renderVolume(floatArray, w, h, d, "");
                        renderVolume(floatArray, w, h, d, id, trans, posString, roi);


                    }
                    else if (request == "mesh")
                    {
                        JSONArray faces = statusJSON["faces"].AsArray;
                        JSONArray values = statusJSON["values"].AsArray;
                        JSONArray normals = statusJSON["normals"].AsArray;
                        int roi = statusJSON["roi"].AsInt;

                        string id = statusJSON["id"];
                        string posString = statusJSON["link"];
                        JSONArray array = statusJSON["transformation"].AsArray;

                        float[] trans = new float[array.Count];

                        for (int i = 0; i < trans.Length; i++)
                        {
                            float value = array[i].AsFloat;
                            trans[i] = value;
                        }

                        int[] faces_int = new int[faces.Count];

                        for (int i = 0; i < faces_int.Length; i++)
                        {
                            faces_int[i] = faces[i].AsInt;
                        }

                        Vector3[] values_vec = new Vector3[values.Count];

                        for (int i = 0; i < values_vec.Length; i++)
                        {
                            Vector3 value = new Vector3(values[i][0].AsFloat, values[i][1].AsFloat, values[i][2].AsFloat);
                            values_vec[i] = value;
                        }

                        Vector3[] normals_vec = new Vector3[normals.Count];

                        for (int i = 0; i < normals_vec.Length; i++)
                        {
                            Vector3 value = new Vector3(normals[i][0].AsFloat, normals[i][1].AsFloat, normals[i][2].AsFloat);
                            normals_vec[i] = value;
                        }
                        renderMesh(id, values_vec, faces_int, normals_vec, trans, posString, roi);

                    }
                    else if (request == "marker")
                    {
                        string texture = statusJSON["image"];
                        string key = statusJSON["key"];

                        key = key.Trim('\"');
                        key = key.Trim('\\');
                        if (key.Contains("stop"))
                        {
                            sl.stopMarkUpdate();
                        }
                        else
                        {
                            byte[] texturearray = Convert.FromBase64String(texture);
                            sl.CreateImageTargetFromXROps(texturearray, key);
                        }
                    }



                }

            }
        }

    }


    public void startDisconnection()
    {
        CancelInvoke("checkStatusStart");
        StartCoroutine(disconnectFromDevice());
    }


    private IEnumerator disconnectFromDevice()
    {
        string url = "https://vience.io:6040/holoSensor/device/disconnect/" + key + "/" + pwd;
        UnityWebRequest webRequest = UnityWebRequest.Get(url);
        yield return webRequest.SendWebRequest();

        if (webRequest.result == UnityWebRequest.Result.ConnectionError ||
            webRequest.result == UnityWebRequest.Result.ProtocolError)
        {
            Debug.LogError("Error: " + webRequest.error);


        }
        else
        {
            ConncetionStatus.material.color = Color.red;
            text.text = "Connect to XROps";
            key = "";
            pwd = "";
            connected = false;
            frontConnection = false;

        }
    }


    private void checkVisSpecs(string request, float[] trans)
    {
        //text.text = trans.ToString() + "\n";

        serverVisSpec = JSON.Parse(request);



        var visList = gv.VisList;
        bool match = false;
        for (int i = 0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            if (visSpec["id"] == serverVisSpec["id"])
            {
                targetVis =  visList[i];

                match = true;
                break;
            }
        }

        if (match == false)
        {
            targetVis = gv.makeVisPrefab();
        }

        if (trans != null)
        {
            bool onlyZero = true;
            for (int k = 0; k<trans.Length; k++)
            {
                if (trans[k] != 0)
                    onlyZero = false;
            }
            if (!onlyZero)
            {
                Vector3 position = new Vector3(trans[0], trans[1], trans[2]);
                Vector3 scale = new Vector3(trans[6], trans[7], trans[8]);
                targetVis.transform.position = position;
                targetVis.transform.rotation = Quaternion.Euler(trans[3], trans[4], trans[5]);
                targetVis.transform.localScale = scale;
            }
            else
            {
                if (match == false)
                {

                    bool isWorld = false;

                    if (serverVisSpec["encoding"]["x"] != null)
                    {
                        string dataType = serverVisSpec["encoding"]["x"]["type"].Value;
                        if (dataType.Contains("coordinate"))
                        {
                            targetVis.transform.position = Vector3.zero;
                            targetVis.transform.rotation = Quaternion.identity;
                            isWorld = true;

                        }
                    }

                    if (isWorld==false)
                    {
                        Quaternion t1 = new Quaternion();
                        //axis의 roation 정보
                        t1.SetFromToRotation(targetVis.transform.forward, Camera.main.transform.forward);
                        targetVis.transform.rotation = targetVis.transform.rotation * t1;
                        t1.SetFromToRotation(targetVis.transform.up, Vector3.up);
                        targetVis.transform.rotation = targetVis.transform.rotation * t1;

                        Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;
                        targetVis.transform.position = pos;
                    }

                    Vector3 scale = new Vector3(1, 1, 1);
                    //targetVis.transform.rotation = Quaternion.Euler(0, 0, 0);
                    targetVis.transform.localScale = scale;

                    targetVis.initialTransform = new Matrix4x4();
                    targetVis.initialTransform.SetTRS(targetVis.transform.position, targetVis.transform.rotation, targetVis.transform.localScale);

                }
            }

            targetVis.UpdateVisSpecsFromServer();
        }



    }



    private void render2DImage(byte[] texture, string trans_id, float[] trans, string posString)
    {

        bool isMade = false;
        GameObject imageQuad = null;
        for (int i = 0; i < renderedImages.Count; i++)
        {
            string image_id = renderedImages[i].name;

            if (image_id.Contains(trans_id))
            {
                imageQuad = renderedImages[i];


                Material ImageMaterial = imageQuad.GetComponent<MeshRenderer>().material;

                Texture2D ImageTexture = new Texture2D(2, 10);

                ImageMaterial.mainTexture = ImageTexture;
                ImageTexture.LoadImage(texture);
                ImageTexture.Apply();

                isMade = true;
                break;
            }
        }


        if (isMade == false)
        {
            Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

            imagePrefab = Resources.Load("Marks/image/image") as GameObject;
            if (imagePrefab == null)
                Debug.Log("this is null");
            imageQuad = Instantiate(imagePrefab, pos, Quaternion.identity);
            imageQuad.name = trans_id.Trim(' ');



            Material ImageMaterial = imageQuad.GetComponent<MeshRenderer>().material;

            Texture2D ImageTexture = new Texture2D(2, 10);

            ImageMaterial.mainTexture = ImageTexture;
            ImageTexture.LoadImage(texture);
            ImageTexture.Apply();

            renderedImages.Add(imageQuad);
        }




        if (trans != null)
        {
            bool onlyZero = true;
            for (int k = 0; k<trans.Length; k++)
            {
                if (trans[k] != 0)
                    onlyZero = false;
            }
            if (!onlyZero)
            {
                Vector3 position = new Vector3(trans[0], trans[1], trans[2]);
                Vector3 scale = new Vector3(trans[6], trans[7], trans[8]);
                imageQuad.transform.position = position;
                imageQuad.transform.rotation = Quaternion.Euler(trans[3], trans[4], trans[5]);
                imageQuad.transform.localScale = scale;
            }
            else
            {
                if (isMade == false)
                {

                    Quaternion t1 = new Quaternion();
                    //axis의 roation 정보
                    t1.SetFromToRotation(imageQuad.transform.forward, Camera.main.transform.forward);
                    imageQuad.transform.rotation = imageQuad.transform.rotation * t1;
                    t1.SetFromToRotation(imageQuad.transform.up, Vector3.up);
                    imageQuad.transform.rotation = imageQuad.transform.rotation * t1;

                    Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;
                    imageQuad.transform.position = pos;


                    Vector3 scale = new Vector3(1, 1, 1);
                    //targetVis.transform.rotation = Quaternion.Euler(0, 0, 0);
                    imageQuad.transform.localScale = scale;

                }
            }
        }


        if (posString != null && posString != "")
        {
            string[] words = posString.Split('_');
            float[] position = new float[3];
            for (int i = 0; i < words.Length; i++)
            {
                position[i] = float.Parse(words[i]);
            }
            imageQuad.transform.position = new Vector3(position[0], position[1], -1 * position[2]);
        }

    }

    private void renderVolume(float[] floatArray, int w, int h, int d, string id, float[] trans, string posString, int roi)
    {
        Texture3D tex = volumeToTexture3D(floatArray, w, h, d);
        bool isMade = false;
        GameObject VolumePrefab = null;
        for (int i = 0; i < renderedVolumes.Count; i++)
        {
            //string vol_id = renderedVolumes[i].GetComponent<VolumeRendering>().id;
            string vol_id = renderedVolumes[i].name;
            if (vol_id.Contains(id))
            {
                VolumePrefab = renderedVolumes[i];
                VolumePrefab.GetComponent<VolumeRendering>().volume = tex;

                isMade = true;
                break;
            }
        }


        if (isMade == false)
        {


            Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

            GameObject volumePrefab = Resources.Load("Marks/Volume/VolumeRenderingPrefab") as GameObject;
            if (volumePrefab == null)
            {
                Debug.Log("prefab not made");
            }
            VolumePrefab = Instantiate(volumePrefab, pos, Quaternion.identity);
            VolumePrefab.GetComponent<VolumeRendering>().volume = tex;
            //VolumePrefab.GetComponent<VolumeRendering>().updateVolume();
            //VolumePrefab.GetComponent<VolumeRendering>().id = id;
            VolumePrefab.name = id.Trim(' ');

            renderedVolumes.Add(VolumePrefab);
        }




        if (trans != null)
        {
            bool onlyZero = true;
            for (int k = 0; k<trans.Length; k++)
            {
                if (trans[k] != 0)
                    onlyZero = false;
            }
            if (!onlyZero)
            {
                Vector3 position = new Vector3(trans[0], trans[1], trans[2]);
                Vector3 scale = new Vector3(trans[6], trans[7], trans[8]);
                VolumePrefab.transform.position = position;
                VolumePrefab.transform.rotation = Quaternion.Euler(trans[3], trans[4], trans[5]);
                VolumePrefab.transform.localScale = scale;
            }
            else
            {
                if (isMade == false)
                {

                    //Quaternion t1 = new Quaternion();
                    //axis의 roation 정보
                    //t1.SetFromToRotation(VolumePrefab.transform.forward, Camera.main.transform.forward);
                    //VolumePrefab.transform.rotation = VolumePrefab.transform.rotation * t1;
                    //t1.SetFromToRotation(VolumePrefab.transform.up, Vector3.up);
                    //VolumePrefab.transform.rotation = VolumePrefab.transform.rotation * t1;

                    Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;
                    VolumePrefab.transform.position = pos;

                    //targetVis.transform.rotation = Quaternion.Euler(0, 0, 0);

                }
            }
        }


        if (posString != null && posString != "")
        {
            string[] words = posString.Split('_');
            float[] position = new float[3];
            for (int i = 0; i < words.Length; i++)
            {
                position[i] = float.Parse(words[i]);
            }
            VolumePrefab.transform.position = new Vector3(position[0], position[1], -1 * position[2]);
        }
        if (roi > 0)
        {
            //float roi_size = roi * 0.0025f * 10f;
            float roi_size = roi * 0.0025f;
            VolumePrefab.transform.localScale = new Vector3(roi_size, roi_size, roi_size * 1.73913f);

        }

    }

    private void renderMesh(string trans_id, Vector3[] points, int[] faces, Vector3[] normals, float[] trans, string posString, int roi)
    {
        Mesh mesh = new Mesh();

        mesh.vertices = points;
        mesh.triangles = faces;

        if (normals.Length < 1)
            mesh.RecalculateNormals();
        else
            mesh.normals = normals;

        int face_cnt = faces.Length;
        int num = face_cnt / 3;
        int[] wires = new int[num * 3 * 2];
        for (int iTria = 0; iTria < num; iTria++)
        {
            for (int iVertex = 0; iVertex < 3; iVertex++)
            {
                wires[6 * iTria + 2 * iVertex] = faces[3 * iTria + iVertex];
                wires[6 * iTria + 2 * iVertex + 1] = faces[3 * iTria + (iVertex + 1) % 3];
            }
        }

        bool isMade = false;
        GameObject MeshPrefab = null;
        for (int i = 0; i < renderedMeshes.Count; i++)
        {
            string mesh_id = renderedMeshes[i].name;

            if (mesh_id.Contains(trans_id))
            {
                MeshPrefab = renderedMeshes[i];

                MeshPrefab.transform.Find("Mesh").GetComponent<MeshFilter>().mesh = mesh;
                /*
                Mesh line_mesh = MeshPrefab.transform.Find("mesh_line").gameObject.GetComponent<MeshFilter>().mesh;
                line_mesh.vertices = points;
                line_mesh.SetIndices(wires, MeshTopology.Lines, 0);
                line_mesh.normals = mesh.normals;*/

                isMade = true;
                break;
            }
        }


        if (isMade == false)
        {
            Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

            GameObject meshPrefab = Resources.Load("Marks/Mesh/MeshPrefab") as GameObject;
            if (meshPrefab == null)
                Debug.Log("this is null");
            MeshPrefab = Instantiate(meshPrefab, pos, Quaternion.identity);
            MeshPrefab.name = trans_id.Trim(' ');
            MeshPrefab.transform.Find("Mesh").GetComponent<MeshFilter>().mesh = mesh;

            /*
            Mesh line_mesh = MeshPrefab.transform.Find("mesh_line").gameObject.GetComponent<MeshFilter>().mesh;
            line_mesh.vertices = points;
            line_mesh.SetIndices(wires, MeshTopology.Lines, 0);
            line_mesh.normals = mesh.normals;*/

            renderedMeshes.Add(MeshPrefab);

        }




        if (trans != null)
        {
            bool onlyZero = true;
            for (int k = 0; k<trans.Length; k++)
            {
                if (trans[k] != 0)
                    onlyZero = false;
            }
            if (!onlyZero)
            {
                Vector3 position = new Vector3(trans[0], trans[1], trans[2]);
                Vector3 scale = new Vector3(trans[6], trans[7], trans[8]);
                MeshPrefab.transform.position = position;
                MeshPrefab.transform.rotation = Quaternion.Euler(trans[3], trans[4], trans[5]);
                MeshPrefab.transform.localScale = scale;
            }
            else
            {
                if (isMade == false)
                {

                    //Quaternion t1 = new Quaternion();
                    //axis의 roation 정보
                    //t1.SetFromToRotation(MeshPrefab.transform.forward, Camera.main.transform.forward);
                    //MeshPrefab.transform.rotation = MeshPrefab.transform.rotation * t1;
                    //t1.SetFromToRotation(MeshPrefab.transform.up, Vector3.up);
                    //MeshPrefab.transform.rotation = MeshPrefab.transform.rotation * t1;

                    Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;
                    MeshPrefab.transform.position = pos;


                    //Vector3 scale = new Vector3(1, 1, 1);
                    //targetVis.transform.rotation = Quaternion.Euler(0, 0, 0);
                    //MeshPrefab.transform.localScale = scale;

                }
            }
        }


        if (posString != null && posString != "")
        {
            string[] words = posString.Split('_');
            float[] position = new float[3];
            for (int i = 0; i < words.Length; i++)
            {
                position[i] = float.Parse(words[i]);
            }
            MeshPrefab.transform.position = new Vector3(position[0], position[1], -1 * position[2]);
        }

    }


    public void startSensorSI()
    {
        hl2ss.Initialize(false,false,false,true,false,false,false,false,false,false,false);
    }

    public void startSensorPV()
    {
        hl2ss.Initialize(false, true, false, false, false, false, false, false, false, false, false);
    }

    public void startSensorRM()
    {
        hl2ss.Initialize(true, false, false, true, false, false, false, false, false, false, false);
    }




    private void deleteVis(string trans_id)
    {
        //Vis vistodelete;
        //text.text = trans_id;
        trans_id = trans_id.Trim(' ');

        bool isVis = false;


        var visList = gv.VisList;
        for (int i = 0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            //text.text += "\nid: " + visSpec["id"];
            string i_vis = visSpec["id"].ToString();

            if (i_vis.Contains(trans_id))
            {
                targetVis =  visList[i];

                targetVis.DeleteAll();
                //Destroy(targetVis.worldView.gameObject);
                Destroy(targetVis.parentObject);

                gv.VisList.RemoveAt(i);
                isVis = true;
                break;
            }
        }
        bool isimage = false;
        if (!isVis) {
            for (int i = 0;i < renderedImages.Count; i++)
            {
                string image_id = renderedImages[i].name;

                if (image_id.Contains(trans_id))
                {
                    Destroy(renderedImages[i]);
                    renderedImages.RemoveAt(i);
                    isimage = true;
                    break;
                }

            }
        }
        bool isVol = false;
        if (!isimage)
        {
            for (int i = 0; i < renderedVolumes.Count; i++)
            {
                //string vol_id = renderedVolumes[i].GetComponent<VolumeRendering>().id;
                string vold_name = renderedVolumes[i].name;
                if (vold_name.Contains(trans_id))
                {
                    Destroy(renderedVolumes[i]);
                    renderedVolumes.RemoveAt(i);
                    isVol = true;
                    break;
                }
                

            }
        }
        if (!isVol)
        {
            for (int i = 0; i < renderedMeshes.Count; i++)
            {
                string mesh_id = renderedMeshes[i].name;

                if (mesh_id.Contains(trans_id))
                {
                    Destroy(renderedMeshes[i]);
                    renderedMeshes.RemoveAt(i);
                    break;
                }


            }
        }
    }
    

    private void getCurrentTransformation(string id, string key)
    {
        bool isVis = false;
        var visList = gv.VisList;
        id = id.Trim(' ');
        for (int i = 0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            string id_vis = visSpec["id"].ToString();
            if (id_vis.Contains(id))
            {

                targetVis =  visList[i];
                float[] send_trans = new float[9];
                send_trans[0]  = targetVis.parentObject.transform.position.x;
                send_trans[1]  = targetVis.parentObject.transform.position.y;
                send_trans[2]  = targetVis.parentObject.transform.position.z;
                send_trans[3]  = targetVis.parentObject.transform.rotation.eulerAngles.x;
                send_trans[4]  = targetVis.parentObject.transform.rotation.eulerAngles.y;
                send_trans[5]  = targetVis.parentObject.transform.rotation.eulerAngles.z;
                send_trans[6]  = targetVis.parentObject.transform.localScale.x;
                send_trans[7]  = targetVis.parentObject.transform.localScale.y;
                send_trans[8]  = targetVis.parentObject.transform.localScale.z;
                //text.text += "trans";

                string position = send_trans[0].ToString() + "," + send_trans[1].ToString() + "," + send_trans[2].ToString();
                string rotation = send_trans[3].ToString() + "," + send_trans[4].ToString() + "," + send_trans[5].ToString();
                string scale = send_trans[6].ToString() + "," + send_trans[7].ToString() + "," + send_trans[8].ToString();


                string url = position + "/" + rotation + "/" +  scale;

                StartCoroutine(sendGetPosition(url, key, id));
                isVis = true;
                break;

            }
        }

        bool isImage = false;
        if (!isVis)
        {
            for (int i = 0; i < renderedImages.Count; i++)
            {
                string image_id = renderedImages[i].name;

                if (image_id.Contains(id))
                {

                    float[] send_trans = new float[9];
                    send_trans[0]  = renderedImages[i].transform.position.x;
                    send_trans[1]  = renderedImages[i].transform.position.y;
                    send_trans[2]  = renderedImages[i].transform.position.z;
                    send_trans[3]  = renderedImages[i].transform.rotation.eulerAngles.x;
                    send_trans[4]  = renderedImages[i].transform.rotation.eulerAngles.y;
                    send_trans[5]  = renderedImages[i].transform.rotation.eulerAngles.z;
                    send_trans[6]  = renderedImages[i].transform.localScale.x;
                    send_trans[7]  = renderedImages[i].transform.localScale.y;
                    send_trans[8]  = renderedImages[i].transform.localScale.z;
                    //text.text += "trans";

                    string position = send_trans[0].ToString() + "," + send_trans[1].ToString() + "," + send_trans[2].ToString();
                    string rotation = send_trans[3].ToString() + "," + send_trans[4].ToString() + "," + send_trans[5].ToString();
                    string scale = send_trans[6].ToString() + "," + send_trans[7].ToString() + "," + send_trans[8].ToString();


                    string url = position + "/" + rotation + "/" +  scale;
                    StartCoroutine(sendGetPosition(url, key, id));
                    isImage = true;
                    break;
                }
            }
        }

        bool isVol = false;
        if (!isImage)
        {
            for (int i = 0; i < renderedVolumes.Count; i++)
            {
                //string vol_id = renderedVolumes[i].GetComponent<VolumeRendering>().id;
                string vol_id = renderedVolumes[i].name;

                if (vol_id.Contains(id))
                {

                    float[] send_trans = new float[9];
                    send_trans[0]  = renderedVolumes[i].transform.position.x;
                    send_trans[1]  = renderedVolumes[i].transform.position.y;
                    send_trans[2]  = renderedVolumes[i].transform.position.z;
                    send_trans[3]  = renderedVolumes[i].transform.rotation.eulerAngles.x;
                    send_trans[4]  = renderedVolumes[i].transform.rotation.eulerAngles.y;
                    send_trans[5]  = renderedVolumes[i].transform.rotation.eulerAngles.z;
                    send_trans[6]  = renderedVolumes[i].transform.localScale.x;
                    send_trans[7]  = renderedVolumes[i].transform.localScale.y;
                    send_trans[8]  = renderedVolumes[i].transform.localScale.z;
                    //text.text += "trans";

                    string position = send_trans[0].ToString() + "," + send_trans[1].ToString() + "," + send_trans[2].ToString();
                    string rotation = send_trans[3].ToString() + "," + send_trans[4].ToString() + "," + send_trans[5].ToString();
                    string scale = send_trans[6].ToString() + "," + send_trans[7].ToString() + "," + send_trans[8].ToString();


                    string url = position + "/" + rotation + "/" +  scale;
                    StartCoroutine(sendGetPosition(url, key, id));
                    isVol = true;
                    break;
                }
            }
        }

        if (!isVol)
        {
            for (int i = 0; i < renderedMeshes.Count; i++)
            {
                //string vol_id = renderedVolumes[i].GetComponent<VolumeRendering>().id;
                string vol_id = renderedMeshes[i].name;

                if (vol_id.Contains(id))
                {

                    float[] send_trans = new float[9];
                    send_trans[0]  = renderedMeshes[i].transform.position.x;
                    send_trans[1]  = renderedMeshes[i].transform.position.y;
                    send_trans[2]  = renderedMeshes[i].transform.position.z;
                    send_trans[3]  = renderedMeshes[i].transform.rotation.eulerAngles.x;
                    send_trans[4]  = renderedMeshes[i].transform.rotation.eulerAngles.y;
                    send_trans[5]  = renderedMeshes[i].transform.rotation.eulerAngles.z;
                    send_trans[6]  = renderedMeshes[i].transform.localScale.x;
                    send_trans[7]  = renderedMeshes[i].transform.localScale.y;
                    send_trans[8]  = renderedMeshes[i].transform.localScale.z;
                    //text.text += "trans";

                    string position = send_trans[0].ToString() + "," + send_trans[1].ToString() + "," + send_trans[2].ToString();
                    string rotation = send_trans[3].ToString() + "," + send_trans[4].ToString() + "," + send_trans[5].ToString();
                    string scale = send_trans[6].ToString() + "," + send_trans[7].ToString() + "," + send_trans[8].ToString();


                    string url = position + "/" + rotation + "/" +  scale;
                    StartCoroutine(sendGetPosition(url, key, id));

                    break;
                }
            }
        }

    }

    private IEnumerator sendGetPosition(string transformation, string key, string id)
    {
        string url = "https://vience.io:6040/holoSensor/send/update_get_position/" + id + "/" + key + "/" + transformation;
        UnityWebRequest webRequest = UnityWebRequest.Get(url);
        yield return webRequest.SendWebRequest();

        if (webRequest.result == UnityWebRequest.Result.ConnectionError ||
            webRequest.result == UnityWebRequest.Result.ProtocolError)
        {
            Debug.LogError("Error: " + webRequest.error);


        }
        else
        {
            Debug.LogError("success");
        }
    }

    private void setCurrentTransformation(string id, float[] trans)
    {
        bool isVis = false;
        id = id.Trim(' ');
        var visList = gv.VisList;
        for (int i = 0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            string id_vis = visSpec["id"].ToString();
            if (id_vis.Contains(id))
            {

                bool onlyZero = true;
                for (int k = 0; k<trans.Length; k++)
                {
                    if (trans[k] != 0)
                        onlyZero = false;
                }

                targetVis =  visList[i];

                if (!onlyZero)
                {
                    if (targetVis.getLinkType() == "value")
                        targetVis.unlinkVIS();

                    Vector3 position = new Vector3(trans[0], trans[1], trans[2]);
                    Vector3 scale = new Vector3(trans[6], trans[7], trans[8]);
                    targetVis.transform.position = position;
                    targetVis.transform.rotation = Quaternion.Euler(trans[3], trans[4], trans[5]);
                    targetVis.transform.localScale = scale;

                }
                else
                {

                    Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

                    Vector3 scale = new Vector3(1, 1, 1);
                    targetVis.transform.position = pos;
                    targetVis.transform.rotation = Quaternion.Euler(0, 0, 0);
                    targetVis.transform.localScale = scale;

                }

                isVis = true;
                break;
            }
        }

        bool isImage = false;
        if (!isVis)
        {
            for (int i = 0; i < renderedImages.Count; i++)
            {
                string image_id = renderedImages[i].name;

                if (image_id.Contains(id))
                {
                    bool onlyZero = true;
                    for (int k = 0; k<trans.Length; k++)
                    {
                        if (trans[k] != 0)
                            onlyZero = false;
                    }

                    if (!onlyZero)
                    {
                        Vector3 position = new Vector3(trans[0], trans[1], trans[2]);
                        Vector3 scale = new Vector3(trans[6], trans[7], trans[8]);
                        renderedImages[i].transform.position = position;
                        renderedImages[i].transform.rotation = Quaternion.Euler(trans[3], trans[4], trans[5]);
                        renderedImages[i].transform.localScale = scale;
                    }
                    else
                    {

                        Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

                        Vector3 scale = new Vector3(1, 1, 1);
                        renderedImages[i].transform.position = pos;
                        renderedImages[i].transform.rotation = Quaternion.Euler(0, 0, 0);
                        renderedImages[i].transform.localScale = scale;

                    }
                    isImage = false;
                    break;
                }
            }
        }

        bool isVol = false;
        if (!isImage)
        {
            for (int i = 0; i < renderedVolumes.Count; i++)
            {
                string vol_id = renderedVolumes[i].name;

                if (vol_id.Contains(id))
                {
                    bool onlyZero = true;
                    for (int k = 0; k<trans.Length; k++)
                    {
                        if (trans[k] != 0)
                            onlyZero = false;
                    }

                    if (!onlyZero)
                    {
                        Vector3 position = new Vector3(trans[0], trans[1], trans[2]);
                        Vector3 scale = new Vector3(trans[6], trans[7], trans[8]);
                        renderedVolumes[i].transform.position = position;
                        renderedVolumes[i].transform.rotation = Quaternion.Euler(trans[3], trans[4], trans[5]);
                        renderedVolumes[i].transform.localScale = scale;
                    }
                    else
                    {

                        Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

                        Vector3 scale = new Vector3(1, 1, 1);
                        renderedVolumes[i].transform.position = pos;
                        renderedVolumes[i].transform.rotation = Quaternion.Euler(0, 0, 0);
                        renderedVolumes[i].transform.localScale = scale;

                    }
                    isVol = true;
                    break;
                }
            }
        }


        if (!isVol)
        {
            for (int i = 0; i < renderedMeshes.Count; i++)
            {
                string vol_id = renderedMeshes[i].name;

                if (vol_id.Contains(id))
                {
                    bool onlyZero = true;
                    for (int k = 0; k<trans.Length; k++)
                    {
                        if (trans[k] != 0)
                            onlyZero = false;
                    }

                    if (!onlyZero)
                    {
                        Vector3 position = new Vector3(trans[0], trans[1], trans[2]);
                        Vector3 scale = new Vector3(trans[6], trans[7], trans[8]);
                        renderedMeshes[i].transform.position = position;
                        renderedMeshes[i].transform.rotation = Quaternion.Euler(trans[3], trans[4], trans[5]);
                        renderedMeshes[i].transform.localScale = scale;
                    }
                    else
                    {

                        Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

                        Vector3 scale = new Vector3(1, 1, 1);
                        renderedMeshes[i].transform.position = pos;
                        renderedMeshes[i].transform.rotation = Quaternion.Euler(0, 0, 0);
                        renderedMeshes[i].transform.localScale = scale;

                    }
                    break;
                }
            }
        }


    }


    public Texture3D volumeToTexture3D(float[] floatArray, int width, int height, int depth)
    {
        var max = width * height * depth;
        var tex = new Texture3D(width, height, depth, TextureFormat.ARGB32, false);
        tex.wrapMode = TextureWrapMode.Clamp;
        tex.filterMode = FilterMode.Bilinear;
        tex.anisoLevel = 0;

        int i = 0;
        Color[] colors = new Color[max];

        for (i = 0; i < max; i++)
        {
            var f = floatArray[i];
            colors[i] = new Color(f, f, f, f);
        }
        tex.SetPixels(colors);
        tex.Apply();

        return tex;

    }

    ushort FindMinValue(ushort[] array)
    {
        ushort min = ushort.MaxValue;
        foreach (ushort value in array)
        {
            if (value < min)
                min = value;
        }
        return min;
    }

    ushort FindMaxValue(ushort[] array)
    {
        ushort max = ushort.MinValue;
        foreach (ushort value in array)
        {
            if (value > max)
                max = value;
        }
        return max;
    }

    float[] NormalizeUShortArray(ushort[] ushortArray, ushort min, ushort max)
    {
        float[] normalizedArray = new float[ushortArray.Length];
        for (int i = 0; i < ushortArray.Length; i++)
        {
            float normalizedValue = (float)(ushortArray[i] - min) / (float)(max - min);
            normalizedArray[i] = normalizedValue;
        }
        return normalizedArray;
    }
}
