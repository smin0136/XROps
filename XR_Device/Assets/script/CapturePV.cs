using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using System.IO;
using UnityEngine.Windows.WebCam;


public class CapturePV : MonoBehaviour
{
    public UnityEngine.UI.Text text;
    public bool photoMode;
    Client server;

    public void Start()
    {
        server = GetComponent<Client>();
    }

    private PhotoCapture photoCaptureObject = null;

    void OnPhotoCaptureCreated(PhotoCapture captureObject)
    {
        photoCaptureObject = captureObject;

        Resolution cameraResolution = PhotoCapture.SupportedResolutions.OrderByDescending((res) => res.width * res.height).First();

        CameraParameters c = new CameraParameters();
        c.hologramOpacity = 1.0f;
        c.cameraResolutionWidth = cameraResolution.width;
        c.cameraResolutionHeight = cameraResolution.height;
        c.pixelFormat = CapturePixelFormat.BGRA32;

        captureObject.StartPhotoModeAsync(c, OnPhotoModeStarted);
        text.text = "width: " + cameraResolution.width.ToString() + "\nheight: " + cameraResolution.height.ToString();

    }


    void OnStoppedPhotoMode(PhotoCapture.PhotoCaptureResult result)
    {
        photoCaptureObject.Dispose();
        photoCaptureObject = null;
    }

    private void OnPhotoModeStarted(PhotoCapture.PhotoCaptureResult result)
    {
        if (result.success)
        {
            photoMode = true;
        }
        else
        {
            text.text = "photo mode not started\n";
        }
    }

    public void takePhoto()
    {
        if (photoMode)
            photoCaptureObject.TakePhotoAsync(OnCapturedPhotoToMemory);

    }


    public void startPhoto()
    {
        PhotoCapture.CreateAsync(true, OnPhotoCaptureCreated);

    }


    public void stopPhoto()
    {
        photoCaptureObject.StopPhotoModeAsync(OnStoppedPhotoMode);
        photoMode = false;
    }

    void OnCapturedPhotoToMemory(PhotoCapture.PhotoCaptureResult result, PhotoCaptureFrame photoCaptureFrame)
    {
        if (result.success)
        {
            List<byte> imageBufferList = new List<byte>();
            // Copy the raw IMFMediaBuffer data into our empty byte list.
            photoCaptureFrame.CopyRawImageDataIntoBuffer(imageBufferList);

            // In this example, we captured the image using the BGRA32 format.
            // So our stride will be 4 since we have a byte for each rgba channel.
            // The raw image data will also be flipped so we access our pixel data
            // in the reverse order.

            /*
            int stride = 4;
            float denominator = 1.0f / 255.0f;
            List<Color> colorArray = new List<Color>();
            for (int i = imageBufferList.Count - 1; i >= 0; i -= stride)
            {
                float a = (int)(imageBufferList[i - 0]) * denominator;
                float r = (int)(imageBufferList[i - 1]) * denominator;
                float g = (int)(imageBufferList[i - 2]) * denominator;
                float b = (int)(imageBufferList[i - 3]) * denominator;

                colorArray.Add(new Color(r, g, b, a));
            }
            // Now we could do something with the array such as texture.SetPixels() or run image processing on the list
            //text.text = colorArray[10].ToString();
            */

            byte[] MRCarray = new byte[imageBufferList.Count];
            MRCarray = imageBufferList.ToArray();
#if WINDOWS_UWP
            server.SendMRC(MRCarray);
#endif

        }
        else
        {
            text.text = "memory wrong\n";
        }

        //photoCaptureObject.StopPhotoModeAsync(OnStoppedPhotoMode);
    }


    /*

    public async void getCameraCapture()
    {
#if WINDOWS_UWP
        text.text = "inside!!";

        CameraCaptureUI captureUI = new CameraCaptureUI();
        captureUI.PhotoSettings.Format = CameraCaptureUIPhotoFormat.Jpeg;
        captureUI.PhotoSettings.AllowCropping = true;

        captureUI.PhotoSettings.CroppedSizeInPixels = new Size(200, 200);

        StorageFile photo = await captureUI.CaptureFileAsync(CameraCaptureUIMode.Photo);
        text.text = "???\n";

        if (photo == null)
        {
            text.text = "photo not captured\n";
            // User cancelled photo capture
            
        }else
        {
            using (var stream = await photo.OpenReadAsync())
            {
                var bytes = new byte[stream.Size];
                using (var reader = new BinaryReader(stream.AsStream()))
                {
                    bytes = reader.ReadBytes((int)stream.Size);
                }
                text.text = bytes.Length.ToString();

                server.SendByteArray(bytes);

                // 여기서 ByteArray로 사용할 bytes 변수를 사용할 수 있습니다.
            }
        }

#endif
    }*/
    /*
    private async void TranscodeImageFile(StorageFile imageFile)
    {
        using (IRandomAccessStream fileStream = await imageFile.OpenAsync(FileAccessMode.ReadWrite))
        {
            BitmapDecoder decoder = await BitmapDecoder.CreateAsync(fileStream);

            var memStream = new InMemoryRandomAccessStream();
            BitmapEncoder encoder = await BitmapEncoder.CreateForTranscodingAsync(memStream, decoder);

            encoder.BitmapTransform.ScaledWidth = 200;
            encoder.BitmapTransform.ScaledHeight = 200;

            await encoder.FlushAsync();

            memStream.Seek(0);
            fileStream.Seek(0);
            fileStream.Size = 0;
            await RandomAccessStream.CopyAsync(memStream, fileStream);

            memStream.Dispose();
        }
    }*/

}