using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Windows.WebCam;
using System;
using System.Threading.Tasks;
using System.Runtime.InteropServices.WindowsRuntime;

#if WINDOWS_UWP
using Windows.Media.Capture;
using Windows.Media.MediaProperties;
using Windows.Storage.Streams;
using Windows.Graphics.Imaging;
#endif



#if ENABLE_WINMD_SUPPORT
using HL2UnityPlugin;
using Microsoft.MixedReality.OpenXR;
#endif



public class CameraStream : MonoBehaviour
{

#if ENABLE_WINMD_SUPPORT
    HL2ResearchMode researchMode;
#endif

    public UnityEngine.UI.Text text;
    private bool saveAbImage = true;
    private bool saveLRFrame = true;
#if WINDOWS_UWP
    private MediaCapture _mediaCapture = null;
#endif 
    //private MediaFrameReader _reader = null;

    private const int IMAGE_ROWS = 480;
    private const int IMAGE_COLS = 640;



#if ENABLE_WINMD_SUPPORT
    Windows.Perception.Spatial.SpatialCoordinateSystem unityWorldOrigin;
#endif


    enum DepthSensorMode
    {
        ShortThrow,
        LongThrow,
        None
    };

    [SerializeField] DepthSensorMode depthSensorMode = DepthSensorMode.None;

    Client server;

    private void Awake()
    {
#if ENABLE_WINMD_SUPPORT
        //IntPtr WorldOriginPtr = UnityEngine.XR.WindowsMR.WindowsMREnvironment.OriginSpatialCoordinateSystem;
        //unityWorldOrigin = Marshal.GetObjectForIUnknown(WorldOriginPtr) as Windows.Perception.Spatial.SpatialCoordinateSystem;
        unityWorldOrigin = PerceptionInterop.GetSceneCoordinateSystem(UnityEngine.Pose.identity) as Windows.Perception.Spatial.SpatialCoordinateSystem;
#endif
        //ÀÌ°Ô ±¦Âú³ª?
    }


    void Start()
    {
        server = GetComponent<Client>();
#if ENABLE_WINMD_SUPPORT
        researchMode = new HL2ResearchMode();
#endif

        /*
#if ENABLE_WINMD_SUPPORT

        researchMode = new HL2ResearchMode();
        if (depthSensorMode == DepthSensorMode.LongThrow) researchMode.InitializeLongDepthSensor();
        else if (depthSensorMode == DepthSensorMode.ShortThrow) researchMode.InitializeDepthSensor();

        researchMode.InitializeSpatialCamerasFront();
        researchMode.SetReferenceCoordinateSystem(unityWorldOrigin);
        researchMode.SetPointCloudDepthOffset(0);

        if (depthSensorMode == DepthSensorMode.LongThrow) researchMode.StartLongDepthSensorLoop(false);
        else if (depthSensorMode == DepthSensorMode.ShortThrow) researchMode.StartDepthSensorLoop(false);

        researchMode.StartSpatialCamerasFrontLoop();

        text.text += depthSensorMode.ToString();


#endif 
        */
        //SetSensor(0);
    }


    public void SetSensor(int sensor)
    {
#if ENABLE_WINMD_SUPPORT

        if (sensor == 0)
        {
            depthSensorMode = DepthSensorMode.ShortThrow;
        }
        else if (sensor == -2)
        {
            depthSensorMode = DepthSensorMode.LongThrow;
        }


        if (depthSensorMode == DepthSensorMode.LongThrow) researchMode.InitializeLongDepthSensor();
        else if (depthSensorMode == DepthSensorMode.ShortThrow) researchMode.InitializeDepthSensor();


        researchMode.InitializeSpatialCamerasFront();
        researchMode.SetReferenceCoordinateSystem(unityWorldOrigin);
        researchMode.SetPointCloudDepthOffset(0);


        //researchMode.SetPointCloudRoiInSpace(0, 0, 0, 10000, 10000, 10000);


        if (depthSensorMode == DepthSensorMode.LongThrow) researchMode.StartLongDepthSensorLoop(true);
        else if (depthSensorMode == DepthSensorMode.ShortThrow) researchMode.StartDepthSensorLoop(true);

        researchMode.StartSpatialCamerasFrontLoop();

#endif
    }

#if WINDOWS_UWP

    public async Task InitializeMediaCaptureAsync()
    {
        //var cameraDevice = await FindCameraDeviceByPanelAsync(Windows.Devices.Enumeration.Panel.Back);

        //if (cameraDevice == null)
        //{
        //    text.text += "No camera device found!";
        //    return;
        //}
        //text.text += "initialize media capture \n";


        if (_mediaCapture != null)
        {
            return;
        }


        _mediaCapture = new MediaCapture();
        // ¿ì¼± ¼¼ÆÃ ´Ù½Ã ¹Ù²Ü¼öµµ
        /*
        var settings = new MediaCaptureInitializationSettings()
        {
            SourceGroup = sourceGroup,
            SharingMode = MediaCaptureSharingMode.ExclusiveControl,
            StreamingCaptureMode = StreamingCaptureMode.Video,
            MemoryPreference = MediaCaptureMemoryPreference.Cpu
        };*/
        //var settings = new MediaCaptureInitializationSettings { VideoDeviceId = cameraDevice.Id };

        await _mediaCapture.InitializeAsync();
        _mediaCapture.Failed += MediaCapture_Failed;

    }

    private void MediaCapture_Failed(MediaCapture sender, MediaCaptureFailedEventArgs errorEventArgs)
    {
        //text.text += "MediaCapture_Failed!";
    }

    public async Task TakePhotoAsync ()
    {
        //text.text += "inside take photo async\n";
        var lowLagCapture = await _mediaCapture.PrepareLowLagPhotoCaptureAsync(ImageEncodingProperties.CreateUncompressed(MediaPixelFormat.Bgra8));

        var capturedPhoto = await lowLagCapture.CaptureAsync();
        var softwareBitmap = capturedPhoto.Frame.SoftwareBitmap;

        var key = Guid.NewGuid();
        byte[] bytePhoto = await EncodedBytes(softwareBitmap, key);
        //.text += "after encode bytes take photo async\n";

        server.SendUINT8Async(bytePhoto);

        //await lowLagCapture.FinishAsync();

    }

    private async Task<byte[]> EncodedBytes(SoftwareBitmap soft, Guid encoderId)
    {
        byte[] array = null;

        // First: Use an encoder to copy from SoftwareBitmap to an in-mem stream (FlushAsync)
        // Next:  Use ReadAsync on the in-mem stream to get byte[] array

        using (var ms = new InMemoryRandomAccessStream())
        {
            BitmapEncoder encoder = await BitmapEncoder.CreateAsync(encoderId, ms);
            encoder.SetSoftwareBitmap(soft);

            try
            {
                await encoder.FlushAsync();
            }
            catch (Exception ex) { return new byte[0]; }

            array = new byte[ms.Size];
            await ms.ReadAsync(array.AsBuffer(), (uint)ms.Size, InputStreamOptions.None);
        }
        return array;
    }
#endif 

    public void ChangeSensor(int sensor)
    {
#if ENABLE_WINMD_SUPPORT

        if ((sensor == 0 && depthSensorMode == DepthSensorMode.ShortThrow) || (sensor == 1 && depthSensorMode == DepthSensorMode.LongThrow))
            return;

        //if (depthSensorMode != DepthSensorMode.None)
            //StopSensorsEvent();

        if (sensor == 0 && depthSensorMode != DepthSensorMode.ShortThrow)
        {
            researchMode = new HL2ResearchMode();
            researchMode.InitializeDepthSensor();
            researchMode.StartDepthSensorLoop(false);
            depthSensorMode = DepthSensorMode.ShortThrow;
        }
        if (sensor == 1 && depthSensorMode != DepthSensorMode.LongThrow)
        {
            researchMode = new HL2ResearchMode();

            researchMode.InitializeLongDepthSensor();
            researchMode.StartLongDepthSensorLoop(false);
            depthSensorMode = DepthSensorMode.LongThrow;

        }
#endif

    }

    public void StopSensorsEvent()
    {
#if ENABLE_WINMD_SUPPORT
        researchMode.StopAllSensorDevice();
#endif
        depthSensorMode = DepthSensorMode.None;
    }

    public void SaveDepthMapEvent()
    {
        //text.text = "Send Depth Map \n";

        if (server.startSaving == false) {
            //text.text += "false \n";
        }

#if ENABLE_WINMD_SUPPORT
#if WINDOWS_UWP
        if (server.startSaving == true)
        {
            researchMode.SetPointCloudRoiInSpace(0, 0, 0, 10000, 10000, 10000);

            var depthMap = researchMode.GetDepthMapBuffer();
            //var depthToWorld = researchMode.GetDepthToWorldMatrix();

            if (depthMap == null)
            {
                //text.text += "No depth map";
            }

            //Camera cam = Camera.main;
            //Matrix4x4 cameraProjection = cam.projectionMatrix;
            //Matrix4x4 worldToCamera = cam.worldToCameraMatrix;

            float[] depthToWorld = researchMode.GetDepthToWorld();
            float[] LFToWorld = researchMode.GetLFToWorld();
            float[] RFToWorld = researchMode.GetRFToWorld();

            //float[] mapUnit = researchMode.GetMapUnitPlane();


            //text.text += "dTW" + depthToWorld.ToString() + "\n";
            //text.text += "mp" + mapUnit.ToString() + "\n";


            var abImage = researchMode.GetShortAbImageBuffer();

            long ts_ft_left, ts_ft_right;
            var LRFImage = researchMode.GetLRFCameraBuffer(out ts_ft_left, out ts_ft_right);
            if (LRFImage == null)
            {
                //text.text += "No VLC";
            }

            //Windows.Perception.PerceptionTimestamp ts_left = Windows.Perception.PerceptionTimestampHelper.FromHistoricalTargetTime(DateTime.FromFileTime(ts_ft_left));
            //Windows.Perception.PerceptionTimestamp ts_right = Windows.Perception.PerceptionTimestampHelper.FromHistoricalTargetTime(DateTime.FromFileTime(ts_ft_right));

            //long ts_unix_left = ts_left.TargetTime.ToUnixTimeMilliseconds();
            //long ts_unix_right = ts_right.TargetTime.ToUnixTimeMilliseconds();
            //long ts_unix_current = GetCurrentTimestampUnix();


            //float[] depthPC = researchMode.GetPointCloudBuffer();


            if (server != null)
            {
                server.SendDepthAsync(depthMap, depthToWorld, LFToWorld, RFToWorld, abImage, LRFImage);
            }

        }
#endif
#endif
    }


    public void SaveSpatialImageEvent()
    {
#if ENABLE_WINMD_SUPPORT
#if WINDOWS_UWP
        var longDepthMap = researchMode.GetLongDepthMapBuffer();

        if (longDepthMap == null)
        {
            //text.text += "No long depth map";
        }

        if (server != null)
        {
            server.SendLongDepthAsync(longDepthMap);
        }

#endif
#endif
    }

    public void SaveSensorData()
    {
        //text.text += "button click\n";
        if (server.sensor == 0)
        {
            SaveDepthMapEvent();

        }
    }


    public void StartInterval(int sensor, float intervalTime)
    {
        //text.text += sensor.ToString() + "/" + intervalTime.ToString() + "/" +  Time.timeScale.ToString() + "/\n";

        if (sensor == 0)
        {
            InvokeRepeating("SaveDepthMapEvent", 0.0f, intervalTime);
        }

        if (sensor == 1)
        {
            InvokeRepeating("TakePhotoAsync", 0.0f, intervalTime);
        }

    }

    public void StopInterval(int sensor)
    {
        if (sensor == 0)
            CancelInvoke("SaveDepthMapEvent");
        if (sensor == 1)
            CancelInvoke("TakePhotoAsync");
    }

#if WINDOWS_UWP
    private long GetCurrentTimestampUnix()
    {
        // Get the current time, in order to create a PerceptionTimestamp. 
        Windows.Globalization.Calendar c = new Windows.Globalization.Calendar();
        Windows.Perception.PerceptionTimestamp ts = Windows.Perception.PerceptionTimestampHelper.FromHistoricalTargetTime(c.GetDateTime());
        return ts.TargetTime.ToUnixTimeMilliseconds();
        //return ts.SystemRelativeTargetTime.Ticks;
    }
    private Windows.Perception.PerceptionTimestamp GetCurrentTimestamp()
    {
        // Get the current time, in order to create a PerceptionTimestamp. 
        Windows.Globalization.Calendar c = new Windows.Globalization.Calendar();
        return Windows.Perception.PerceptionTimestampHelper.FromHistoricalTargetTime(c.GetDateTime());
    }
#endif


}