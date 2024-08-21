using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.XR.OpenXR.Input;

public class curMarkerTransform : MonoBehaviour
{

    Vector3 lastPosition;
    float lastUpdateTime;
    public string key;
    public bool stop = true;

    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        if (Vector3.Distance(transform.parent.position, lastPosition) > 0.01f && (Time.time - lastUpdateTime) > 0.5f && stop == false)
        {
            string pos = transform.parent.position.x.ToString() + "," + transform.parent.position.y.ToString() + "," + transform.parent.position.z.ToString();

            StartCoroutine(sendMarkerPosition(pos));


            lastPosition = transform.parent.position;
            lastUpdateTime = Time.time;
        }
    }

    public IEnumerator sendMarkerPosition(string pos)
    {

        string url = "https://vience.io:6040/holoSensor/sensorapi/marker/position/" + key + "/" + pos;
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

    public void updateMarker()
    {
        string pos = transform.parent.position.x.ToString() + "," + transform.parent.position.y.ToString() + "," + transform.parent.position.z.ToString();

        StartCoroutine(sendMarkerPosition(pos));
        stop = false;

    }

    public void stopUpdate()
    {
        stop = true;
    }
}
