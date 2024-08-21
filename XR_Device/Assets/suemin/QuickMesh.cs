using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.IO;
using System.Security.Cryptography;

public class QuickMesh : MonoBehaviour
{
    void Start()
    {
        // JSON 파일 경로
        string filePath = Path.Combine(Application.dataPath, "/suemin/mesh_data.json");
        if (File.Exists(filePath))
        {
            Debug.Log("file exist");
            // 파일 읽기
            string dataAsJson = File.ReadAllText(filePath);
            // JSON 데이터를 MeshData 객체로 변환
            MeshData loadedData = JsonUtility.FromJson<MeshData>(dataAsJson);
            Debug.Log("loaded");

            CreateMesh(loadedData);
            Debug.Log("create mesh");

            /*
            Mesh mesh = new Mesh();

            mesh.vertices = loadedData.vertices.ToArray();
            mesh.triangles = faces;

            if (normals.Length < 1)
                mesh.RecalculateNormals();
            else
                mesh.normals = normals;

            int face_cnt = faces.Length;
            int num = face_cnt / 3;
            int[] wires = new int[num * 3 * 2];
            for (int iTria = 0; iTria < num; iTria++)
            {
                for (int iVertex = 0; iVertex < 3; iVertex++)
                {
                    wires[6 * iTria + 2 * iVertex] = faces[3 * iTria + iVertex];
                    wires[6 * iTria + 2 * iVertex + 1] = faces[3 * iTria + (iVertex + 1) % 3];
                }
            }

            bool isMade = false;
            GameObject MeshPrefab = null;
            


            if (isMade == false)
            {
                Vector3 pos = Camera.main.transform.position + Camera.main.transform.forward * 1;

                GameObject meshPrefab = Resources.Load("Marks/Mesh/MeshPrefab") as GameObject;
                if (meshPrefab == null)
                    Debug.Log("this is null");
                MeshPrefab = Instantiate(meshPrefab, pos, Quaternion.identity);
                MeshPrefab.name = trans_id.Trim(' ');

                MeshPrefab.transform.Find("Mesh").GetComponent<MeshFilter>().mesh = mesh;

                Mesh line_mesh = MeshPrefab.transform.Find("mesh_line").gameObject.GetComponent<MeshFilter>().mesh;
                line_mesh.vertices = points;
                line_mesh.SetIndices(wires, MeshTopology.Lines, 0);
                line_mesh.normals = mesh.normals;

                renderedMeshes.Add(MeshPrefab);
            }
            // 여기서 loadedData를 사용하여 무언가를 할 수 있음*/
        }
        else
        {
            Debug.LogError("Cannot find file!");
        }
    }


    void CreateMesh(MeshData data)
    {
        Mesh mesh = new Mesh();

        // 꼭짓점 배열을 생성합니다.
        Vector3[] vertices = new Vector3[data.vertices.Count];
        for (int i = 0; i < data.vertices.Count; i++)
        {
            vertices[i] = new Vector3(data.vertices[i][0], data.vertices[i][1], data.vertices[i][2]);
        }
        mesh.vertices = vertices;

        // 삼각형 배열을 생성합니다.
        mesh.triangles = data.faces.ToArray();

        // 꼭짓점 법선 배열을 생성합니다 (옵션).
        Vector3[] normals = new Vector3[data.verticesNormals.Count];
        for (int i = 0; i < data.verticesNormals.Count; i++)
        {
            normals[i] = new Vector3(data.verticesNormals[i][0], data.verticesNormals[i][1], data.verticesNormals[i][2]);
        }
        mesh.normals = normals;

        // 메쉬 필터 컴포넌트에 생성된 메쉬를 할당합니다.
        GetComponent<MeshFilter>().mesh = mesh;

        // 메쉬 콜라이더를 추가하거나 업데이트합니다 (옵션).
        MeshCollider meshCollider = gameObject.GetComponent<MeshCollider>();
        if (meshCollider == null)
        {
            meshCollider = gameObject.AddComponent<MeshCollider>();
        }
        meshCollider.sharedMesh = mesh;
    }
}

[System.Serializable]
public class MeshData
{
    public List<int> faces;
    public List<List<float>> vertices;
    public List<List<float>> verticesNormals;
}
