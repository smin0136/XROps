using System;
using System.Collections;
using System.Collections.Generic;
using System.Drawing.Text;
using System.Runtime.InteropServices.WindowsRuntime;
using Microsoft.MixedReality.Toolkit;
using Microsoft.MixedReality.Toolkit.Examples.Demos;
using Microsoft.MixedReality.Toolkit.UI;
using Microsoft.MixedReality.Toolkit.Utilities;
using SimpleJSON;
using TMPro;
using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;
using UnityEngine.UIElements;


namespace DxR
{
    public class Interactions : MonoBehaviour
    {
        // Y offset for placement of filter objects.
        float curYOffset = 0;

        Vis targetVis = null;
        // Each data field's filter result. Each list is the same as the number of 
        // mark instances.
        public Dictionary<string, List<bool>> filterResults = null;

        Dictionary<string, List<string>> domains = null;

        private GameObject[] DxRVisObjects = null;


        // Use this for initialization
        void Start()
        {

        }

        // Update is called once per frame
        void Update()
        {

        }

        public void Init(Vis vis)
        {
            targetVis = vis;
            curYOffset = 0;

            if (targetVis != null)
            {
                if (targetVis.GetIsLinked())
                {
                    DxRVisObjects = GameObject.FindGameObjectsWithTag("DxRVis");         //Collect vis objects
                }
                filterResults = new Dictionary<string, List<bool>>();
                domains = new Dictionary<string, List<string>>();
            }
        }

        public void EnableLegendToggleFilter(GameObject legendGameObject)
        {
            //HoloToolkit.Examples.InteractiveElements.InteractiveSet checkBoxSet =
            //   legendGameObject.GetComponent<HoloToolkit.Examples.InteractiveElements.InteractiveSet>();

            //Interactable checkBoxSet = legendGameObject.GetComponent<Interactable>();
            //InteractableToggleCollection checkBoxSet = legendGameObject.GetComponent<InteractableToggleCollection>();

            //if (checkBoxSet == null) return;
            //checkBoxSet.SelectedIndices.Clear();

            string fieldName = "";
            List<string> domain = new List<string>();

            // Go through each checkbox and set them to active:
            //int checkBoxIndex = 0;
            for (int i = 0; i < legendGameObject.transform.childCount; i++)
            {
                Transform child = legendGameObject.transform.GetChild(i);
                if (child.GetComponent<LegendValue>() != null)
                {

                    fieldName = child.GetComponent<LegendValue>().dataFieldName;
                    domain.Add(child.GetComponent<LegendValue>().categoryName);

                    Transform box = child.Find("Title/CheckBox");

                    if (box != null)
                    {

                        box.gameObject.SetActive(true);
                        //HoloToolkit.Examples.InteractiveElements.InteractiveToggle toggle =
                        //    box.gameObject.GetComponent<HoloToolkit.Examples.InteractiveElements.InteractiveToggle>();
                        //var toggle = checkBoxSet.AddReceiver<InteractableOnToggleReceiver>();
                        Interactable toggle = box.gameObject.GetComponent<Interactable>();
                        //toggle.AddReceiver<InteractableOnToggleReceiver>();
                        /*
                        if (toggle != null)
                        {
                            checkBoxSet.Interactives.Add(toggle);
                            checkBoxSet.SelectedIndices.Add(checkBoxIndex);
                            checkBoxIndex++;
                        }*/
                        

                        if (toggle != null)
                        {
                            //toggle.IsEnabled = true;
                            toggle.OnClick.AddListener(delegate { LegendToggleFilterUpdated(legendGameObject); });                        

                            //var toggleReceiver = toggle.AddReceiver<InteractableOnToggleReceiver>();
                            //toggleReceiver.OnSelect.AddListener(LegendToggleFilterUpdated);
                            //toggle.OnClick.AddListener(() => Debug.Log("interactable clicked"));

                        }

                    }
                }
            }

            // Add the call back function to update marks visibility when any checkbox is updated.
            //checkBoxSet.OnSelectionEvents.AddListener(LegendToggleFilterUpdated);

            //checkBoxSet.OnSelect.AddListener(LegendToggleFilterUpdated);
            //checkBoxSet.OnClick.AddListener(LegendToggleFilterUpdated);


            domains.Add(fieldName, domain);

            // Update the results vector
            int numMarks = targetVis.markInstances.Count;
            List<bool> results = new List<bool>(new bool[numMarks]);
            for (int j = 0; j < results.Count; j++)
            {
                results[j] = true;
            }
            filterResults.Add(fieldName, results);
            //Debug.Log(filterResults[fieldName][0].ToString());

        }



        private void LegendToggleFilterUpdated(GameObject legendGameObject)
        {

            /*
            Debug.Log("youhave");
            if (EventSystem.current.currentSelectedGameObject == null) return;

            Debug.Log("youhave1");

            // If the selected object is not a check box, ignore.
            if (EventSystem.current.currentSelectedGameObject.transform.Find("CheckBoxContent") == null) return;
            Debug.Log("youhave2");

            GameObject selectedCheckBox = EventSystem.current.currentSelectedGameObject;
            
            Interactions interactions = selectedCheckBox.GetComponent<Interactions>();

            if (selectedCheckBox != null && interactions.targetVis != null)
            {
                Debug.Log("youhave3");

                string fieldName = selectedCheckBox.transform.parent.transform.parent.GetComponent<LegendValue>().dataFieldName;
                string categoryName = selectedCheckBox.transform.parent.transform.parent.GetComponent<LegendValue>().categoryName;

                GameObject legendGameObject = selectedCheckBox.transform.parent.transform.parent.transform.parent.gameObject;

                // Update filter results for toggled data field category.
                interactions.UpdateFilterResultsForCategoryFromLegend(legendGameObject, fieldName, categoryName);


                interactions.targetVis.FiltersUpdated();
                Debug.Log("Filter updated for " + fieldName);
            } */
            for (int i = 0; i < legendGameObject.transform.childCount; i++)
            {

                Transform child = legendGameObject.transform.GetChild(i);

                if (child.GetComponent<LegendValue>() != null)
                {
                    Transform box = child.Find("Title/CheckBox");

                    string fieldName = box.transform.parent.transform.parent.GetComponent<LegendValue>().dataFieldName;
                    string categoryName = box.transform.parent.transform.parent.GetComponent<LegendValue>().categoryName;

                    //Interactions interactions = box.GetComponent<Interactions>();
                    //Debug.Log(interactions.filterResults.Count);

                    // Update filter results for toggled data field category.
                    UpdateFilterResultsForCategoryFromLegend(legendGameObject, fieldName, categoryName);
                    targetVis.FiltersUpdated();

                    break;
                }
            }

        }

        private void UpdateFilterResultsForCategoryFromLegend(GameObject legendObject, string field, string category)
        {

            if (legendObject == null) return;

            List<string> visibleCategories = new List<string>();
            for (int i = 0; i < legendObject.transform.childCount; i++)
            {
                LegendValue legendValue = legendObject.transform.GetChild(i).gameObject.GetComponent<LegendValue>();
                if (legendValue != null)
                {
                    Transform box = legendObject.transform.GetChild(i).Find("Title/CheckBox");
                    //HoloToolkit.Examples.InteractiveElements.InteractiveToggle toggle = 
                    //        box.gameObject.GetComponent<HoloToolkit.Examples.InteractiveElements.InteractiveToggle>();
                    //how
                    var toggle = box.gameObject.GetComponent<Interactable>();

                    if (toggle.IsToggled)
                    {

                        visibleCategories.Add(legendValue.categoryName);
                    }

                    // BUG: HasSelection is not up-to-date upon calling this function!!!
                    //if (toggle.HasSelection)
                    //{
                    //    visibleCategories.Add(legendValue.categoryName);
                    //}
                }
            }

            Debug.Log("Updating filter results for field, category " + field + ", " + category);

            List<bool> res = filterResults[field];
            for (int b = 0; b < res.Count; b++)
            {
                if (visibleCategories.Contains(targetVis.markInstances[b].GetComponent<Mark>().datum[field]))
                {
                    res[b] = true;
                }
                else
                {
                    res[b] = false;
                }
            }

            filterResults[field] = res;

            if (targetVis.GetIsLinked())
            {
                for (int i = 0; i < DxRVisObjects.Length; i++)
                {
                    if (DxRVisObjects[i].GetComponent<Vis>().GetIsLinked())
                    {
                        if (DxRVisObjects[i].GetComponent<Vis>().GetDataName() == targetVis.GetDataName())
                        {
                            GameObject DxRInteraction = DxRVisObjects[i].transform.Find("DxRInteractions").gameObject;
                            List<bool> t_res = new List<bool>(new bool[res.Count]);
                            if (!DxRInteraction.GetComponent<Interactions>().filterResults.ContainsKey(field))
                            {
                                DxRInteraction.GetComponent<Interactions>().filterResults.Add(field, t_res);
                            }
                            for (int b = 0; b < t_res.Count; b++)
                            {
                                if (visibleCategories.Contains(DxRVisObjects[i].GetComponent<Vis>().markInstances[b].GetComponent<Mark>().datum[field]))
                                {
                                    t_res[b] = true;
                                }
                                else
                                {
                                    t_res[b] = false;
                                }
                            }
                            DxRInteraction.GetComponent<Interactions>().filterResults[field] = t_res;
                            DxRVisObjects[i].GetComponent<Vis>().FiltersUpdated();
                        }
                    }
                }
            }

                        if (targetVis.GetIsLinked()) Synchronize(field);
        }



        internal void AddToggleFilter(JSONObject interactionSpecs)
        {
            
            
            if (gameObject.transform.Find(interactionSpecs["field"].Value) != null)
            {
                Debug.Log("Will not duplicate existing filter for field " + interactionSpecs["field"].Value);
                return;
            }
            

            GameObject toggleFilterPrefab = Resources.Load("GUI/ToggleFilter", typeof(GameObject)) as GameObject;
            if (toggleFilterPrefab == null) return;

            GameObject toggleFilterInstance = Instantiate(toggleFilterPrefab, gameObject.transform);

            toggleFilterInstance.transform.Find("ToggleFilterLabel").gameObject.GetComponent<TextMesh>().text =
                interactionSpecs["field"].Value + ":";

            toggleFilterInstance.name = interactionSpecs["field"];

            var collection = toggleFilterInstance.GetComponent<GridObjectCollection>();
            if (collection == null) return;

            // Use the provided domain of the data field to create check boxes.
            // For each checkbox, add it to the interactiveset object, and add it to the object
            // collection object and update the layout.
            GameObject checkBoxPrefab = Resources.Load("GUI/CheckBox", typeof(GameObject)) as GameObject;
            if (checkBoxPrefab == null) return;

            //Interactable checkBoxSet = checkBoxPrefab.GetComponent<Interactable>();
            //if (checkBoxSet == null) return;

            List<string> domain = new List<string>();

            //checkBoxSet.SelectedIndices.Clear();

            int i = 0;
            foreach (JSONNode category in interactionSpecs["domain"].AsArray)
            {
                GameObject checkBoxInstance = Instantiate(checkBoxPrefab, toggleFilterInstance.transform);

                Debug.Log("Creating toggle button for " + category.Value);
                //checkBoxInstance.transform.Find("IconAndText/Label").gameObject.GetComponent<TextMesh>().text = category.Value;
                checkBoxInstance.transform.Find("IconAndText/Label").gameObject.GetComponent<TextMeshPro>().text = category.Value;
                Interactable toggle = checkBoxInstance.GetComponent<Interactable>();

                if (toggle != null)
                {
                    //toggle.IsEnabled = true;
                    toggle.OnClick.AddListener(delegate { ToggleFilterUpdated(toggleFilterInstance); });

                    //var toggleReceiver = toggle.AddReceiver<InteractableOnToggleReceiver>();
                    //toggleReceiver.OnSelect.AddListener(LegendToggleFilterUpdated);
                    //toggle.OnClick.AddListener(() => Debug.Log("interactable clicked"));

                }

                domain.Add(category.Value);

                //checkBoxSet.Interactives.Add(checkBoxInstance.GetComponent<HoloToolkit.Examples.InteractiveElements.InteractiveToggle>());
                //checkBoxSet.SelectedIndices.Add(i);
                i++;
            }

            domains.Add(interactionSpecs["field"].Value, domain);

            int numRows = interactionSpecs["domain"].AsArray.Count + 1;
            collection.Rows = numRows;
            collection.CellHeight = 0.05f;
            collection.UpdateCollection();

            // Add the call back function to update marks visibility when any checkbox is updated.
            //checkBoxSet.OnSelectionEvents.AddListener(ToggleFilterUpdated);




            // Update the results vector
            int numMarks = targetVis.markInstances.Count;
            List<bool> results = new List<bool>(new bool[numMarks]);
            for (int j = 0; j < results.Count; j++)
            {
                results[j] = true;
            }
            filterResults.Add(interactionSpecs["field"], results);

            toggleFilterInstance.transform.Translate(0, -curYOffset / 2.0f, 0);
            curYOffset = curYOffset + (0.085f * numRows) + 0.1f;
            
        }

        void ToggleFilterUpdated(GameObject toggleFilterInstance)
        {


            for (int i = 0; i < toggleFilterInstance.transform.childCount; i++)
            {

                Transform child = toggleFilterInstance.transform.GetChild(i);

                if (child.GetComponent<Interactable>() != null)
                {

                    string fieldName = toggleFilterInstance.transform.name;
                    string categoryName = child.transform.Find("IconAndText/Label").gameObject.GetComponent<TextMeshPro>().text;

                    //Interactions interactions = box.GetComponent<Interactions>();
                    //Debug.Log(interactions.filterResults.Count);

                    // Update filter results for toggled data field category.
                    UpdateFilterResultsForCategory(toggleFilterInstance, fieldName, categoryName);
                    targetVis.FiltersUpdated();
                    Debug.Log("Filter updated! " + fieldName);
                    break;
                }
            }


            /*
            //if (EventSystem.current.currentSelectedGameObject == null) return;

            // If the selected object is not a check box, ignore.
            if (EventSystem.current.currentSelectedGameObject.transform.Find("CheckBoxContent") == null) return;

            GameObject selectedCheckBox = EventSystem.current.currentSelectedGameObject;
            if (selectedCheckBox != null && targetVis != null)
            {
                // Update filter results for toggled data field category.
                UpdateFilterResultsForCategory(selectedCheckBox.transform.parent.name, selectedCheckBox.transform.Find("IconAndText/Label").gameObject.GetComponent<TextMesh>().text);

                targetVis.FiltersUpdated();
                Debug.Log("Filter updated! " +
                EventSystem.current.currentSelectedGameObject.transform.parent.name);
            }*/
        }

        private void UpdateFilterResultsForCategory(GameObject toggleFilterInstance, string field, string category)
        {
            /*
            GameObject toggleFilter = gameObject.transform.Find(field).gameObject;
            if (toggleFilter == null) return;

            var checkBoxSet = toggleFilter.GetComponent<Interactable>();
            if (checkBoxSet == null) return;

            foreach (int checkedCategoryIndex in checkBoxSet.States)
            {
                visibleCategories.Add(domains[field][checkedCategoryIndex]);

                Debug.Log("showing index: " + checkedCategoryIndex.ToString() + (domains[field][checkedCategoryIndex]));
            }
            */


            if (toggleFilterInstance == null) return;

            int checkedCategoryIndex = 0;
            List<string> visibleCategories = new List<string>();
            for (int i = 0; i < toggleFilterInstance.transform.childCount; i++)
            {
                Interactable toggleBox = toggleFilterInstance.transform.GetChild(i).gameObject.GetComponent<Interactable>();
                if (toggleBox != null)
                {
                    Transform box = toggleFilterInstance.transform.GetChild(i);
                    //HoloToolkit.Examples.InteractiveElements.InteractiveToggle toggle = 
                    //        box.gameObject.GetComponent<HoloToolkit.Examples.InteractiveElements.InteractiveToggle>();
                    //how
                    var toggle = box.gameObject.GetComponent<Interactable>();

                    if (toggle.IsToggled)
                    {
                        visibleCategories.Add(domains[field][checkedCategoryIndex]);

                        Debug.Log("showing index: " + checkedCategoryIndex.ToString() + (domains[field][checkedCategoryIndex]));

                    }
                    checkedCategoryIndex++;

                }
            }







            Debug.Log("Updating filter results for field, category " + field + ", " + category);
            List<bool> res = filterResults[field];
            for (int b = 0; b < res.Count; b++)
            {
                if (visibleCategories.Contains(targetVis.markInstances[b].GetComponent<Mark>().datum[field]))
                {
                    res[b] = true;
                }
                else
                {
                    res[b] = false;
                }
            }

            filterResults[field] = res;

            if (targetVis.GetIsLinked())
            {
                for (int i = 0; i < DxRVisObjects.Length; i++)
                {
                    if (DxRVisObjects[i].GetComponent<Vis>().GetIsLinked())
                    {
                        if (DxRVisObjects[i].GetComponent<Vis>().GetDataName() == targetVis.GetDataName())
                        {
                            GameObject DxRInteraction = DxRVisObjects[i].transform.Find("DxRInteractions").gameObject;
                            List<bool> t_res = new List<bool>(new bool[res.Count]);
                            if (!DxRInteraction.GetComponent<Interactions>().filterResults.ContainsKey(field))
                            {
                                DxRInteraction.GetComponent<Interactions>().filterResults.Add(field, t_res);
                            }
                            for (int b = 0; b < t_res.Count; b++)
                            {
                                if (visibleCategories.Contains(DxRVisObjects[i].GetComponent<Vis>().markInstances[b].GetComponent<Mark>().datum[field]))
                                {
                                    t_res[b] = true;
                                }
                                else
                                {
                                    t_res[b] = false;
                                }
                            }
                            DxRInteraction.GetComponent<Interactions>().filterResults[field] = t_res;
                            DxRVisObjects[i].GetComponent<Vis>().FiltersUpdated();
                        }
                    }
                }
            }


                        if (targetVis.GetIsLinked()) Synchronize(field); 
        }

        internal void EnableAxisThresholdFilter(string field)
        {
            int numMarks = targetVis.markInstances.Count;
            List<bool> results = new List<bool>(new bool[numMarks]);
            for (int j = 0; j < results.Count; j++)
            {
                results[j] = true;
            }
            filterResults.Add(field, results);
        }
        
        internal void AddThresholdFilter(JSONObject interactionSpecs)
        {
            GameObject thresholdFilterPrefab = Resources.Load("GUI/ThresholdFilter", typeof(GameObject)) as GameObject;
            if (thresholdFilterPrefab == null) return;

            GameObject thresholdFilterInstance = Instantiate(thresholdFilterPrefab, gameObject.transform);
            thresholdFilterInstance.transform.Find("ThresholdFilterLabel").gameObject.GetComponent<TextMeshPro>().text =
                interactionSpecs["field"].Value + ":";
            thresholdFilterInstance.name = interactionSpecs["field"];

            thresholdFilterInstance.transform.Find("ThresholdFilterMinLabel").gameObject.GetComponent<TextMeshPro>().text =
                interactionSpecs["domain"][0].Value;
            thresholdFilterInstance.transform.Find("ThresholdFilterMaxLabel").gameObject.GetComponent<TextMeshPro>().text =
                interactionSpecs["domain"][1].Value;


            PinchSlider slider = thresholdFilterInstance.GetComponent<PinchSlider>();
            if (slider == null) return;

            //DxR.SliderGestureControlBothSide sliderControl =
            //    thresholdFilterInstance.GetComponent<DxR.SliderGestureControlBothSide>();
            //if (sliderControl == null) return;

            float domainMin = float.Parse(interactionSpecs["domain"][0].Value);
            float domainMax = float.Parse(interactionSpecs["domain"][1].Value);

            // TODO: Check validity of specs.

            //sliderControl.SetSpan(domainMin, domainMax);
            //sliderControl.SetSliderValue1(domainMin);
            //sliderControl.SetSliderValue2(domainMax);
            Transform button_label = thresholdFilterInstance.transform.Find("SliderThumb/Button_AnimationContainer/Slider_Button/Label");
            if (button_label != null)
            {
                button_label.gameObject.GetComponent<ShowSliderValue>().minVal = domainMin;
                button_label.gameObject.GetComponent<ShowSliderValue>().maxVal = domainMax;

            }


            //sliderControl.OnUpdateEvent.AddListener(ThresholdFilterUpdated);
            slider.OnValueUpdated.AddListener(delegate { ThresholdFilterUpdated(thresholdFilterInstance); });

            // Update the results vector
            int numMarks = targetVis.markInstances.Count;
            List<bool> results = new List<bool>(new bool[numMarks]);
            for (int j = 0; j < results.Count; j++)
            {
                results[j] = true;
            }
            filterResults.Add(interactionSpecs["field"], results);

            thresholdFilterInstance.transform.Translate(0, -curYOffset / 2.0f, 0);
            curYOffset = curYOffset + (0.25f);
        }
        
        
        public void ThresholdFilterUpdated(GameObject thresholdFilterInstance)
        {
            //GameObject selectedObject = EventSystem.current.currentSelectedGameObject;
            //if (selectedObject == null) return;
            if (thresholdFilterInstance == null) return;

            Debug.Log("Threshold updated");

            string fieldName = "";
            /*
            // If the selected object is not a slider, ignore.
            if (selectedObject.transform.Find("SliderBar") != null)
            {
                fieldName = selectedObject.name;
            }
            else if (selectedObject.name == "SliderBar")
            {
                fieldName = selectedObject.transform.parent.name;
                selectedObject = selectedObject.transform.parent.transform.gameObject;
            }
            else
            {
                return;
            }*/
            float domainMin = 0;
            float domainMax = 1;
            Transform button_label = thresholdFilterInstance.transform.Find("SliderThumb/Button_AnimationContainer/Slider_Button/Label");
            if (button_label != null)
            {
                domainMin = button_label.gameObject.GetComponent<ShowSliderValue>().minVal;
                domainMax = button_label.gameObject.GetComponent<ShowSliderValue>().maxVal;
            }
            fieldName = thresholdFilterInstance.name;

            PinchSlider sliderControl = thresholdFilterInstance.GetComponent<PinchSlider>();
            //DxR.SliderGestureControlBothSide sliderControl =
            //   selectedObject.GetComponent<DxR.SliderGestureControlBothSide>();

            if (sliderControl != null && targetVis != null)
            {
                // Update filter results for thresholded data field category.
                /*
                if (sliderControl.SliderValue1< sliderControl.SliderValue2)
                    UpdateFilterResultsForThreshold(fieldName, sliderControl.SliderValue1, sliderControl.SliderValue2);
                else
                    UpdateFilterResultsForThreshold(fieldName, sliderControl.SliderValue2, sliderControl.SliderValue1);*/


                float temp = sliderControl.SliderValue * (domainMax - domainMin) + domainMin;

                UpdateFilterResultsForThreshold(fieldName, domainMin, temp);


                targetVis.FiltersUpdated();
                Debug.Log("Filter updated! " + fieldName);
            }
        }
        
        private void UpdateFilterResultsForThreshold(string field, float thresholdMinValue, float thresholdMaxValue)
        {
            Debug.Log("Updating filter results for field, threshold " + field + ", " + thresholdMinValue.ToString() +"<"+ thresholdMaxValue.ToString());
            List<bool> res = filterResults[field];
            for (int b = 0; b < res.Count; b++)
            {
                if (float.Parse(targetVis.markInstances[b].GetComponent<Mark>().datum[field]) >= thresholdMinValue && float.Parse(targetVis.markInstances[b].GetComponent<Mark>().datum[field]) <= thresholdMaxValue)
                {
                    res[b] = true;
                }
                else
                {
                    res[b] = false;
                }
            }

            filterResults[field] = res;
            if (targetVis.GetIsLinked())
            {
                for (int i = 0; i < DxRVisObjects.Length; i++)
                {
                    if (DxRVisObjects[i].GetComponent<Vis>().GetIsLinked())
                    {
                        if (DxRVisObjects[i].GetComponent<Vis>().GetDataName() == targetVis.GetDataName())
                        {
                            GameObject DxRInteraction = DxRVisObjects[i].transform.Find("DxRInteractions").gameObject;
                            List<bool> t_res = new List<bool>(new bool[res.Count]);
                            if (!DxRInteraction.GetComponent<Interactions>().filterResults.ContainsKey(field))
                            {
                                DxRInteraction.GetComponent<Interactions>().filterResults.Add(field, t_res);
                            }
                            for (int b = 0; b < t_res.Count; b++)
                            {
                                if (float.Parse(DxRVisObjects[i].GetComponent<Vis>().markInstances[b].GetComponent<Mark>().datum[field]) >= thresholdMinValue && float.Parse(DxRVisObjects[i].GetComponent<Vis>().markInstances[b].GetComponent<Mark>().datum[field]) <= thresholdMaxValue)
                                {
                                    t_res[b] = true;
                                }
                                else
                                {
                                    t_res[b] = false;
                                }
                            }

                            DxRInteraction.GetComponent<Interactions>().filterResults[field] = t_res;
                            DxRVisObjects[i].GetComponent<Vis>().FiltersUpdated();
                        }
                    }
                }
            }
            //Synchronize(field);
            if (targetVis.GetIsLinked()) Synchronize(field);

        }

        private void Synchronize(string field)
        {
            for (int i = 0; i < DxRVisObjects.Length; i++)
            {
                if (DxRVisObjects[i].GetComponent<Vis>().GetIsLinked())
                {
                    if (DxRVisObjects[i].GetComponent<Vis>().GetDataName() == targetVis.GetDataName())
                    {
                        GameObject DxRInteraction = DxRVisObjects[i].transform.Find("DxRInteractions").gameObject;
                        if (DxRInteraction != null)
                        {
                            if (DxRInteraction.GetComponent<Interactions>().filterResults.ContainsKey(field))
                            {
                                DxRInteraction.GetComponent<Interactions>().filterResults[field] = filterResults[field];
                                DxRVisObjects[i].GetComponent<Vis>().FiltersUpdated();
                            }
                        }
                    }
                }
            }
        }
    }
}