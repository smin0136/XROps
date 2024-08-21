using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PointCloud : MonoBehaviour
{
    public UnityEngine.UI.Text text;
    List<GameObject> points_objects;
    public GameObject pointElem;
    public int maxChunkSize = 100;
    //public int maxChunkSize = 65535;
    int nChunk;

    // Start is called before the first frame update
    void Start()
    {
        points_objects=new List<GameObject>();

        List<Vector3> temp = new List<Vector3>();
        temp.Add(new Vector3(0.0f, 0.0f, 0.0f));
        temp.Add(new Vector3(0.0f, 0.0f, 0.71f));
        generatePointCloud(temp);
    }

    // Update is called once per frame
    void Update()
    {
        
    }



    public void generatePointCloud(List<Vector3> points)
    {
        nChunk = System.Math.Min(maxChunkSize, points.Count);


        for (int j = 0; j<nChunk; j++)
        {

            if (j+1 < points_objects.Count)
            {
                points_objects[j].transform.position = points[j];
                
            }
            else
            {
                GameObject new_point = Instantiate(pointElem, points[j], Quaternion.identity);
                //new_point.transform.position=points[j];
                new_point.transform.localScale=new Vector3(0.01f, 0.01f, 0.01f);
                new_point.transform.parent=this.transform;
                points_objects.Add(new_point);
            }
           

            //text.text += new_point.transform.lossyScale.ToString() + "\n";
            
        }

    }
}
