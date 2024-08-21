// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using Microsoft.MixedReality.Toolkit.UI;
using TMPro;
using UnityEngine;

namespace Microsoft.MixedReality.Toolkit.Examples.Demos
{
    [AddComponentMenu("Scripts/MRTK/Examples/ShowSliderValue")]
    public class ShowSliderValue : MonoBehaviour
    {
        [SerializeField]
        private TextMeshPro textMesh = null;

        public float minVal = 0;
        public float maxVal = 1;

        public void OnSliderUpdated(SliderEventData eventData)
        {
            if (textMesh == null)
            {
                textMesh = GetComponent<TextMeshPro>();
            }

            if (textMesh != null)
            {

                if(minVal == 0 && maxVal == 0)
                {
                    textMesh.text = $"{eventData.NewValue:F2}";
                }
                else
                {
                    float temp = eventData.NewValue * (maxVal - minVal) + minVal;
                    textMesh.text = $"{temp:F2}";
                }
            }
        }
    }
}
