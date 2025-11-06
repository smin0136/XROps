<div align="center">

# 🧩 XROps: A Visual Workflow Management Framework for Dynamic Immersive Analytics  
**IEEE Transactions on Visualization and Computer Graphics (TVCG 2025)**  
📍 Presented at **IEEE VIS 2025**

[![Paper](https://img.shields.io/badge/Paper-arXiv%3A2507.10043-b31b1b.svg)](https://arxiv.org/abs/2507.10043)
[![Demo](https://img.shields.io/badge/Demo-xrops-blue.svg)](https://vience.io/xrops)
</div>

---

## 🌐 Overview
**XROps** is a unified visual workflow management framework for **dynamic immersive analytics (IA)**.  
It bridges **XR authoring**, **data processing**, and **interactive analysis** —  
enabling domain experts to build, visualize, and manage immersive workflows **without low-level coding**.


<p align="center">
  <img src="assets/teaser.jpg" width="85%" alt="System overview">
</p>

---

## 🎯 Key Features
- 🧩 **Dynamic Workflow Management** — real-time reconfiguration of analytic pipelines  
- 🧠 **Visual Programming Environment** — node-based design for task abstraction  
- 🌍 **Hybrid Collaboration** — synchronize 2D authoring ↔ XR visualization  
- 🧮 **Diverse Data Support** — handle volumetric, mesh, image, point cloud, tabular, sensor, and streaming data  

---

## 🖥️ System Architecture
<p align="center">
  <img src="assets/system_architecture.jpg" width="80%" alt="System architecture">
</p>

- **Front-End:** React + Rete.js (node-based visual authoring)  
- **Back-End:** Python FastAPI 
- **XR Rendering:** Unity

---

## 🧪 Publication
> **XROps: A Visual Workflow Management Framework for Dynamic Immersive Analytics**  
> *Suemin Jeon, Won-Ki Jeong*  
> _IEEE Transactions on Visualization and Computer Graphics (TVCG 2025)_  
> Presented at **IEEE VIS 2025**  
> [[Paper](https://arxiv.org/abs/2507.10043)] · [[Demo](https://vience.io/xrops)]

---

## 🎥 Demo
- 🎬 [**Live Demo**] [![Demo Preview](assets/visual_programming.jpg)](assets/xrops_video_0910.mp4)
-  Sample walkthroughs our framework and 4 casestudies.


- 🌐 [**Platform**] (https://vience.io/xrops)
- 📂 [**DEMO Doc**] (https://sites.google.com/view/xrops)
- For hands-on experience, you can download the `.appx` package from the provided [**DEMO Doc**] link (Tutorial/How to Start) or [**google drive link**] below and explore the demonstrations outlined in our publication, with the access code **demo1**, **demo2**, **demo3**, and **demo4**.

[**appx**] https://drive.usercontent.google.com/download?id=1d0nobBXIAhyOVOxR4uIX8jE-VLxiy2OF&export=download&authuser=0

---

## 📂 Repository Structure
Server/xrops
├── client/ # frontend code
├── dockerfile/ # main, workspace docker
└── server/ # backend code

---

## 🛠️ Installation of Server
```bash
# Clone the repo
git clone https://github.com/smin0136/xrops.git
cd Server\xrops

# docker build
docker build -t {tag}

sh run_mainserver.sh all main_xrops

sh run_workspaceserver.sh workspace_xrops

# run server

run python __main__.py, __workspace__.py inside each docker container 

# test

http://117.52.72.212:5040/docs
http://117.52.72.212:5050/docs

# Launch backend
python main.py

# Frontend
cd client
https://vience.io:6040  →  http://{own ip}:5040 

npm install
npm run start:xrops-test # run frontend
http://117.52.72.212:5030
```bash

---

## 💬 Citation

If you find this work useful, please cite:

@article{jeon2025xrops,
  title={XROps: A Visual Workflow Management System for Dynamic Immersive Analytics},
  author={Jeon, Suemin and Choi, JunYoung and Jeong, Haejin and Jeong, Won-Ki},
  journal={IEEE Transactions on Visualization and Computer Graphics},
  year={2025},
  publisher={IEEE}
}

🧑‍💻 Acknowledgements
This research was supported by National Research Foundation of Korea (NRF)— RS-2024-00349697, NRF-2021R1A6A1A13044830
Institute for Information & Communications Technology Planning & Evaluation (IITP)— IITP-2025-RS-2020-II201819
National Research Council of Science & Technology (NST)— 
MSIT, GTL24031-900Ministry of SMEs and Startups— Technology Development Program (RS-2024-00437796)
Korea University Grant

and presented at IEEE VIS 2025.

<div align="center"> <sub>© 2025 Suemin Jeon | Korea University </sub> </div> ```
