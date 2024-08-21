using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SimpleJSON;
using System.IO;


namespace DxR
{
    public class GenerateVis : MonoBehaviour
    {
        public List<Vis> VisList = new List<Vis>();
        //public List<GameObject> VolumeList = new List<GameObject>();

        List<JSONNode> VisSpecList = new List<JSONNode>();
        JSONNode SpecTemplate;
        public GameObject visPrefab;                           // Prefab game object for instantiating marks.
        //public GameObject volumePrefab;                           // Prefab game object for instantiating marks.

        private GameObject parentObject = null;                         // Parent game object for all generated objects associated to vis.

        private void Awake()
        {
            parentObject = gameObject;
        }

        // Start is called before the first frame update
        void Start()
        {
            SpecTemplate = JSON.Parse(File.ReadAllText(Application.streamingAssetsPath + "/DxRSpecs/scatterplot3D.json"));

            
        }

        // Update is called once per frame
        void Update()
        {
            
        }

        public Vis makeVisPrefab()
        {

            Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

            visPrefab = Resources.Load("Anchor/DxRVis") as GameObject;
            Debug.Log(visPrefab);
            GameObject VisPref = Instantiate(visPrefab, pos, Quaternion.identity, parentObject.transform);


            VisList.Add(VisPref.GetComponent<Vis>());

            return VisPref.GetComponent<Vis>();
        }

        /*
        public GameObject makeVolumePrefab()
        {

            Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

            volumePrefab = Resources.Load("VolumeRendering/VolumeRendering1") as GameObject;
            GameObject VolPref = Instantiate(volumePrefab, pos, Quaternion.identity, parentObject.transform);


            VolumeList.Add(VolPref);

            return VolPref;
        }*/




        public void makeVisPrefab_for_button()
        {

            Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

            visPrefab = Resources.Load("Anchor/DxRVis") as GameObject;
            Debug.Log(visPrefab);
            GameObject VisPref = Instantiate(visPrefab, pos, Quaternion.identity, parentObject.transform);

            Vis tar = VisPref.GetComponent<Vis>();
            tar.UpdateVisSpecsFromButton();

            VisList.Add(VisPref.GetComponent<Vis>());

        }

        public void deletePrefab()
        {
            Vis targetVis = VisList[0];
            targetVis.DeleteAll();
            Destroy(targetVis.parentObject);

            VisList.RemoveAt(0);
        }
    }
}
