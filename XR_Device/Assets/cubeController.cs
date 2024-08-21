using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class cubeController : MonoBehaviour
{
    // Start is called before the first frame update
    public Vector3 RotateVector;

    // Update is called once per frame
    void Update()
    {
        transform.Rotate(RotateVector * Time.deltaTime);
    }
}
