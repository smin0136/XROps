using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SimpleJSON;
using System.IO;
using System;
using Microsoft.MixedReality.Toolkit.UI;
using System.ComponentModel.Composition;
using System.Security.Cryptography;

namespace DxR
{
    /// <summary>
    /// This component can be attached to any GameObject (_parentObject) to create a 
    /// data visualization. This component takes a JSON specification as input, and
    /// generates an interactive visualization as output. The JSON specification 
    /// describes the visualization using ONE type of mark and one or more channels.
    /// </summary>
    public class Vis : MonoBehaviour
    {
        public string visSpecsURL = "example.json";                     // URL of vis specs; relative to specsRootPath directory.
        public bool enableGUI = true;                                   // Switch for in-situ GUI editor.
        public bool enableSpecsExpansion = false;                       // Switch for automatically replacing the vis specs text file on disk with inferrence result.
        public bool enableTooltip = true;                               // Switch for tooltip that shows datum attributes on-hover of mark instance.
        public bool verbose = true;                                     // Switch for verbose log.

        public static string UNDEFINED = "undefined";                   // Value used for undefined objects in the JSON vis specs.
        public static float SIZE_UNIT_SCALE_FACTOR = 1.0f / 1000.0f;    // Conversion factor to convert each Unity unit to 1 meter.
        public static float DEFAULT_VIS_DIMS = 500.0f;                  // Default dimensions of a visualization, if not specified.
        public Matrix4x4 initialTransform;

        //public Transform worldView = null;
        //private GameObject worldView_object = null;

        public JSONNode visSpecs;                                              // Vis specs that is synced w/ the inferred vis specs and vis.
        JSONNode visSpecsInferred;                                      // This is the inferred vis specs and is ultimately used for construction.

        GenerateVis gv;
        Parser parser = null;                                           // Parser of JSON specs and data in text format to JSONNode object specs.
        GUI gui = null;                                                 // GUI object (class) attached to GUI game object.
        GameObject tooltip = null;                                      // Tooltip game object for displaying datum info, e.g., on-hover.
        public XROpsConnection server = null;
        //public UnityEngine.UI.Text text;

        Vis LinkTargetVis = null;
        Vector3 posOffset;

        // Vis Properties:
        string title;                                                   // Title of vis displayed.
        float width;                                                    // Width of scene in millimeters.
        float height;                                                   // Heigh of scene in millimeters.
        float depth;                                                    // Depth of scene in millimeters.
        string markType;                                                // Type or name of mark used in vis.
        public Data data;                                               // Object containing data.
        bool IsLinked = false;                                          // Link to other vis object for interaction.
        string data_name=null;
        Color[] color_list;
        public byte[] imageTexture;

        public List<GameObject> markInstances;                                 // List of mark instances; each mark instance corresponds to a datum.

        public GameObject parentObject = null;                         // Parent game object for all generated objects associated to vis.

        private GameObject viewParentObject = null;                     // Parent game object for all view related objects - axis, legend, marks.
        private GameObject marksParentObject = null;                    // Parent game object for all mark instances.

        private GameObject guidesParentObject = null;                   // Parent game object for all guies (axes/legends) instances.
        private GameObject interactionsParentObject = null;             // Parent game object for all interactions, e.g., filters.
        private GameObject markPrefab = null;                           // Prefab game object for instantiating marks.
        private List<ChannelEncoding> channelEncodings = null;          // List of channel encodings.

        List<string> marksList;                                         // List of mark prefabs that can be used at runtime.
        List<string> dataList;                                          // List of local data that can be used at runtime.

        private bool isReady = false;
        private bool isWorldCoord = false;
        private bool isMesh = false;
        private Mesh mesh;
        public bool[] rotationConst;
        public int [] linkedAxis;
        public int[] indAxis;
        public int[] indLinkedAxis;

        public bool IsReady { get { return isReady; } }

        private int frameCount = 0;
        public int FrameCount { get { return frameCount; } set { frameCount = value; } }
        

        private void Awake()
        {
            rotationConst = new bool[3] { false, false, false };
            linkedAxis = new int[3] { 0, 1, 2 };
            indAxis = new int[3] { 0, 1, 2 };
            indLinkedAxis = new int[3] { 0, 1, 2 };
            gv =  GameObject.Find("ResearchModeController").GetComponent<GenerateVis>();
            //worldView_object = new GameObject("world");
            //worldView_object.AddComponent(typeof(MeshFilter));
            //MeshRenderer worldView_renderer = worldView_object.AddComponent(typeof(MeshRenderer)) as MeshRenderer;
            //worldView_renderer.material = (Material)Resources.Load("Materials/MeshMaterial", typeof(Material));
            //worldView = worldView_object.transform;// GameObject.Find("WorldView").transform;
            server = GameObject.Find("ResearchModeController").GetComponent<XROpsConnection>();
            //text = GameObject.Find("text").GetComponent<UnityEngine.UI.Text>();
            // Initialize objects:
            parentObject = gameObject;
            viewParentObject = gameObject.transform.Find("DxRView").gameObject;
            marksParentObject = viewParentObject.transform.Find("DxRMarks").gameObject;
            guidesParentObject = viewParentObject.transform.Find("DxRGuides").gameObject;
            interactionsParentObject = gameObject.transform.Find("DxRInteractions").gameObject;


            if (viewParentObject == null || marksParentObject == null)
            {
                throw new Exception("Unable to load DxRView and/or DxRMarks objects.");
            }

            parser = new Parser();
            //server = GetComponent<Server>();

            // Parse the vis specs URL into the vis specs object.
            parser.Parse(visSpecsURL, out visSpecs);

            InitDataList();
            InitMarksList();

            // Initialize the GUI based on the initial vis specs.
            //InitGUI();
            //InitServer();
            InitTooltip();
            
            // Update vis based on the vis specs.
            UpdateVis();
            isReady = true;
        }

        private void Update()
        {
            FrameCount++;

            //if (server.updateServerVisSpec)
            //{
            //    UpdateVisSpecsFromServer();
            //}
        }

        private void LateUpdate()
        {

            var linkType = visSpecs["link"]["type"];
            if (linkType != "none")
            {
                if (linkType == "object-link")
                {
                    parentObject.transform.position = parentObject.transform.position +  LinkTargetVis.transform.position - posOffset;
                    posOffset.Set(LinkTargetVis.transform.position.x, LinkTargetVis.transform.position.y, LinkTargetVis.transform.position.z);
                }
                if (linkType == "axis-link")
                {

                    if (rotationConst[0])
                    {
                        Transform tarTransform = LinkTargetVis.guidesParentObject.transform.GetChild(indLinkedAxis[linkedAxis[0]]);
                        Transform depTransform = guidesParentObject.transform.GetChild(indAxis[0]);

                        //parentObject.transform.position = parentObject.transform.position + (tarTransform.position - depTransform.position);
                        parentObject.transform.position = LinkTargetVis.transform.position;
                        Quaternion t1 = new Quaternion();
                        t1.SetFromToRotation(depTransform.right, tarTransform.right);
                        transform.rotation = t1 * parentObject.transform.rotation;
                        if (linkedAxis[0]==0) { 
                            parentObject.GetComponent<RotationAxisConstraint>().ConstraintOnRotation = Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.YAxis | Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.ZAxis;
                        }
                        else if (linkedAxis[0]==1)
                        {
                            parentObject.GetComponent<RotationAxisConstraint>().ConstraintOnRotation = Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.XAxis | Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.ZAxis;
                        }
                        else if (linkedAxis[0]==2)
                        {
                            parentObject.GetComponent<RotationAxisConstraint>().ConstraintOnRotation = Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.XAxis | Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.YAxis;
                        }

                    }
                    if (rotationConst[1])
                    {
                        Transform tarTransform = LinkTargetVis.guidesParentObject.transform.GetChild(indLinkedAxis[linkedAxis[1]]);
                        Transform depTransform = guidesParentObject.transform.GetChild(indAxis[1]);

                        //parentObject.transform.position = parentObject.transform.position + (tarTransform.position - depTransform.position);
                        parentObject.transform.position = LinkTargetVis.transform.position;
                        Quaternion t1 = new Quaternion();
                        t1.SetFromToRotation(depTransform.right, tarTransform.right);
                        transform.rotation = t1 * parentObject.transform.rotation;
                        if (linkedAxis[1]==0)
                        {
                            parentObject.GetComponent<RotationAxisConstraint>().ConstraintOnRotation = Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.YAxis | Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.ZAxis;
                        }
                        else if (linkedAxis[1]==1)
                        {
                            parentObject.GetComponent<RotationAxisConstraint>().ConstraintOnRotation = Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.XAxis | Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.ZAxis;
                        }
                        else if (linkedAxis[1]==2)
                        {
                            parentObject.GetComponent<RotationAxisConstraint>().ConstraintOnRotation = Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.XAxis | Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.YAxis;
                        }

                    }
                    if (rotationConst[2])
                    {
                        Transform tarTransform = LinkTargetVis.guidesParentObject.transform.GetChild(indLinkedAxis[linkedAxis[2]]);
                        Transform depTransform = guidesParentObject.transform.GetChild(indAxis[2]);

                        //parentObject.transform.position = parentObject.transform.position + (tarTransform.position - depTransform.position);
                        parentObject.transform.position = LinkTargetVis.transform.position;
                        Quaternion t1 = new Quaternion();
                        t1.SetFromToRotation(depTransform.right, tarTransform.right);
                        transform.rotation = t1 * parentObject.transform.rotation;
                        if (linkedAxis[2]==0)
                        {
                            parentObject.GetComponent<RotationAxisConstraint>().ConstraintOnRotation = Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.YAxis | Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.ZAxis;
                        }
                        else if (linkedAxis[2]==1)
                        {
                            parentObject.GetComponent<RotationAxisConstraint>().ConstraintOnRotation = Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.XAxis | Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.ZAxis;
                        }
                        else if (linkedAxis[2]==2)
                        {
                            parentObject.GetComponent<RotationAxisConstraint>().ConstraintOnRotation = Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.XAxis | Microsoft.MixedReality.Toolkit.Utilities.AxisFlags.YAxis;
                        }

                    }

                }
                if (linkType == "value")
                {
                    parentObject.transform.position = posOffset;
                }
            }
        }

        public JSONNode GetVisSpecs()
        {
            return visSpecs;
        }

        public int GetNumMarkInstances()
        {
            return markInstances.Count;
        }

        public bool GetIsLinked()
        {
            return IsLinked;
        }

        private void InitTooltip()
        {
            GameObject tooltipPrefab = Resources.Load("Tooltip/Tooltip") as GameObject;
            if(tooltipPrefab != null)
            {
                tooltip = Instantiate(tooltipPrefab, parentObject.transform);
                tooltip.SetActive(false);
            }
        }

        /// <summary>
        /// Update the visualization based on the current visSpecs object (whether updated from GUI or text editor).
        /// Currently, deletes everything and reconstructs everything from scratch.
        /// TODO: Only reconstruct newly updated properties.
        /// </summary>
        private void UpdateVis()
        {
            DeleteAll();
            if (visSpecs["encoding"]["x"] != null)
            {
                string dataType = visSpecs["encoding"]["x"]["type"].Value;
                if (dataType.Contains("coordinate"))
                {
                    isWorldCoord = true;
                }
                else
                {
                    isWorldCoord = false;
                }
            }
            else
            {
                isWorldCoord = false;
            }
            
            UpdateVisConfig();
            UpdateVisData();
            UpdateMarkPrefab();
            if (isWorldCoord)
            {
                InferVisSpecs();
                ConstructWorldVis(visSpecsInferred);
            }
            else
            {
                InferVisSpecs();
                ConstructVis(visSpecsInferred);
            }
        }

        private void ConstructVis(JSONNode specs)
        {
            CreateChannelEncodingObjects(specs);

            ConstructMarkInstances();

            ApplyChannelEncodings();

            // Interactions need to be constructed 
            // before axes and legends
            ConstructInteractions(specs);

            ConstructAxes(specs);

            ConstructLegends(specs);
            
            
            if (isMesh)
            {
                // Go through each channel and create ChannelEncoding for each:
                foreach (KeyValuePair<string, JSONNode> kvp in specs["encoding"].AsObject)
                {
                    ChannelEncoding channelEncoding = new ChannelEncoding();
                    channelEncoding.channel = kvp.Key;
                    JSONNode channelSpecs = kvp.Value;

                    if (channelEncoding.channel == "color")
                    {
                        color_list = new Color[markInstances.Count];
                    }
                }
                ConstructMesh();
            }

        }

        private void ConstructWorldVis(JSONNode specs)
        {
            
            
            CreateChannelEncodingObjects(specs);

            ConstructWorldMarkInstances();

            ApplyChannelEncodings();
            

            if (isMesh)
            {
                foreach (KeyValuePair<string, JSONNode> kvp in specs["encoding"].AsObject)
                {
                    ChannelEncoding channelEncoding = new ChannelEncoding();
                    channelEncoding.channel = kvp.Key;
                    JSONNode channelSpecs = kvp.Value;

                    if (channelEncoding.channel == "color")
                    {
                        color_list = new Color[markInstances.Count];
                    }
                }
                ConstructMesh();
            }

        }

        
        private void ConstructInteractions(JSONNode specs)
        {
            if (specs["interaction"] == null) return;

            interactionsParentObject.GetComponent<Interactions>().Init(this);



            foreach (JSONObject interactionSpecs in specs["interaction"].AsArray)
            {
                if(interactionSpecs["type"] != null && interactionSpecs["field"] != null && interactionSpecs["domain"] != null)
                {
                    switch(interactionSpecs["type"].Value)
                    {
                        case "thresholdFilter":
                            AddThresholdFilterInteraction(interactionSpecs);
                            break;

                        case "toggleFilter":
                            AddToggleFilterInteraction(interactionSpecs);
                            break;

                        default:
                            return;
                    }

                    Debug.Log("Constructed interaction: " + interactionSpecs["type"].Value +
                        " for data field " + interactionSpecs["field"].Value);
                } else
                {
                    Debug.Log("Make sure interaction object has type, field, and domain specs.");
//                    throw new System.Exception("Make sure interaction object has type, field, and domain specs.");
                }

            }
        }
        
        private void AddThresholdFilterInteraction(JSONObject interactionSpecs)
        {
            if (interactionsParentObject != null)
            {
                interactionsParentObject.GetComponent<Interactions>().AddThresholdFilter(interactionSpecs);
            }
        }
        
        
        private void AddToggleFilterInteraction(JSONObject interactionSpecs)
        {
            if(interactionsParentObject != null)
            {
                interactionsParentObject.GetComponent<Interactions>().AddToggleFilter(interactionSpecs);
            }            
        }


        private void ConstructLegends(JSONNode specs)
        {
            // Go through each channel and create legend for color, shape, or size channels:
            for (int channelIndex = 0; channelIndex < channelEncodings.Count; channelIndex++)
            {
                ChannelEncoding channelEncoding = channelEncodings[channelIndex];
                JSONNode legendSpecs = specs["encoding"][channelEncoding.channel]["legend"];
                if (legendSpecs != null && legendSpecs.Value.ToString() != "none" && channelEncoding.channel == "color")
                {
                    if (verbose)
                    {
                        Debug.Log("Constructing legend for channel " + channelEncoding.channel);
                    }

                    ConstructLegendObject(legendSpecs, ref channelEncoding);
                }
            }
        }

        private void ConstructLegendObject(JSONNode legendSpecs, ref ChannelEncoding channelEncoding)
        {
            GameObject legendPrefab = Resources.Load("Legend/Legend", typeof(GameObject)) as GameObject;
            if (legendPrefab != null && markPrefab != null)
            {
                channelEncoding.legend = Instantiate(legendPrefab, guidesParentObject.transform);
                channelEncoding.legend.GetComponent<Legend>().Init(interactionsParentObject.GetComponent<Interactions>());
                channelEncoding.legend.GetComponent<Legend>().UpdateSpecs(legendSpecs, ref channelEncoding, markPrefab);
            }
            else
            {
                throw new Exception("Cannot find legend prefab.");
            }


            for (int i = 0; i < channelEncoding.legend.transform.childCount; i++)
            {
                LegendValue legendValue = channelEncoding.legend.transform.GetChild(i).gameObject.GetComponent<LegendValue>();
                if (legendValue != null)
                {
                    Transform Title = legendValue.transform.GetChild(0).transform;
                    Transform Mark = legendValue.transform.GetChild(1).transform;


                }
            }

        }

        private void ConstructAxes(JSONNode specs)
        {
            // Go through each channel and create axis for each spatial / position channel:
            for (int channelIndex = 0; channelIndex < channelEncodings.Count; channelIndex++)
            {
                ChannelEncoding channelEncoding = channelEncodings[channelIndex];
                JSONNode axisSpecs = specs["encoding"][channelEncoding.channel]["axis"];
                if (axisSpecs != null && axisSpecs.Value.ToString() != "none" &&
                    (channelEncoding.channel == "x" || channelEncoding.channel == "y" ||
                    channelEncoding.channel == "z"))
                {
                    if (verbose)
                    {
                        Debug.Log("Constructing axis for channel " + channelEncoding.channel);
                    }

                    ConstructAxisObject(axisSpecs, ref channelEncoding);
                }
            }
        }

        private void ConstructAxisObject(JSONNode axisSpecs, ref ChannelEncoding channelEncoding)
        {
            GameObject axisPrefab = Resources.Load("Axis/Axis", typeof(GameObject)) as GameObject;
            if (axisPrefab != null)
            {
                channelEncoding.axis = Instantiate(axisPrefab, guidesParentObject.transform);
                channelEncoding.axis.GetComponent<Axis>().Init(interactionsParentObject.GetComponent<Interactions>(),channelEncoding.field);
                //channelEncoding.axis.GetComponent<Axis>().Init(channelEncoding.field);
                channelEncoding.axis.GetComponent<Axis>().UpdateSpecs(axisSpecs, channelEncoding.scale);                
            }
            else
            {
                throw new Exception("Cannot find axis prefab.");
            }
        }

        private void ApplyChannelEncodings()
        {
            bool isDirectionChanged = false;
            foreach(ChannelEncoding ch in channelEncodings)
            {
                ApplyChannelEncoding(ch, ref markInstances);

                if(ch.channel == "xdirection" || ch.channel == "ydirection" || ch.channel == "zdirection")
                {
                    isDirectionChanged = true;
                }
            }

            if(isDirectionChanged)
            {
                for (int i = 0; i < markInstances.Count; i++)
                {
                    Mark markComponent = markInstances[i].GetComponent<Mark>();
  
                    markComponent.SetRotation();
                }
            }
        }

        private void ApplyChannelEncoding(ChannelEncoding channelEncoding,
            ref List<GameObject> markInstances)
        {
            for(int i = 0; i < markInstances.Count; i++)
            {

                if (channelEncoding.channel == "text" && markInstances[i].name != "text")
                {
                    
                    Mark markComponent = markInstances[i].GetComponent<Mark>();
                    if (markComponent == null)
                    {
                        throw new Exception("Mark component not present in mark prefab.");
                    }
                    GameObject tooltip = markInstances[i].transform.Find("detail").gameObject;
                    tooltip.SetActive(true);
                    string channelValue;

                    if (channelEncoding.value != DxR.Vis.UNDEFINED)
                    {
                        channelValue = channelEncoding.value;
                    }
                    else
                    {
                        channelValue = channelEncoding.scale.ApplyScale(markComponent.datum[channelEncoding.field]);
                    }

                    tooltip.GetComponent<ToolTipSpawner>().toolTipText = channelValue;

                }
                else if (channelEncoding.channel == "texture")
                {

                    Mark markComponent = markInstances[i].GetComponent<Mark>();
                    if (markComponent == null)
                    {
                        throw new Exception("Mark component not present in mark prefab.");
                    }
                    markComponent.SetChannelValue(channelEncoding.channel, channelEncoding.value);

                }

                else
                {
                    Mark markComponent = markInstances[i].GetComponent<Mark>();
                    if (markComponent == null)
                    {
                        throw new Exception("Mark component not present in mark prefab.");
                    }

                    if (isWorldCoord)
                    {
                        if (channelEncoding.channel == "x" || channelEncoding.channel == "y" || channelEncoding.channel == "z")
                        {
                            if (channelEncoding.value != DxR.Vis.UNDEFINED)
                            {
                                markComponent.SetChannelValue(channelEncoding.channel, channelEncoding.value);

                            }
                            else
                            {
                                markComponent.SetChannelValue(channelEncoding.channel, (float.Parse(markComponent.datum[channelEncoding.field]) * 1000.0).ToString());
                                //markComponent.SetChannelValue(channelEncoding.channel, markComponent.datum[channelEncoding.field]);
                            }
                        }
                        else if (channelEncoding.channel == "color" || channelEncoding.channel == "size")
                        {
                            if (channelEncoding.value != DxR.Vis.UNDEFINED)
                            {
                                markComponent.SetChannelValue(channelEncoding.channel, channelEncoding.value);
                            }
                            else
                            {
                                string channelValue = channelEncoding.scale.ApplyScale(markComponent.datum[channelEncoding.field]);
                                markComponent.SetChannelValue(channelEncoding.channel, channelValue);
                            }

                        }


                    }
                    else
                    {
                        if (channelEncoding.value != DxR.Vis.UNDEFINED)
                        {
                            markComponent.SetChannelValue(channelEncoding.channel, channelEncoding.value);
                        }
                        else
                        {
                            string channelValue = channelEncoding.scale.ApplyScale(markComponent.datum[channelEncoding.field]);
                            markComponent.SetChannelValue(channelEncoding.channel, channelValue);
                        }

                    }
                }

                
            }
        }

        private void ConstructMarkInstances()
        {
            markInstances = new List<GameObject>();

            // Create one mark prefab instance for each data point:
            foreach (Dictionary<string, string> dataValue in data.values)
            {
                // Instantiate mark prefab, copying parentObject's transform:
                GameObject markInstance = InstantiateMark(markPrefab, marksParentObject.transform);

                // Copy datum in mark:
                markInstance.GetComponent<Mark>().datum = dataValue;

                
                // Assign tooltip:
                if(enableTooltip)
                {
                    markInstance.GetComponent<Mark>().InitTooltip(ref tooltip);
                }

                markInstances.Add(markInstance);
            }

        }

        private void ConstructWorldMarkInstances()
        {
            markInstances = new List<GameObject>();

            // Create one mark prefab instance for each data point:
            foreach (Dictionary<string, string> dataValue in data.values)
            {

                // Instantiate mark prefab, copying parentObject's transform:
                GameObject markInstance = Instantiate(markPrefab, Vector3.zero, Quaternion.identity, parentObject.transform);


                // Copy datum in mark:
                markInstance.GetComponent<Mark>().datum = dataValue;

                /*
                // Assign tooltip:
                if(enableTooltip)
                {
                    markInstance.GetComponent<Mark>().InitTooltip(ref tooltip);
                }*/

                markInstances.Add(markInstance);
            }
        }

        internal List<string> GetDataFieldsListFromURL(string dataURL)
        {
            return parser.GetDataFieldsList(dataURL);
        }

        private GameObject InstantiateMark(GameObject markPrefab, Transform parentTransform)
        {
            return Instantiate(markPrefab, parentTransform.position,
                        parentTransform.rotation, parentTransform);
        }

        private void CreateChannelEncodingObjects(JSONNode specs)
        {

            channelEncodings = new List<ChannelEncoding>();

            // Go through each channel and create ChannelEncoding for each:
            foreach (KeyValuePair<string, JSONNode> kvp in specs["encoding"].AsObject)
            {
                ChannelEncoding channelEncoding = new ChannelEncoding();
                channelEncoding.channel = kvp.Key;
                JSONNode channelSpecs = kvp.Value;


                if (channelSpecs["value"] != null)
                {
                    channelEncoding.value = channelSpecs["value"].Value.ToString();

                    if (channelSpecs["type"] != null)
                    {
                        channelEncoding.valueDataType = channelSpecs["type"].Value.ToString();
                    }
                }
                else
                {
                    channelEncoding.field = channelSpecs["field"];
                    // Check validity of data field
                    if (!data.fieldNames.Contains(channelEncoding.field))
                    {
                       
                        throw new Exception("Cannot find data field " + channelEncoding.field + " in data. Please check your spelling (case sensitive).");
                    }

                    if (channelSpecs["type"] != null)
                    {
                        channelEncoding.fieldDataType = channelSpecs["type"];
                        
                    }
                    else
                    {
                        throw new Exception("Missing type for field in channel " + channelEncoding.channel);
                    }
                }

                JSONNode scaleSpecs = channelSpecs["scale"];
                if (scaleSpecs != null)
                {
                    CreateScaleObject(scaleSpecs, ref channelEncoding.scale);
                }

                channelEncodings.Add(channelEncoding);
            }
        }

        private void CreateScaleObject(JSONNode scaleSpecs, ref Scale scale)
        {
            switch (scaleSpecs["type"].Value.ToString())
            {
                case "none":
                    scale = new ScaleNone(scaleSpecs);
                    break;

                case "linear":
                    scale = new ScaleLinear(scaleSpecs);
                    break;

                case "band":
                    scale = new ScaleBand(scaleSpecs);
                    break;

                case "point":
                    scale = new ScalePoint(scaleSpecs);
                    break;

                case "ordinal":
                    scale = new ScaleOrdinal(scaleSpecs);
                    break;

                case "sequential":
                    scale = new ScaleSequential(scaleSpecs);
                    break;

                default:
                    scale = null;
                    break;
            }
        }

        private void InferVisSpecs()
        {
            if (markPrefab != null)
            {
                markPrefab.GetComponent<Mark>().Infer(data, visSpecs, out visSpecsInferred, visSpecsURL);
                if (enableSpecsExpansion)
                {
                    JSONNode visSpecsToWrite = JSON.Parse(visSpecsInferred.ToString());
                    if (visSpecs["data"]["url"] != null && visSpecs["data"]["url"] != "inline")
                    {
                        visSpecsToWrite["data"].Remove("values");
                    }

                    if (visSpecs["interaction"].AsArray.Count == 0)
                    {
                        visSpecsToWrite.Remove("interaction");
                    }
#if UNITY_EDITOR
            System.IO.File.WriteAllText(Parser.GetFullSpecsPath(visSpecsURL), visSpecsToWrite.ToString(2));
#else

                    UnityEngine.Windows.File.WriteAllBytes(Parser.GetFullSpecsPath(visSpecsURL),
                        System.Text.Encoding.UTF8.GetBytes(visSpecsToWrite.ToString(2)));
#endif

                    
                }
            }
            else if (markPrefab == null && markType == "none")
            {
                //text.text += "none";

            }
            else
            {
                throw new Exception("Cannot perform inferrence without mark prefab loaded.");
            }
        }

        private void UpdateMarkPrefab()
        {
            markType = visSpecs["mark"].Value;

            
            markPrefab = LoadMarkPrefab(markType);

            
            if (visSpecs["data"]["faces"] != null)
            {
                isMesh = true;
            }

        }


        private void ConstructMesh()
        {

            color_list = new Color[markInstances.Count];


            foreach (ChannelEncoding ch in channelEncodings)
            {
                if (ch.channel == "color")
                {
                    for (int i = 0; i < markInstances.Count; i++)
                    {
                        Mark markComponent = markInstances[i].GetComponent<Mark>();
                        if (isWorldCoord)
                        {
                            if (ch.value != DxR.Vis.UNDEFINED)
                            {
                                Color color;
                                bool colorParsed = ColorUtility.TryParseHtmlString(ch.value, out color);
                                color_list[i] = color;

                            }
                            else
                            {
                               
                                string channelValue = ch.scale.ApplyScale(markComponent.datum[ch.field]);
                                Color color;
                                bool colorParsed = ColorUtility.TryParseHtmlString(channelValue, out color);
                                color_list[i] = color;
                            }
                            
                        }
                        else
                        {
                            if (ch.value != DxR.Vis.UNDEFINED)
                            {
                                Color color;
                                bool colorParsed = ColorUtility.TryParseHtmlString(ch.value, out color);
                                color_list[i] = color;
                            }
                            else
                            {
                                string channelValue = ch.scale.ApplyScale(markComponent.datum[ch.field]);
                                Color color;
                                bool colorParsed = ColorUtility.TryParseHtmlString(channelValue, out color);
                                color_list[i] = color;
                            }

                        }
                    }
                }
            }

            //text.text += color_list[0].ToString() + color_list[1].ToString() + "\n";


            JSONArray faces_j = visSpecs["data"]["faces"].AsArray;
            int face_cnt = faces_j.Count;
            int num = face_cnt / 3;
            int[] faces = new int[num *3];
            for (int i = 0; i < num; i++)
            {
                faces[i*3 + 0] = faces_j[i*3 + 0];
                faces[i*3 + 1] = faces_j[i*3 + 1];
                faces[i*3 + 2] = faces_j[i*3 + 2];
            }
            /*
            int num = face_cnt / 4;
            int[] faces = new int[num *3];
            for (int i = 0; i < num; i++)
            {
                faces[i*3 + 0] = faces_j[i*4 + 1];
                faces[i*3 + 1] = faces_j[i*4 + 2];
                faces[i*3 + 2] = faces_j[i*4 + 3];
            }*/

            Destroy(mesh);
            mesh = new Mesh();
            //mesh.transform.parent = meshesParentObject.transform;
            Vector3[] points = new Vector3[markInstances.Count];

            for (int m = 0; m < markInstances.Count; m++)
            {

                Mark markObject = markInstances[m].GetComponent<Mark>();
                Vector3 tmp = markObject.transform.localPosition;

                points[m] = tmp;

            }

            mesh.vertices = points;
            mesh.triangles = faces;
            mesh.RecalculateNormals();
            if (color_list != null)
            {
                mesh.colors = color_list;
            }


            int[] wires = new int[num * 3 * 2];
            for (int iTria = 0; iTria < num; iTria++)
            {
                for (int iVertex = 0; iVertex < 3; iVertex++)
                {
                    wires[6 * iTria + 2 * iVertex] = faces[3 * iTria + iVertex];
                    wires[6 * iTria + 2 * iVertex + 1] = faces[3 * iTria + (iVertex + 1) % 3];
                }
            }


            Mesh line_mesh = transform.Find("mesh_line").gameObject.GetComponent<MeshFilter>().mesh;
            line_mesh.vertices = points;
            line_mesh.SetIndices(wires, MeshTopology.Lines, 0);
            line_mesh.normals = mesh.normals;



            /*
            Vector3[] normals = mesh.normals;

            Vector3 avg_pos = new Vector3();
            for (int j=0; j<points.Length; j++)
            {
                avg_pos += points[j];
            }
            avg_pos = new Vector3(avg_pos[0]/points.Length, avg_pos[1]/points.Length, avg_pos[2]/points.Length);

            for (int i = 0; i < normals.Length; i++)
            {
                var tmp = points[i] - avg_pos;
                var res = normals[i][0] * tmp[0] + normals[i][1] * tmp[1] + normals[i][2] * tmp[2];
                if (res < 0)
                {
                    normals[i] = normals[i] * -1;
                }
            }*/


            //mesh.RecalculateBounds();

            //GetComponent<MeshFilter>().mesh = mesh;
            /*
            if (isWorldCoord)
            {
                //worldView.GetComponent<MeshFilter>().mesh.Clear();
                //worldView.GetComponent<MeshFilter>().mesh = mesh;
                GetComponent<MeshFilter>().mesh = mesh;
            }
            else
            {
                //worldView.GetComponent<MeshFilter>().mesh.Clear();
                GetComponent<MeshFilter>().mesh = mesh;

            }*/
            GetComponent<MeshFilter>().mesh = mesh;



        }



        private GameObject LoadMarkPrefab(string markName)
        {

            Debug.Log("inside makr prefab");
            string markNameLowerCase = markName.ToLower();
            GameObject markPrefabResult = Resources.Load("Marks/" + markNameLowerCase + "/" + markNameLowerCase) as GameObject;

            if (markPrefabResult == null)
            {
                throw new Exception("Cannot load mark " + markNameLowerCase);
            }
            else if (verbose)
            {
                Debug.Log("Loaded mark " + markNameLowerCase);
            }

            // If the prefab does not have a Mark script attached to it, attach the default base Mark script object, i.e., core mark.
            if (markPrefabResult.GetComponent<Mark>() == null)
            {
                DxR.Mark markComponent = markPrefabResult.AddComponent(typeof(DxR.Mark)) as DxR.Mark;
            }
            markPrefabResult.GetComponent<Mark>().markName = markNameLowerCase;

            return markPrefabResult;
        }

        internal List<string> GetDataFieldsListFromValues(JSONNode valuesSpecs)
        {
            return parser.GetDataFieldsListFromValues(valuesSpecs);
        }

        private void UpdateVisData()
        {
            if(visSpecs["data"]["url"] != "inline")
            {
                visSpecs["data"].Add("values", parser.CreateValuesSpecs(visSpecs["data"]["url"]));
                data_name = visSpecs["data"]["url"];
            }
            
            JSONNode valuesSpecs = visSpecs["data"]["values"];

            Debug.Log("Data update " + visSpecs["data"]["values"].ToString());

            data = new Data();

            CreateDataFields(valuesSpecs, ref data);

            data.values = new List<Dictionary<string, string>>();

            int numDataFields = data.fieldNames.Count;
            if (verbose)
            {
                Debug.Log("Counted " + numDataFields.ToString() + " fields in data.");
            }

            // Loop through the values in the specification
            // and insert one Dictionary entry in the values list for each.
            foreach (JSONNode value in valuesSpecs.Children)
            {
                Dictionary<string, string> d = new Dictionary<string, string>();

                bool valueHasNullField = false;
                for (int fieldIndex = 0; fieldIndex < numDataFields; fieldIndex++)
                {
                    string curFieldName = data.fieldNames[fieldIndex];

                    // TODO: Handle null / missing values properly.
                    if (value[curFieldName].IsNull)
                    {
                        valueHasNullField = true;
                        Debug.Log("value null found: ");
                        break;
                    }
                   
                    d.Add(curFieldName, value[curFieldName]);
                }

                if (!valueHasNullField)
                {
                    data.values.Add(d);
                }
            }

            if (visSpecs["data"]["linked"] != null)
            {
                if (visSpecs["data"]["linked"] == "true")
                {
                    IsLinked = true;
                }
            }
            //            SubsampleData(valuesSpecs, 8, "Assets/DxR/Resources/cars_subsampled.json");
        }

        public string GetDataName()
        {
            return data_name;
        }

        private void SubsampleData(JSONNode data, int samplingRate, string outputName)
        {
            JSONArray output = new JSONArray();
            int counter = 0;
            foreach (JSONNode value in data.Children)
            {
                if (counter % 8 == 0)
                {
                    output.Add(value);
                }
                counter++;
            }

            System.IO.File.WriteAllText(outputName, output.ToString());
        }

        private void CreateDataFields(JSONNode valuesSpecs, ref Data data)
        {
            data.fieldNames = new List<string>();
            foreach (KeyValuePair<string, JSONNode> kvp in valuesSpecs[0].AsObject)
            {
                data.fieldNames.Add(kvp.Key);

                if (verbose)
                {
                    Debug.Log("Reading data field: " + kvp.Key);
                }
            }
        }

        private void UpdateVisConfig()
        {
            if (visSpecs["title"] != null)
            {
                title = visSpecs["title"].Value;
            }

            if (visSpecs["width"] == null)
            {
                visSpecs.Add("width", new JSONNumber(DEFAULT_VIS_DIMS));
                width = visSpecs["width"].AsFloat;
            } else
            {
                width = visSpecs["width"].AsFloat;
            }

            if (visSpecs["height"] == null)
            {
                visSpecs.Add("height", new JSONNumber(DEFAULT_VIS_DIMS));
                height = visSpecs["height"].AsFloat;
            }
            else
            {
                height = visSpecs["height"].AsFloat;
            }

            if (visSpecs["depth"] == null)
            {
                visSpecs.Add("depth", new JSONNumber(DEFAULT_VIS_DIMS));
                depth = visSpecs["depth"].AsFloat;
            }
            else
            {
                depth = visSpecs["depth"].AsFloat;
            }
        }

        public void DeleteAll()
        {
            foreach (Transform child in guidesParentObject.transform)
            {
                GameObject.Destroy(child.gameObject);
            }

            foreach (Transform child in marksParentObject.transform)
            {
                GameObject.Destroy(child.gameObject);
            }

            foreach (Transform child in interactionsParentObject.transform)
            {
                GameObject.Destroy(child.gameObject);
            }
            //gameObject.transform.Find("DxRView");


            foreach (Transform child in parentObject.transform)
            {
                //child 중 mark만 지워야함
                if (!child.gameObject.CompareTag("DxRView") && !child.gameObject.CompareTag("DxRAnchor") && !child.gameObject.CompareTag("DxRMeshLine") && !child.gameObject.CompareTag("DxRInteractions"))
                    GameObject.Destroy(child.gameObject);

            }

            //foreach(Transform child in worldView.transform)
            //{
            //    GameObject.Destroy(child.gameObject);
            //}

            if (mesh != null)
            {
                Destroy(mesh);
            }

            //Destroy(parentObject);

            // TODO: Do not delete, but only update:
            //foreach (Transform child in interactionsParentObject.transform)
            //{
            //    GameObject.Destroy(child.gameObject);
            //}
        }


        /*
        private void InitGUI()
        {
            Transform guiTransform = parentObject.transform.Find("DxRGUI");
            GameObject guiObject = guiTransform.gameObject;
            gui = guiObject.GetComponent<GUI>();
            gui.Init(this);

            if (!enableGUI && guiObject != null)
            {
                guiObject.SetActive(false);
            }
        }*/
        /*
        private void UpdateGUISpecsFromVisSpecs()
        {
            gui.UpdateGUISpecsFromVisSpecs();
        }
        */
        /*
        public void UpdateVisSpecsFromGUISpecs()
        {
            // For now, just reset the vis specs to empty and
            // copy the contents of the text to vis specs; starting
            // everything from scratch. Later on, the new specs will have
            // to be compared with the current specs to get a list of what 
            // needs to be updated and only this list will be acted on.

            JSONNode guiSpecs = JSON.Parse(gui.GetGUIVisSpecs().ToString());


            // Remove data values so that parsing can put them again. 
            // TODO: Optimize this.
            if (guiSpecs["data"]["url"] != null)
            {
                if(guiSpecs["data"]["url"] != "inline")
                {
                    guiSpecs["data"].Remove("values");
                    visSpecs["data"].Remove("values");

                    visSpecs["data"]["url"] = guiSpecs["data"]["url"];
                }
            }

            visSpecs["mark"] = guiSpecs["mark"];

            Debug.Log("GUI SPECS: " + guiSpecs.ToString());

            // UPDATE CHANNELS:

            // Go through vis specs and UPDATE fields and types of non-value channels
            // that are in the gui specs.
            List<string> channelsToUpdate = new List<string>();
            foreach (KeyValuePair<string, JSONNode> kvp in visSpecs["encoding"].AsObject)
            {
                string channelName = kvp.Key;
                if(visSpecs["encoding"][channelName]["value"] == null && guiSpecs["encoding"][channelName] != null)
                {
                    channelsToUpdate.Add(channelName);
                }
            }

            foreach(string channelName in channelsToUpdate)
            {
                visSpecs["encoding"][channelName]["field"] = guiSpecs["encoding"][channelName]["field"];
                visSpecs["encoding"][channelName]["type"] = guiSpecs["encoding"][channelName]["type"];
            }

            // Go through vis specs and DELETE non-field channels that are not in gui specs.
            List<string> channelsToDelete = new List<string>();
            foreach (KeyValuePair<string, JSONNode> kvp in visSpecs["encoding"].AsObject)
            {
                string channelName = kvp.Key;
                if (visSpecs["encoding"][channelName]["value"] == null && guiSpecs["encoding"][channelName] == null)
                {
                    channelsToDelete.Add(channelName);
                }
            }

            foreach (string channelName in channelsToDelete)
            {
                visSpecs["encoding"].Remove(channelName);
            }

            // Go through gui specs and ADD non-field channels in gui specs that are not in vis specs.
            foreach (KeyValuePair<string, JSONNode> kvp in guiSpecs["encoding"].AsObject)
            {
                string channelName = kvp.Key;
                Debug.Log("Testing channel " + channelName);
                
                if (guiSpecs["encoding"][channelName]["value"] == null && visSpecs["encoding"][channelName] == null)
                {
                    Debug.Log("Adding channel " + channelName);
                    visSpecs["encoding"].Add(channelName, guiSpecs["encoding"][channelName]);
                }
            }

            // UPDATE INTERACTIONS:
            // Go through vis specs and UPDATE fields and types of interactions
            // that are in the gui specs.
            List<string> fieldsToUpdate = new List<string>();
            foreach(JSONObject interactionSpecs in visSpecs["interaction"].AsArray)
            {
                string fieldName = interactionSpecs["field"];
                // If the field is in gui, it needs update:
                if(FieldIsInInteractionSpecs(guiSpecs["interaction"], fieldName))
                {
                    fieldsToUpdate.Add(fieldName);
                }
            }

            // Do the update:
            foreach (string fieldName in fieldsToUpdate)
            {
                visSpecs["interaction"][GetFieldIndexInInteractionSpecs(visSpecs["interaction"], fieldName)]["type"] = 
                    guiSpecs["interaction"][GetFieldIndexInInteractionSpecs(visSpecs["interaction"], fieldName)]["type"];
            }

            // Go through vis specs and DELETE interactions for fields that are not in gui specs.
            List<string> fieldsToDelete = new List<string>();
            foreach (JSONObject interactionSpecs in visSpecs["interaction"].AsArray)
            {
                string fieldName = interactionSpecs["field"];
                if (!FieldIsInInteractionSpecs(guiSpecs["interaction"], fieldName))
                {
                    fieldsToDelete.Add(fieldName);
                }
            }

            foreach (string fieldName in fieldsToDelete)
            {
                visSpecs["interaction"].Remove(GetFieldIndexInInteractionSpecs(visSpecs["interaction"], fieldName));
            }

            // Go through gui specs and ADD interaction for fields in gui specs that are not in vis specs.
            foreach (JSONObject interactionSpecs in guiSpecs["interaction"].AsArray)
            {
                string fieldName = interactionSpecs["field"].Value;

                if (!FieldIsInInteractionSpecs(visSpecs["interaction"], fieldName))
                {
                    Debug.Log("Adding interaction for field " + fieldName);
                    visSpecs["interaction"].Add(guiSpecs["interaction"][GetFieldIndexInInteractionSpecs(guiSpecs["interaction"], fieldName)]);
                }
            }

            UpdateTextSpecsFromVisSpecs();
            UpdateVis();
        }*/

        private int GetFieldIndexInInteractionSpecs(JSONNode interactionSpecs, string searchFieldName)
        {
            int index = 0;
            foreach (JSONObject interactionObject in interactionSpecs.AsArray)
            {
                string fieldName = interactionObject["field"];
                if (fieldName == searchFieldName)
                {
                    return index;
                }
                index++;
            }
            return -1;
        }

        private bool FieldIsInInteractionSpecs(JSONNode interactionSpecs, string searchFieldName)
        {
            foreach (JSONObject interactionObject in interactionSpecs.AsArray)
            {
                string fieldName = interactionObject["field"];
                if(fieldName == searchFieldName)
                {
                    return true;
                }
            }
            return false;
        }

        private void InitDataList()
        {
            string[] dirs = Directory.GetFiles(Application.dataPath + "/StreamingAssets/DxRData");
            dataList = new List<string>();
            dataList.Add(DxR.Vis.UNDEFINED);
            dataList.Add("inline");
            for (int i = 0; i < dirs.Length; i++)
            {
                if (Path.GetExtension(dirs[i]) != ".meta")
                {
                    dataList.Add(Path.GetFileName(dirs[i]));
                }
            }
        }

        public List<string> GetDataList()
        {
            return dataList;
        }

        private void InitMarksList()
        {
            marksList = new List<string>();
            marksList.Add(DxR.Vis.UNDEFINED);
            
            TextAsset marksListTextAsset = (TextAsset)Resources.Load("Marks/marks", typeof(TextAsset));
            if (marksListTextAsset != null)
            {
                JSONNode marksListObject = JSON.Parse(marksListTextAsset.text);
                for (int i = 0; i < marksListObject["marks"].AsArray.Count; i++)
                {
                    string markNameLowerCase = marksListObject["marks"][i].Value.ToString().ToLower();
                    GameObject markPrefabResult = Resources.Load("Marks/" + markNameLowerCase + "/" + markNameLowerCase) as GameObject;

                    if (markPrefabResult != null)
                    {
                        marksList.Add(markNameLowerCase);
                    }
                }
            }
            else
            {
                throw new System.Exception("Cannot find marks.json file in Assets/DxR/Resources/Marks/ directory");
            }

#if UNITY_EDITOR
            string[] dirs = Directory.GetFiles("Assets/DxR/Resources/Marks");
            for (int i = 0; i < dirs.Length; i++)
            {
                if (Path.GetExtension(dirs[i]) != ".meta" && Path.GetExtension(dirs[i]) != ".json" 
                    && !marksList.Contains(Path.GetFileName(dirs[i])))
                {
                    marksList.Add(Path.GetFileName(dirs[i]));
                }
            }
#endif

            if (!marksList.Contains(visSpecs["mark"].Value.ToString()))
            {
                marksList.Add(visSpecs["mark"].Value.ToString());
            }
        }

        public List<string> GetMarksList()
        {
            return marksList;
        }

        public void UpdateVisSpecsFromTextSpecs()
        {
            // For now, just reset the vis specs to empty and
            // copy the contents of the text to vis specs; starting
            // everything from scratch. Later on, the new specs will have
            // to be compared with the current specs to get a list of what 
            // needs to be updated and only this list will be acted on.

            JSONNode textSpecs;
            parser.Parse(visSpecsURL, out textSpecs);

            visSpecs = textSpecs;

            //gui.UpdateGUISpecsFromVisSpecs();
            UpdateVis();
        }

        public void UpdateTextSpecsFromVisSpecs()
        {
            JSONNode visSpecsToWrite = JSON.Parse(visSpecs.ToString());
            if(visSpecs["data"]["url"] != null && visSpecs["data"]["url"] != "inline")
            {
                visSpecsToWrite["data"].Remove("values");
            }

            if(visSpecs["interaction"].AsArray.Count == 0)
            {
                visSpecsToWrite.Remove("interaction");
            }

#if UNITY_EDITOR
            System.IO.File.WriteAllText(Parser.GetFullSpecsPath(visSpecsURL), visSpecsToWrite.ToString(2));
#else

            UnityEngine.Windows.File.WriteAllBytes(Parser.GetFullSpecsPath(visSpecsURL),
                System.Text.Encoding.UTF8.GetBytes(visSpecsToWrite.ToString(2)));
#endif
        }

        public List<string> GetChannelsList(string markName)
        {
            GameObject markObject = LoadMarkPrefab(markName);
            return markObject.GetComponent<Mark>().GetChannelsList();
        }

        public void Rescale(float scaleFactor)
        {
            viewParentObject.transform.localScale = Vector3.Scale(viewParentObject.transform.localScale, 
                new Vector3(scaleFactor, scaleFactor, scaleFactor));
        }

        public void ResetView()
        {
            viewParentObject.transform.localScale = new Vector3(1, 1, 1);
            viewParentObject.transform.localEulerAngles = new Vector3(0, 0, 0);
            viewParentObject.transform.localPosition = new Vector3(0, 0, 0);
        }

        public void RotateAroundCenter(Vector3 rotationAxis, float angleDegrees)
        {
            Vector3 center = viewParentObject.transform.parent.transform.position + 
                new Vector3(width * SIZE_UNIT_SCALE_FACTOR / 2.0f, height * SIZE_UNIT_SCALE_FACTOR / 2.0f, 
                depth * SIZE_UNIT_SCALE_FACTOR / 2.0f);
            viewParentObject.transform.RotateAround(center, rotationAxis, angleDegrees);
        }

        
        // Update the visibility of each mark according to the filters results:
        internal void FiltersUpdated()
        {

            if (interactionsParentObject != null)
            {
                ShowAllMarks();

                foreach (KeyValuePair<string,List<bool>> filterResult in interactionsParentObject.GetComponent<Interactions>().filterResults)
                {
                    List<bool> visib = filterResult.Value;
                    for (int m = 0; m < markInstances.Count; m++)
                    {
                        markInstances[m].SetActive(visib[m] && markInstances[m].activeSelf);
                    }
                }
            }
        }

        void ShowAllMarks()
        {
            for (int m = 0; m < markInstances.Count; m++)
            {
                markInstances[m].SetActive(true);
            }
        }

        public Vector3 GetVisSize()
        {
            return new Vector3(width, height, depth);
        }
        //private void InitServer()
        //{
        //    //Transform guiTransform = parentObject.transform.Find("DxRGUI");
        //    //GameObject guiObject = guiTransform.gameObject;
        //    server = GetComponent<Server>();
        //    server.Init(this);

        //}

        public void UpdateVisSpecsFromServer()
        {
            visSpecs = JSON.Parse(server.GetServerVisSpecs().ToString());
            //text.text = visSpecs.ToString();
            
            UpdateVis();


            var linkType = visSpecs["link"]["type"];
            if (linkType != "none")
            {
                rotationConst[0] = false;
                rotationConst[1] = false;
                rotationConst[2] = false;

                if (linkType == "object-link")
                {
                    var id = visSpecs["link"]["value"];
                    var visList = gv.VisList;
                    LinkTargetVis=null;
                    for (int i = 0; i < visList.Count; i++)
                    {
                        var visSpec = visList[i].GetVisSpecs();
                        if ((string)(visSpec["id"]) == (string)(id))
                        {
                            LinkTargetVis =  visList[i];
                            break;
                        }
                    }
                    if (LinkTargetVis==null)
                    {
                        return;
                    }

                    posOffset.Set(LinkTargetVis.transform.position.x, LinkTargetVis.transform.position.y, LinkTargetVis.transform.position.z);
                }
                if (linkType == "axis-link")
                {
                    var id = visSpecs["link"]["value"];
                    var visList = gv.VisList;
                    LinkTargetVis = null;
                    for (int i = 0; i < visList.Count; i++)
                    {
                        var visSpec = visList[i].GetVisSpecs();
                        if ((string)(visSpec["id"]) == (string)(id))
                        {
                            LinkTargetVis =  visList[i];
                            break;
                        }
                    }
                    if (LinkTargetVis==null)
                    {
                        return;
                    }

                    indLinkedAxis[0] = -1;
                    indLinkedAxis[1] = -1;
                    indLinkedAxis[2] = -1;

                    string[] LinkField = new string[3] { "none", "none", "none" };
                    int childLinkedCnt = 0;

                    if (LinkTargetVis.visSpecs["encoding"]["x"] != null)
                    {
                        childLinkedCnt++;
                    }
                    if (LinkTargetVis.visSpecs["encoding"]["y"] != null)
                    {
                        childLinkedCnt++;
                    }
                    if (LinkTargetVis.visSpecs["encoding"]["z"] != null)
                    {
                        childLinkedCnt++;
                    }


                    if (LinkTargetVis.visSpecs["encoding"]["x"] != null)
                    {
                        for (int i = 0; i<childLinkedCnt; i++)
                        {
                            if (LinkTargetVis.guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.y == 0 && LinkTargetVis.guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.z == 0)
                            {
                                indLinkedAxis[0] = i;
                                break;
                            }
                        }
                        LinkField[0] = LinkTargetVis.visSpecs["encoding"]["x"]["field"];
                    }
                    if (LinkTargetVis.visSpecs["encoding"]["y"] != null)
                    {
                        for (int i = 0; i<childLinkedCnt; i++)
                        {
                            if (LinkTargetVis.guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.z != 0)
                            {
                                indLinkedAxis[1] = i;
                                break;
                            }
                        }
                        LinkField[1] = LinkTargetVis.visSpecs["encoding"]["y"]["field"];
                    }
                    if (LinkTargetVis.visSpecs["encoding"]["z"] != null)
                    {
                        for (int i = 0; i<childLinkedCnt; i++)
                        {
                            if (LinkTargetVis.guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.y != 0)
                            {
                                indLinkedAxis[2] = i;
                                break;
                            }
                        }
                        LinkField[2] = LinkTargetVis.visSpecs["encoding"]["z"]["field"];
                    }

                    int childCnt = 0;
                    if (visSpecs["encoding"]["x"] != null)
                    {
                        childCnt++;
                    }
                    if (visSpecs["encoding"]["y"] != null)
                    {
                        childCnt++;
                    }
                    if (visSpecs["encoding"]["z"] != null)
                    {
                        childCnt++;
                    }



                    indAxis[0] = -1;
                    indAxis[1] = -1;
                    indAxis[2] = -1;

                    // x axis
                    if (visSpecs["encoding"]["x"] != null)
                    {
                        for (int i = 0; i<childCnt; i++)
                        {
                            if (guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.y == 0 && guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.z == 0)
                            {
                                indAxis[0] = i;
                                break;
                            }
                        }
                        var x_field = visSpecs["encoding"]["x"]["field"];
                        for (int i = 0; i < 3; i++)
                        {
                            if (indLinkedAxis[i]==-1) continue;
                            if (x_field == LinkField[i])
                            {
                                rotationConst[0] = true;
                                linkedAxis[0] = i;

                                Transform tarTransform = LinkTargetVis.guidesParentObject.transform.GetChild(indLinkedAxis[linkedAxis[0]]);
                                Transform depTransform = guidesParentObject.transform.GetChild(indAxis[0]);

                                //parentObject.transform.position = parentObject.transform.position + (tarTransform.position - depTransform.position);
                                parentObject.transform.position = LinkTargetVis.transform.position;
                                Quaternion t1 = new Quaternion();
                                //axis의 roation 정보
                                t1.SetFromToRotation(depTransform.right, tarTransform.right);
                                transform.rotation = t1 * parentObject.transform.rotation;
                                if (linkedAxis[0]==0)
                                {
                                    transform.rotation = Quaternion.Euler(90, 0, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[0]==1)
                                {
                                    transform.rotation = Quaternion.Euler(0, -90, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[0]==2)
                                {
                                    transform.rotation = Quaternion.Euler(0, 0, 90) * parentObject.transform.rotation;
                                }


                                LinkField[i] = "none";
                                break;
                            }
                        }
                    }

                    // y axis
                    if (visSpecs["encoding"]["y"] != null)
                    {
                        for (int i = 0; i<childCnt; i++)
                        {
                            if (guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.z != 0)
                            {
                                indAxis[1] = i;
                                break;
                            }
                        }

                        var y_field = visSpecs["encoding"]["y"]["field"];
                        for (int i = 0; i < 3; i++)
                        {
                            if (indLinkedAxis[i]==-1) continue;
                            if (y_field == LinkField[i])
                            {

                                rotationConst[1] = true;
                                linkedAxis[1] = i;

                                Transform tarTransform = LinkTargetVis.guidesParentObject.transform.GetChild(indLinkedAxis[linkedAxis[1]]);
                                Transform depTransform = guidesParentObject.transform.GetChild(indAxis[1]);

                                //parentObject.transform.position = parentObject.transform.position + (tarTransform.position - depTransform.position);
                                parentObject.transform.position = LinkTargetVis.transform.position;
                                Quaternion t1 = new Quaternion();
                                //axis의 roation 정보
                                t1.SetFromToRotation(depTransform.right, tarTransform.right);
                                transform.rotation = t1 * parentObject.transform.rotation;
                                if (linkedAxis[1]==0)
                                {
                                    transform.rotation = Quaternion.Euler(90, 0, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[1]==1)
                                {
                                    transform.rotation = Quaternion.Euler(0, -90, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[1]==2)
                                {
                                    transform.rotation = Quaternion.Euler(0, 0, 90) * parentObject.transform.rotation;
                                }
                                LinkField[i] = "none";
                                break;
                            }
                        }
                    }

                    if (visSpecs["encoding"]["z"] != null)
                    {
                        for (int i = 0; i<childCnt; i++)
                        {
                            if (guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.y != 0)
                            {
                                indAxis[2] = i;
                                break;
                            }
                        }

                        var z_field = visSpecs["encoding"]["z"]["field"];
                        for (int i = 0; i < 3; i++)
                        {
                            if (z_field == LinkField[i])
                            {
                                rotationConst[2] = true;
                                linkedAxis[2] = i;

                                Transform tarTransform = LinkTargetVis.guidesParentObject.transform.GetChild(indLinkedAxis[linkedAxis[2]]);
                                Transform depTransform = guidesParentObject.transform.GetChild(indAxis[2]);

                                //parentObject.transform.position = parentObject.transform.position + (tarTransform.position - depTransform.position);
                                parentObject.transform.position = LinkTargetVis.transform.position;
                                Quaternion t1 = new Quaternion();
                                //axis의 roation 정보
                                t1.SetFromToRotation(depTransform.right, tarTransform.right);
                                transform.rotation = t1 * parentObject.transform.rotation;
                                if (linkedAxis[2]==0)
                                {
                                    transform.rotation = Quaternion.Euler(90, 0, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[2]==1)
                                {
                                    transform.rotation = Quaternion.Euler(0, -90, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[2]==2)
                                {
                                    transform.rotation = Quaternion.Euler(0, 0, 90) * parentObject.transform.rotation;
                                }
                                LinkField[i] = "none";
                                break;
                            }
                        }
                    }

                }
                if (linkType == "value")
                {
                    string pos = visSpecs["link"]["value"];
                    
                    string[] words = pos.Split('_');
                    float[] position = new float[3];
                    for (int i = 0; i < words.Length; i++)
                    {
                        position[i] = float.Parse(words[i]);
                    }
                    posOffset = new Vector3(position[0], position[1], -1 * position[2]);

                }


                //server.updateServerVisSpec = false;
            }


            //server.updateServerVisSpec = false;
        }


        public void unlinkVIS()
        {
            visSpecs["link"]["type"] = "none";
        }

        public string getLinkType()
        {
            return visSpecs["link"]["type"];
        }

        public void UpdateVisSpecsFromButton()
        {
            var linkType = visSpecs["link"]["type"];
            if (linkType != "none")
            {
                rotationConst[0] = false;
                rotationConst[1] = false;
                rotationConst[2] = false;
                if (linkType == "object-link")
                {
                    var id = visSpecs["link"]["value"];
                    LinkTargetVis = GameObject.Find("DxRVis").GetComponent<Vis>();
                    if (LinkTargetVis==null)
                    {
                        return;
                    }
                    posOffset.Set(LinkTargetVis.transform.position.x, LinkTargetVis.transform.position.y, LinkTargetVis.transform.position.z);
                }
                if (linkType == "axis-link")
                {
                    var id = visSpecs["link"]["value"];
                    LinkTargetVis = LinkTargetVis = GameObject.Find("DxRVis").GetComponent<Vis>();
                    if (LinkTargetVis==null)
                    {
                        return;
                    }

                    indLinkedAxis[0] = -1;
                    indLinkedAxis[1] = -1;
                    indLinkedAxis[2] = -1;

                    string[] LinkField = new string[3] { "none", "none", "none" };
                    int childLinkedCnt = 0;

                    if (LinkTargetVis.visSpecs["encoding"]["x"] != null)
                    {
                        childLinkedCnt++;
                    }
                    if (LinkTargetVis.visSpecs["encoding"]["y"] != null)
                    {
                        childLinkedCnt++;
                    }
                    if (LinkTargetVis.visSpecs["encoding"]["z"] != null)
                    {
                        childLinkedCnt++;
                    }


                    if (LinkTargetVis.visSpecs["encoding"]["x"] != null)
                    {
                        for(int i = 0; i<childLinkedCnt; i++)
                        {
                            if (LinkTargetVis.guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.y == 0 && LinkTargetVis.guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.z == 0)
                            {
                                indLinkedAxis[0] = i;
                                break;
                            }
                        }
                        LinkField[0] = LinkTargetVis.visSpecs["encoding"]["x"]["field"];
                    }
                    if (LinkTargetVis.visSpecs["encoding"]["y"] != null)
                    {
                        for (int i = 0; i<childLinkedCnt; i++)
                        {
                            if (LinkTargetVis.guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.z != 0)
                            {
                                indLinkedAxis[1] = i;
                                break;
                            }
                        }
                        LinkField[1] = LinkTargetVis.visSpecs["encoding"]["y"]["field"];
                    }
                    if (LinkTargetVis.visSpecs["encoding"]["z"] != null)
                    {
                        for (int i = 0; i<childLinkedCnt; i++)
                        {
                            if (LinkTargetVis.guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.y != 0)
                            {
                                indLinkedAxis[2] = i;
                                break;
                            }
                        }
                        LinkField[2] = LinkTargetVis.visSpecs["encoding"]["z"]["field"];
                    }

                    int childCnt = 0;
                    if (visSpecs["encoding"]["x"] != null)
                    {
                        childCnt++;
                    }
                    if (visSpecs["encoding"]["y"] != null)
                    {
                        childCnt++;
                    }
                    if (visSpecs["encoding"]["z"] != null)
                    {
                        childCnt++;
                    }



                    indAxis[0] = -1;
                    indAxis[1] = -1;
                    indAxis[2] = -1;

                    // x axis
                    if (visSpecs["encoding"]["x"] != null)
                    {
                        for (int i = 0; i<childCnt; i++)
                        {
                            if (guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.y == 0 && guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.z == 0)
                            {
                                indAxis[0] = i;
                                break;
                            }
                        }
                        var x_field = visSpecs["encoding"]["x"]["field"];
                        for (int i = 0; i < 3; i++)
                        {
                            if (indLinkedAxis[i]==-1) continue;
                            if (x_field == LinkField[i])
                            {
                                rotationConst[0] = true;
                                linkedAxis[0] = i;

                                Transform tarTransform = LinkTargetVis.guidesParentObject.transform.GetChild(indLinkedAxis[linkedAxis[0]]);
                                Transform depTransform = guidesParentObject.transform.GetChild(indAxis[0]);

                                //parentObject.transform.position = parentObject.transform.position + (tarTransform.position - depTransform.position);
                                parentObject.transform.position = LinkTargetVis.transform.position;
                                Quaternion t1 = new Quaternion();
                                //axis의 roation 정보
                                t1.SetFromToRotation(depTransform.right, tarTransform.right);
                                transform.rotation = t1 * parentObject.transform.rotation;
                                if (linkedAxis[0]==0)
                                {
                                    transform.rotation = Quaternion.Euler(90, 0, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[0]==1)
                                {
                                    transform.rotation = Quaternion.Euler(0, -90, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[0]==2)
                                {
                                    transform.rotation = Quaternion.Euler(0, 0, 90) * parentObject.transform.rotation;
                                }


                                LinkField[i] = "none";
                                break;
                            }
                        }
                    }

                    // y axis
                    if (visSpecs["encoding"]["y"] != null)
                    {
                        for (int i = 0; i<childCnt; i++)
                        {
                            if (guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.z != 0)
                            {
                                indAxis[1] = i;
                                break;
                            }
                        }

                        var y_field = visSpecs["encoding"]["y"]["field"];
                        for (int i = 0; i < 3; i++)
                        {
                            if (indLinkedAxis[i]==-1) continue;
                            if (y_field == LinkField[i])
                            {

                                rotationConst[1] = true;
                                linkedAxis[1] = i;

                                Transform tarTransform = LinkTargetVis.guidesParentObject.transform.GetChild(indLinkedAxis[linkedAxis[1]]);
                                Transform depTransform = guidesParentObject.transform.GetChild(indAxis[1]);

                                //parentObject.transform.position = parentObject.transform.position + (tarTransform.position - depTransform.position);
                                parentObject.transform.position = LinkTargetVis.transform.position;
                                Quaternion t1 = new Quaternion();
                                //axis의 roation 정보
                                t1.SetFromToRotation(depTransform.right, tarTransform.right);
                                transform.rotation = t1 * parentObject.transform.rotation;
                                if (linkedAxis[1]==0)
                                {
                                    transform.rotation = Quaternion.Euler(90, 0, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[1]==1)
                                {
                                    transform.rotation = Quaternion.Euler(0, -90, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[1]==2)
                                {
                                    transform.rotation = Quaternion.Euler(0, 0, 90) * parentObject.transform.rotation;
                                }
                                LinkField[i] = "none";
                                break;
                            }
                        }
                    }

                    if (visSpecs["encoding"]["z"] != null)
                    {
                        for (int i = 0; i<childCnt; i++)
                        {
                            if (guidesParentObject.transform.GetChild(i).localRotation.eulerAngles.y != 0)
                            {
                                indAxis[2] = i;
                                break;
                            }
                        }

                        var z_field = visSpecs["encoding"]["z"]["field"];
                        for (int i = 0; i < 3; i++)
                        {
                            if (z_field == LinkField[i])
                            {
                                rotationConst[2] = true;
                                linkedAxis[2] = i;

                                Transform tarTransform = LinkTargetVis.guidesParentObject.transform.GetChild(indLinkedAxis[linkedAxis[2]]);
                                Transform depTransform = guidesParentObject.transform.GetChild(indAxis[2]);

                                //parentObject.transform.position = parentObject.transform.position + (tarTransform.position - depTransform.position);
                                parentObject.transform.position = LinkTargetVis.transform.position;
                                Quaternion t1 = new Quaternion();
                                //axis의 roation 정보
                                t1.SetFromToRotation(depTransform.right, tarTransform.right);
                                transform.rotation = t1 * parentObject.transform.rotation;
                                if (linkedAxis[2]==0)
                                {
                                    transform.rotation = Quaternion.Euler(90, 0, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[2]==1)
                                {
                                    transform.rotation = Quaternion.Euler(0, -90, 0) * parentObject.transform.rotation;
                                }
                                else if (linkedAxis[2]==2)
                                {
                                    transform.rotation = Quaternion.Euler(0, 0, 90) * parentObject.transform.rotation;
                                }
                                LinkField[i] = "none";
                                break;
                            }
                        }
                    }


                }
                if (linkType == "value")
                {
                    string pos = visSpecs["link"]["value"];
                    string[] words = pos.Split('_');
                    float[] position = new float[3];
                    for (int i = 0; i < words.Length; i++)
                    {
                        position[i] = float.Parse(words[i]);
                    }
                    posOffset = new Vector3(position[0], position[1], -1 * position[2]);
                }
            }



            //server.updateServerVisSpec = false;
        }

    }

    

}

