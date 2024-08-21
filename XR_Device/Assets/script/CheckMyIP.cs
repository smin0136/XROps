using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net;
using UnityEngine;

public class CheckMyIP : MonoBehaviour
{
    public UnityEngine.UI.Text text;
    public string globalIP;

    // Start is called before the first frame update
    void Start()
    {
        globalIP = GetGlobalIPAddress();
        text.text = globalIP;
    }

    // Update is called once per frame
    void Update()
    {
        text.text = globalIP;
    }

    private string GetGlobalIPAddress()
    {
        var url = "https://api.ipify.org/";

        WebRequest request = WebRequest.Create(url);
        HttpWebResponse response = (HttpWebResponse)request.GetResponse();

        Stream dataStream = response.GetResponseStream();

        using StreamReader reader = new StreamReader(dataStream);

        var ip = reader.ReadToEnd();
        reader.Close();

        return ip;
    }
}
