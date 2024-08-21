using System.Collections;

using UnityEngine;
using UnityEngine.Networking;
using Microsoft.MixedReality.Toolkit.Input;
using Microsoft.MixedReality.Toolkit.Utilities;


public class tempCapture : MonoBehaviour
{
    public UnityEngine.UI.Text text;
    public string key = "";
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }
    public IEnumerator sendActionTrue()
    {

        string url = "https://vience.io:6040/holoSensor/sensor/action/true/" + key;
        UnityWebRequest webRequest = UnityWebRequest.Get(url);
        yield return webRequest.SendWebRequest();

        if (webRequest.result == UnityWebRequest.Result.ConnectionError ||
            webRequest.result == UnityWebRequest.Result.ProtocolError)
        {
            Debug.LogError("Error: " + webRequest.error);


        }
        else
        {
            Debug.Log("good");
        }
    }


    public void generateSign()
    {
        //text.text += "air tap";
        StartCoroutine(sendActionTrue());

        // 왼손 또는 오른손에 대한 인덱스 손가락 끝의 위치를 얻음
        if (HandJointUtils.TryGetJointPose(TrackedHandJoint.IndexTip, Handedness.Right, out MixedRealityPose pose))
        {
            // 인덱스 손가락 끝의 위치를 사용하여 원하는 작업 수행
            // 예: 인덱스 손가락 끝의 위치에 GameObject를 배치
            //text.text += "\n" + pose.Position.ToString();
        }
        

    }
}
