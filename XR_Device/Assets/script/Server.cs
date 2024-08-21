using System.Collections.Generic;
using UnityEngine;
using System;
using System.IO;
using SimpleJSON;
using DxR;


#if WINDOWS_UWP
using Windows.Networking.Sockets;
using Windows.Storage.Streams;
#endif


public class Server : MonoBehaviour
{

    public bool startSaving = false;


    private void Awake()
    {
        ConncetionStatus.material.color = Color.red;
    }

    private void OnApplicationFocus(bool focus)
    {
        if (!focus)
        {
#if WINDOWS_UWP
            StopConnection();
#endif

        }
    }

    [SerializeField]
    string hostIPAddress, port;

    public Renderer ConncetionStatus;
    public UnityEngine.UI.Text text;
    Camera cam;
    PointCloud pc;
    GenerateVis gv;
    CameraStream cs;
    public Vis targetVis = null;

    JSONNode serverVisSpec = null;
    private bool connected = false;
    string request;
    float[] pointcloud;
    float[] cur_transformation;
    string header;
    string trans_id;

    public int sensor = -1;
    bool lastMessageRecv = false;
    bool lastMessageSent = true;
    bool lastdataRecv = false;
    bool lastSpecRecv = false;
    bool send_initial = false;
    bool get_cur_pos = false;
    bool set_cur_pos = false;
    bool delete = false;

    public bool Connected
    {
        get { return connected; }
    }

#if WINDOWS_UWP
    StreamSocket client_socket;
    StreamSocketListener server_socket; 
    public DataWriter dw;
    public DataReader dr;

    StreamReader streamReader;
    StreamWriter streamWriter;
#endif

    void Start()
    {
        pc = GetComponent<PointCloud>();
        gv = GetComponent<GenerateVis>();
        cs = GetComponent<CameraStream>();

        cam = Camera.main;
#if WINDOWS_UWP

        server_socket = new StreamSocketListener();
        //HostName serverHost = new HostName(hostIPAddress);
        server_socket.ConnectionReceived += OnConnection;
        server_socket.Control.KeepAlive = false;

#endif
    }
    void Update()
    {
        if (lastMessageRecv)
        {
            text.text += "start recv";
            checkRequest(request);
            lastMessageRecv = false;
        }
        if (lastdataRecv)
        {
            text.text += "start point cloud recv";
            makePointCloud(pointcloud);
            lastdataRecv = false;
        }
        if (lastSpecRecv)
        {
            lastSpecRecv = false;
            text.text += "start visspec recv\n";
            checkVisSpecs(request, cur_transformation);
        }
        if (set_cur_pos)
        {
            text.text += "set cur pos\n";
            setCurrentTransformation(trans_id, cur_transformation);
            set_cur_pos = false;
        }
        if (get_cur_pos)
        {
            get_cur_pos = false;
            text.text = "get cur pos\n";
            getCurrentTransformation(trans_id);
        }
        if (delete)
        {
            text.text = "delete\n";
            deleteVis(trans_id);
            delete = false;
        }
        if (send_initial)
        {
            sendInitialTransform(trans_id);
            send_initial = false;
        }
    }

#if WINDOWS_UWP

    private async void StartConnection() {

        if (server_socket == null)
        {
            server_socket = new StreamSocketListener();
            //HostName serverHost = new HostName(hostIPAddress);
            server_socket.ConnectionReceived += OnConnection;
            server_socket.Control.KeepAlive = false;
        }

        try { 
            await server_socket.BindServiceNameAsync("7070");

            connected = true;
            ConncetionStatus.material.color = Color.green;
            text.text += "starting connection!\n";

        }
        catch (Exception e)
        {
            text.text += "error";
            connected = false;
            server_socket = null;

            //SocketErrorStatus webErrorStatus = SocketError.GetStatus(ex.GetBaseException().HResult);
            //Debug.Log(webErrorStatus.ToString() != "Unknown" ? webErrorStatus.ToString() : ex.Message);
        }

    }

    private async void OnConnection(StreamSocketListener sender, StreamSocketListenerConnectionReceivedEventArgs args)
    {      
        
        //streamReader = new StreamReader(args.Socket.InputStream.AsStreamForRead());

        //Stream outputStream = args.Socket.OutputStream.AsStreamForWrite();
        //streamWriter = new StreamWriter(outputStream);
        
        //client_socket = args.Socket;
        dw = new DataWriter(args.Socket.OutputStream);
        dr = new DataReader(args.Socket.InputStream);
        
        {
            try
            {
                while (true)
                {



                    await dr.LoadAsync(1);
                    header = dr.ReadString(1);


                    if (header.Equals("m"))
                    {
                        await dr.LoadAsync(sizeof(uint));
                        
                        uint stringLength = dr.ReadUInt32();
                        await dr.LoadAsync(stringLength);
                     
                        request = dr.ReadString(stringLength);


                        
                        lastMessageRecv = true;
                        //checkRequest(request);
                        //dw.WriteString(request);
                        //await dw.StoreAsync();
                        //await dw.FlushAsync();
                    }
                    if (header.Equals("n"))
                    {
                        await dr.LoadAsync(sizeof(uint));

                        uint stringLength = dr.ReadUInt32();
                        await dr.LoadAsync(stringLength);

                        trans_id = dr.ReadString(stringLength);



                        delete = true;
                        //checkRequest(request);
                        //dw.WriteString(request);
                        //await dw.StoreAsync();
                        //await dw.FlushAsync();
                    }
                    if (header.Equals("p"))
                    {
                        await dr.LoadAsync(sizeof(uint));
                        uint idLength = dr.ReadUInt32();

                        await dr.LoadAsync(idLength);
                        trans_id = dr.ReadString(idLength);

                        await dr.LoadAsync(sizeof(uint));
                        uint transLength = dr.ReadUInt32();
                        uint zero = 0;

                        if (transLength == zero)
                        {
                            get_cur_pos = true;
                        }
                        else
                        {
                            await dr.LoadAsync(transLength * 4);
                            var bytearray = new byte[transLength * 4];
                            dr.ReadBytes(bytearray);
                            cur_transformation = BytesToFloat(bytearray);

                            set_cur_pos = true;
                        }

                        //checkRequest(request);
                        //dw.WriteString(request);
                        //await dw.StoreAsync();
                        //await dw.FlushAsync();
                    }
                    if (header.Equals("t"))
                    {
                        await dr.LoadAsync(sizeof(uint));
                        uint idLength = dr.ReadUInt32();

                        await dr.LoadAsync(idLength);
                        trans_id = dr.ReadString(idLength);

                        send_initial = true;


                    }
                    else if (header.Equals("d"))
                    {
                        await dr.LoadAsync(sizeof(uint));
                        
                        uint dataLength = dr.ReadUInt32();

                        await dr.LoadAsync(dataLength * 4);
                        var bytearray = new byte[dataLength * 4];
                        dr.ReadBytes(bytearray);
                        pointcloud = BytesToFloat(bytearray);
                        
                        lastdataRecv = true;
                        //makePointCloud(pointcloud, dataLength);
                        //dw.WriteString(request);
                        //await dw.StoreAsync();
                        //await dw.FlushAsync();
                    }
                    else if (header.Equals("v"))
                    {
                        await dr.LoadAsync(sizeof(uint));
                        uint jsonLength = dr.ReadUInt32();
                        await dr.LoadAsync(jsonLength);
                        request = dr.ReadString(jsonLength);

                        await dr.LoadAsync(sizeof(uint));
                        uint transLength = dr.ReadUInt32();

                        await dr.LoadAsync(transLength * 4);
                        var bytearray = new byte[transLength * 4];
                        dr.ReadBytes(bytearray);
                        cur_transformation = BytesToFloat(bytearray);


                        
                        lastSpecRecv = true;

                    }


                    //await streamWriter.WriteLineAsync("well received");
                    //await streamWriter.FlushAsync();


                }
            }
            catch {
                args.Socket.Dispose();
            }
        }

    }

    private async void Send()
    {
        //await streamWriter.WriteLineAsync("HI i am something");
        //await streamWriter.FlushAsync();
        dw.WriteString("Hi i am something");
        await dw.StoreAsync();
        await dw.FlushAsync();
    }

    private async void SendTransformation(float[] trans)
    {
        dw.WriteString("p");

        dw.WriteBytes(FloatToBytes(trans));
        await dw.StoreAsync();
        await dw.FlushAsync();
    }

    public async void SendDepthAsync(ushort[] data1, float[] depthToWorld, float[] LFToWorld, float[] RFToWorld, ushort[] AbImage, byte[] LRFrame)
    {

        if (!lastMessageSent) return;
        lastMessageSent = false;
        try
        {

            if (data1 != null && depthToWorld != null && LFToWorld != null && RFToWorld != null && AbImage != null && LRFrame != null)
            {

                dw.WriteString("s");
                // Write Length
                dw.WriteInt32(data1.Length); // N *  2
                dw.WriteInt32(LRFrame.Length); // N * 2
                //dw.WriteInt32(points.Length); // N * 2


                //text.text += data1.Length.ToString() + "/" + AbImage.Length.ToString() + "/" + LRFrame.Length.ToString();

                // Write actual data
                dw.WriteBytes(UINT16ToBytes(data1));
                dw.WriteBytes(UINT16ToBytes(AbImage));

                //dw.WriteInt64(ts_left);
                //dw.WriteInt64(ts_right);

                dw.WriteBytes(FloatToBytes(depthToWorld));
                dw.WriteBytes(FloatToBytes(LFToWorld));
                dw.WriteBytes(FloatToBytes(RFToWorld));

                dw.WriteBytes(LRFrame);

                //dw.WriteBytes(FloatToBytes(points));

            }




            await dw.StoreAsync();
            await dw.FlushAsync();


        }
        catch (Exception ex)
        {
            SocketErrorStatus webErrorStatus = SocketError.GetStatus(ex.GetBaseException().HResult);
            Debug.Log(webErrorStatus.ToString() != "Unknown" ? webErrorStatus.ToString() : ex.Message);
        }
        lastMessageSent = true;
    }

    public async void SendByteArray(byte[] data1)
    {

        if (!lastMessageSent) return;
        lastMessageSent = false;
        try
        {

            if (data1 != null)
            {
                text.text += "\n something to send";
                dw.WriteString("r");

                dw.WriteInt32(data1.Length); 
                dw.WriteBytes(data1);

            }

            await dw.StoreAsync();
            await dw.FlushAsync();

        }
        catch (Exception ex)
        {
            SocketErrorStatus webErrorStatus = SocketError.GetStatus(ex.GetBaseException().HResult);
            Debug.Log(webErrorStatus.ToString() != "Unknown" ? webErrorStatus.ToString() : ex.Message);
        }
        lastMessageSent = true;
    }


    public async void SendLongDepthAsync(ushort[] data1)
    {

        if (!lastMessageSent) return;
        lastMessageSent = false;
        try
        {

            if (data1 != null)
            {

                dw.WriteString("f");
                // Write Length
                dw.WriteInt32(data1.Length); // N * 2

                // Write actual data
                dw.WriteBytes(UINT16ToBytes(data1));

                await dw.StoreAsync();
                await dw.FlushAsync();

            }

        }
        catch (Exception ex)
        {
            SocketErrorStatus webErrorStatus = SocketError.GetStatus(ex.GetBaseException().HResult);
            Debug.Log(webErrorStatus.ToString() != "Unknown" ? webErrorStatus.ToString() : ex.Message);
        }
        lastMessageSent = true;
    }

    public async void SendUINT16Async(ushort[] data1, float[] data2, float[] data3)
    {
        if (!lastMessageSent) return;
        lastMessageSent = false;
        try
        {

            // Write header
            //dw.WriteString("s"); // header "s" stands for it is ushort array (uint16)


            if (data1 != null && data2 != null && data3 != null)
            {
                dw.WriteString("s");
                // Write Length
                dw.WriteInt32(data1.Length); // N

                // Write actual data
                dw.WriteBytes(UINT16ToBytes(data1));

                dw.WriteBytes(FloatToBytes(data2));
                dw.WriteBytes(FloatToBytes(data3));

            }

            // Send out
            await dw.StoreAsync();
            await dw.FlushAsync();


        }
        catch (Exception ex)
        {
            SocketErrorStatus webErrorStatus = SocketError.GetStatus(ex.GetBaseException().HResult);
            Debug.Log(webErrorStatus.ToString() != "Unknown" ? webErrorStatus.ToString() : ex.Message);
        }
        lastMessageSent = true;
    }

    public async void SendUINT8Async(byte[] data1)
    {
        if (!lastMessageSent) return;
        lastMessageSent = false;
        try
        {

            // Write header
            //dw.WriteString("s"); // header "s" stands for it is ushort array (uint16)


            if (data1 != null)
            {
                dw.WriteString("b");
                // Write Length
                dw.WriteInt32(data1.Length); // N

                // Write actual data
                dw.WriteBytes(data1);

            }

            // Send out
            await dw.StoreAsync();
            await dw.FlushAsync();


        }
        catch (Exception ex)
        {
            SocketErrorStatus webErrorStatus = SocketError.GetStatus(ex.GetBaseException().HResult);
            Debug.Log(webErrorStatus.ToString() != "Unknown" ? webErrorStatus.ToString() : ex.Message);
        }
        lastMessageSent = true;
    }

    public async void SendSpatialImageAsync(byte[] LFImage, byte[] RFImage, long ts_left, long ts_right)
    {
        if (!lastMessageSent) return;
        lastMessageSent = false;
        try
        {

            // Write header
            dw.WriteString("f"); // header "f"

            // Write Length
            dw.WriteInt32(LFImage.Length + RFImage.Length);
            dw.WriteInt64(ts_left);
            dw.WriteInt64(ts_right);

            // Write actual data
            dw.WriteBytes(LFImage);
            dw.WriteBytes(RFImage);

            // Send out
            await dw.StoreAsync();
            await dw.FlushAsync();
        }
        catch (Exception ex)
        {
            SocketErrorStatus webErrorStatus = SocketError.GetStatus(ex.GetBaseException().HResult);
            Debug.Log(webErrorStatus.ToString() != "Unknown" ? webErrorStatus.ToString() : ex.Message);
        }
        lastMessageSent = true;
    }


    public async void SendSpatialImageAsync(byte[] LRFImage, long ts_left, long ts_right)
    {
        if (!lastMessageSent) return;
        lastMessageSent = false;
        try
        {
            // Write header
            dw.WriteString("f"); // header "f"

            // Write Timestamp and Length
            dw.WriteInt32(LRFImage.Length);
            dw.WriteInt64(ts_left);
            dw.WriteInt64(ts_right);

            // Write actual data
            dw.WriteBytes(LRFImage);

            // Send out
            await dw.StoreAsync();
            await dw.FlushAsync();

        }
        catch (Exception ex)
        {
            SocketErrorStatus webErrorStatus = SocketError.GetStatus(ex.GetBaseException().HResult);
            Debug.Log(webErrorStatus.ToString() != "Unknown" ? webErrorStatus.ToString() : ex.Message);
        }
        lastMessageSent = true;
    }




    private async void StopConnection()
    {
        dw.WriteString("e");
        dw.WriteInt32(6);
        dw.WriteString("exit_0");
        await dw.StoreAsync();
        await dw.FlushAsync();

        client_socket?.Dispose();
        connected = false;
        server_socket.ConnectionReceived -= OnConnection;
        server_socket?.Dispose();
        server_socket = null;
        ConncetionStatus.material.color = Color.red;

    }

#endif

    private void checkRequest(string request)
    {

        
        if (request == null)
        {
            text.text += "request is null";

        }
        request = request.TrimEnd('\r', '\n', ' ');
        string[] reqs = request.Split(',');

        foreach (var req in reqs)
        {
            if (req.Equals("exit_0"))
            {
                text.text += "end";
#if WINDOWS_UWP
                StopConnection();
#endif

            }
            if (req.Equals("capture_0"))
            {
                startSaving = true;
                text.text +="capture0\n";
            }
            if (req.Equals("capture_1"))
            {
                startSaving = false;
                cs.StopInterval(sensor);
            }
            if (req.Equals("sensor_0"))
            {
                sensor = 0;
                text.text +="Sensor: Depth\n";
                //cs.ChangeSensor(sensor);
                cs.SetSensor(sensor);
            }
            if (req.Equals("sensor_1"))
            {
                sensor = 1;
                text.text += "Sensor: RGB\n";
                //cs.ChangeSensor(sensor);
                //cs.SetSensor(sensor);
#if WINDOWS_UWP
                //await cs.InitializeMediaCaptureAsync();
#endif

            }
            if (req.Equals("gesture_0"))
            {
                text.text += "Gesture: Button\n";
            }
            if (req.Equals("gesture_1"))
            {
                text.text += "Gesture: Airtap\n";
            }
            if (req.Equals("gesture_2"))
            {
                cs.StartInterval(sensor, 1.0f);
                text.text += "Gesture: Interval 1.0f\n";
            }
            if (req.Equals("gesture_3"))
            {
                cs.StartInterval(sensor, 3.0f);
                text.text += "Gesture: Interval 3.0f\n";
            }
            if (req.Equals("gesture_4"))
            {
                cs.StartInterval(sensor, 5.0f);
                text.text += "Gesture: Interval 5.0f\n";
            }
        }

    }

    private void setCurrentTransformation(string id, float[] trans)
    {
        var visList = gv.VisList;
        for (int i = 0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            if (visSpec["id"] == id)
            {

                bool onlyZero = true;
                for (int k =0; k<trans.Length; k++)
                {
                    if(trans[k] != 0)
                        onlyZero = false;
                }

                text.text += "setCurrTrans \n";
                targetVis =  visList[i];

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

                    Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

                    Vector3 scale = new Vector3(1, 1, 1);
                    targetVis.transform.position = pos;
                    targetVis.transform.rotation = Quaternion.Euler(0, 0, 0);
                    targetVis.transform.localScale = scale;

                }
                
            }
        }
    }

    private void getCurrentTransformation(string id)
    {
        text.text = "getCurrTrans\n";

        var visList = gv.VisList;
        for (int i = 0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            if (visSpec["id"] == id)
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


#if WINDOWS_UWP
                SendTransformation(send_trans);
#endif
            }
        }
    }

    private void sendInitialTransform(string trans_id)
    {
        var visList = gv.VisList;
        for (int i = 0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            if (visSpec["id"] == trans_id)
            {

                targetVis =  visList[i];
                var curr_trans = targetVis.transform;


                Matrix4x4 init = targetVis.initialTransform;
                Matrix4x4 curr = new Matrix4x4();
                curr.SetTRS(curr_trans.position, curr_trans.rotation, curr_trans.localScale);
                Matrix4x4 inv_init = new Matrix4x4();

                Matrix4x4.Inverse3DAffine(init, ref inv_init);
                Matrix4x4 res = curr * inv_init;

                SendInverseMatrix(res);
            }
        }
    }

    private void deleteVis(string trans_id)
    {
        var visList = gv.VisList;
        for (int i = 0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            if (visSpec["id"] == trans_id )
            {

                text.text = "delete vis \n";
                targetVis =  visList[i];

                targetVis.DeleteAll();
                //Destroy(targetVis.worldView.gameObject);
                Destroy(targetVis.parentObject);

                gv.VisList.RemoveAt(i);
                break;
            }
        }
    }

    public void deleteOneVis()
    {
        string trans_id = "1";
        var visList = gv.VisList;
        for (int i = 0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            if (visSpec["id"] == trans_id)
            {

                text.text = "delete vis \n";
                targetVis =  visList[i];

                targetVis.DeleteAll();
                //Destroy(targetVis.worldView.gameObject);
                Destroy(targetVis.parentObject);

                gv.VisList.RemoveAt(i);
                break;
            }
        }
    }

    private void checkVisSpecs(string request, float[] trans)
    {
        serverVisSpec = JSON.Parse(request);
        var visList = gv.VisList;
        bool match = false;
        for(int i=0; i < visList.Count; i++)
        {
            var visSpec = visList[i].GetVisSpecs();
            if (visSpec["id"] == serverVisSpec["id"])
            {
                text.text += "id matched!! \n";
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
                        //axisÀÇ roation Á¤º¸
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

    private void makePointCloud(float[] data)
    {
        text.text += "point cloud";


        if (data == null)
        {
            text.text += "data is null";
        }

        List<Vector3> points = new List<Vector3>();

        for (int i=0; i<data.Length/3; i++)
        {
            points.Add(new Vector3(data[i*3], data[i*3 +1], data[i*3 +2]));
        }

        pc.generatePointCloud(points);

    }

    byte[] UINT16ToBytes(ushort[] data)
    {
        byte[] ushortInBytes = new byte[data.Length * sizeof(ushort)];
        System.Buffer.BlockCopy(data, 0, ushortInBytes, 0, ushortInBytes.Length);
        return ushortInBytes;
    }

    byte[] FloatToBytes(float[] data)
    {
        byte[] floatInBytes = new byte[data.Length * sizeof(float)];
        System.Buffer.BlockCopy(data, 0, floatInBytes, 0, floatInBytes.Length);
        return floatInBytes;
    }

    float[] BytesToFloat(byte[] data)
    {
        //text.text = data.ToString();
        float[] BytesInFloat = new float[data.Length / sizeof(float)];
        System.Buffer.BlockCopy(data, 0, BytesInFloat, 0, BytesInFloat.Length * sizeof(float));
        return BytesInFloat;
    }

    public JSONNode GetServerVisSpecs()
    {
        return serverVisSpec;
    }


    public void OpenServerEvent()
    {
#if WINDOWS_UWP
        if (!connected) StartConnection();
        else StopConnection();
#endif
    }

    public void SendAnything()
    {
#if WINDOWS_UWP
        if (dw != null)
        {
            text.text = text.text + "send";
            Send();
        }
        else {
            text.text = text.text + "no socket";
        }
#endif
    }
    
    public async void SendInverseMatrix(Matrix4x4 res)
    {
#if WINDOWS_UWP

        dw.WriteString("t");

        float[] send_mat = new float[16];
        for(int i = 0; i < 4; i++)
        {
            for(int j = 0; j < 4; j++)
                send_mat[i*4 + j] = res[i,j];
        }


        dw.WriteBytes(FloatToBytes(send_mat));
        await dw.StoreAsync();
        await dw.FlushAsync();
#endif

    }
}
