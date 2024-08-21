using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Microsoft.MixedReality.Toolkit;
using Microsoft.MixedReality.Toolkit.Input;
using Microsoft.MixedReality.Toolkit.UI.BoundsControl;

public class RayConstraint : MonoBehaviour
{
    // Start is called before the first frame update
    private GameObject viewParentObject = null;
    private GameObject marksParentObject = null;
    
    private BoxCollider DxRVisBoxCollider = null;
    private GameObject selectedMark = null;
    private BoundsControl bs = null;


    private void Awake()
    {
        viewParentObject = gameObject.transform.Find("DxRView").gameObject;
        marksParentObject = viewParentObject.transform.Find("DxRMarks").gameObject;
        DxRVisBoxCollider = gameObject.GetComponent<BoxCollider>();
        bs = gameObject.GetComponent<BoundsControl>();
    }

    // Start is called before the first frame update
    void Start()
    {
        

    }

    // Update is called once per frame
    void Update()
    {
        if (marksParentObject.transform.GetChild(0).Find("detail"))
        {
            RaycastHit[] hits;


            foreach (var source in CoreServices.InputSystem.DetectedInputSources)
            {
                // Ignore anything that is not a hand because we want articulated hands
                if (source.SourceType == Microsoft.MixedReality.Toolkit.Input.InputSourceType.Hand)
                {
                    foreach (var p in source.Pointers)
                    {
                        if (p is IMixedRealityNearPointer)
                        {
                            // Ignore near pointers, we only want the rays
                            continue;
                        }
                        if (p.Result != null)
                        {
                            var startPoint = p.Position;
                            var endPoint = p.Result.Details.Point;
                            var hitObject = p.Result.Details.Object;

                            var dir = endPoint - startPoint;
                            float dist = Vector3.Distance(startPoint, endPoint);

                            if (hitObject)
                            {
                                hits = Physics.RaycastAll(startPoint, dir);
                                for (int i = 0; i < hits.Length; i++)
                                {
                                    RaycastHit hit = hits[i];
                                    if (hit.transform.gameObject.CompareTag("DxRVis"))
                                    {

                                        DxRVisBoxCollider = hit.transform.GetComponent<BoxCollider>();
                                    }
                                    if (hit.transform.name.Contains("detail"))
                                    {
                                        
                                        //Debug.Log(dist.ToString());
                                        selectedMark = hit.transform.gameObject;
                                    }

                                }

                            }
                        }

                    }
                }
            }
            if (selectedMark && DxRVisBoxCollider)
            {
                DxRVisBoxCollider.enabled = false;
                bs.enabled = false;
            }
            else
            {
                DxRVisBoxCollider.enabled = true;
                bs.enabled = true;
            }
            selectedMark = null;

        }
        else
        {
            DxRVisBoxCollider.enabled = true;
            bs.enabled = true;
        }


    }
}
