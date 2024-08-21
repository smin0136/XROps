using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class changeVol : MonoBehaviour
{
    VolumeRendering vr;
    public Texture3D texture;
    // Start is called before the first frame update
    void Start()
    {
        vr = GetComponent<VolumeRendering>();   
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown("space"))
        {
            changeTexture();
        }

        if (Input.GetKeyDown("tab"))
        {
            Debug.Log(gameObject.transform.localScale.ToString());
            gameObject.transform.localScale = new Vector3 (0.3f, 0.3f, 0.3f);
        }
    }

    private void changeTexture()
    {
        vr.volume = texture;
    }
}
