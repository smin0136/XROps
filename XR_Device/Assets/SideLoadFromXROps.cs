using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using Vuforia;

public class SideLoadFromXROps : MonoBehaviour
{
    Texture2D imageFromWeb;
    public GameObject markerAnchor;
    public UnityEngine.UI.Text text;
    int i = 0;
    // Start is called before the first frame update
    void Start()
    {
        //StartCoroutine(RetrieveTextureFromWeb("1111"));
        //markerAnchor.SetActive(false);
        //vuforia docs
    }

    IEnumerator RetrieveTextureFromWeb(string name)
    {
        using (UnityWebRequest uwr = UnityWebRequestTexture.GetTexture("https://library.vuforia.com/sites/default/files/vuforia-library/articles/solution/Magic%20Leap%20Related%20Content/Astronaut-scaled.jpg"))
        {
            yield return uwr.SendWebRequest();
            if (uwr.result != UnityWebRequest.Result.Success)
            {
                Debug.Log(uwr.error);
            }
            else
            {

                // Get downloaded texture once the web request completes
                var texture = DownloadHandlerTexture.GetContent(uwr);
                imageFromWeb = texture;
                Debug.Log("Image downloaded " + uwr);
                CreateImageTargetFromDownloadedTexture(name);
            }
        }
    }


    void CreateImageTargetFromDownloadedTexture(string name)
    {

        var mTarget = VuforiaBehaviour.Instance.ObserverFactory.CreateImageTarget(imageFromWeb, 0.1f, name);
        // Add the DefaultObserverEventHandler to the newly created game object
        mTarget.gameObject.AddComponent<DefaultObserverEventHandler>();
        Debug.Log("Target created and active" + mTarget);
        //renderMark(imageFromWeb);

        markerAnchor.transform.parent = mTarget.transform;
        markerAnchor.SetActive(true);

    }

    public void CreateImageTargetFromXROps(byte[] texture, string key)
    {
        VuforiaBehaviour.Instance.DevicePoseBehaviour.RecenterPose();

        imageFromWeb = new Texture2D(1, 1);
        imageFromWeb.LoadImage(texture);


        //if (curr_marker != null)
        //{
        //    text.text += "curr marker null\n";

        //Destroy(curr_marker);
        //}
        var mTarget = VuforiaBehaviour.Instance.ObserverFactory.CreateImageTarget(imageFromWeb,    0.1f,    "Astronaut");

        // Add the DefaultObserverEventHandler to the newly created game object
        //curr_marker = mTarget.gameObject;
        mTarget.gameObject.AddComponent<DefaultObserverEventHandler>();


        //Debug.Log("Target created and active" + mTarget);

        //renderMark(texture);
        //renderMark(imageFromWeb);
        //renderMark(texture);


        markerAnchor.transform.parent = mTarget.transform;
        markerAnchor.SetActive(true);


        markerAnchor.GetComponent<curMarkerTransform>().key = key;
        markerAnchor.GetComponent<curMarkerTransform>().updateMarker();

    }

    private void renderMark(Texture2D texture)
    {
        Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

        GameObject imagePrefab = Resources.Load("Marks/image/image") as GameObject;
        if (imagePrefab == null)
            Debug.Log("this is null");
        GameObject imageQuad = Instantiate(imagePrefab, pos, Quaternion.identity);

        Material ImageMaterial = imageQuad.GetComponent<MeshRenderer>().material;


        ImageMaterial.mainTexture = texture;

    }

    public void stopMarkUpdate()
    {

        if (markerAnchor != null)
        {
            markerAnchor.GetComponent<curMarkerTransform>().stopUpdate();
            markerAnchor.SetActive(false);

        }
    }


    // Update is called once per frame
    void Update()
    {
    }
}
