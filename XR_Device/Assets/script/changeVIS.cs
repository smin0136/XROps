using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class changeVIS : MonoBehaviour
{
    private int i = 0;
    public GameObject first = null;
    public GameObject second = null;
    public GameObject third = null;

    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void changeVis()
    {
        if (i == 0)
        {
            Debug.Log(i);
            Transform tarTransform = first.transform;
            first.SetActive(false);
            second.transform.localPosition = tarTransform.position;
            second.transform.localEulerAngles = tarTransform.localEulerAngles;
            second.transform.localScale = tarTransform.localScale;


            i++;
        }
        else if(i == 1)
        {
            Debug.Log(i);

            Transform tarTransform = second.transform;
            second.SetActive(false);
            third.transform.localPosition = tarTransform.position;
            third.transform.localEulerAngles = tarTransform.localEulerAngles;
            third.transform.localScale = tarTransform.localScale;
            i++;
        }
        else if (i == 2)
        {
            Debug.Log(i);

            Transform tarTransform = third.transform;
            third.SetActive(false);
            first.transform.localPosition = tarTransform.position;
            first.transform.localEulerAngles = tarTransform.localEulerAngles;
            first.transform.localScale = tarTransform.localScale;
            i=0;
        }


    }
}
