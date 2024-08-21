using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.IO;

public class CaptureVIS : MonoBehaviour
{
    public Camera camera;

    private int resWidth;
    private int resHeight;

    // Start is called before the first frame update
    void Start()
    {
        resHeight = Screen.height;
        resWidth = Screen.width;
    }


    public void takeScreenShot() 
    {
        RenderTexture rt = new RenderTexture(resWidth, resHeight, 24);
        camera.targetTexture = rt;
        Texture2D screenShot = new Texture2D(resWidth, resHeight, TextureFormat.RGB24, false);
        Rect rec = new Rect(0,0,screenShot.width,screenShot.height);
        camera.Render();
        RenderTexture.active = rt;
        screenShot.ReadPixels(new Rect(0, 0, resWidth, resHeight), 0, 0);
        screenShot.Apply();

        byte[] bytes = screenShot.EncodeToPNG();
        
    }



}
