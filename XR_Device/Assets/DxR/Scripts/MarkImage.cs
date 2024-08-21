using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace DxR
{
    /// <summary>
    /// This is the class for point mark which enables setting of channel
    /// values which may involve calling custom scripts. The idea is that 
    /// in order to add a custom channel, the developer simply has to implement
    /// a function that takes in the "channel" name and value in string format
    /// and performs the necessary changes under the SetChannelValue function.
    /// </summary>
    public class MarkImage : Mark
    {
        public MarkImage() : base()
        {

        }
        private Material ImageMaterial = null;
        private Texture2D ImageTexture = null;

        public override void SetChannelValue(string channel, string value) 
        {
            switch (channel)
            {
                default:
                    base.SetChannelValue(channel, value);
                    break;
            }
        }

        public void SetChannelTexture(string channel, byte[] texture)
        {
            switch (channel)
            {
                case "texture":
                    SetTexture(texture);
                    break;
                default:
                    Debug.Log("no texture");
                    break;
            }
        }

        private void SetTexture(byte[] texture)
        {
            ImageMaterial = gameObject.GetComponent<MeshRenderer>().material;
            ImageTexture = new Texture2D(640,480, TextureFormat.ARGB32, false);
            ImageMaterial.mainTexture = ImageTexture;
            ImageTexture.LoadRawTextureData(texture);
            ImageTexture.Apply();
        }
    }
}
