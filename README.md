<div align="center">

# 🧩 XROps: A Visual Workflow Management Framework for Dynamic Immersive Analytics  
**IEEE Transactions on Visualization and Computer Graphics (TVCG 2025)**  
📍 Presented at **IEEE VIS 2025**

[![Paper](https://img.shields.io/badge/Paper-arXiv%3A2507.10043-b31b1b.svg)](https://arxiv.org/abs/2507.10043)
[![Demo](https://img.shields.io/badge/Demo-xrops-blue.svg)](https://vience.io/xrops)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Project](https://img.shields.io/badge/GitHub-xrops-black?logo=github)](https://github.com/smin0136/xrops)

</div>

---

## 🌐 Overview
**XROps** is a unified visual workflow management framework for **dynamic immersive analytics (IA)**.  
It bridges **XR authoring**, **data processing**, and **interactive analysis** —  
enabling domain experts to build, visualize, and manage immersive workflows **without low-level coding**.


<p align="center">
  <img src="assets/overview.png" width="85%" alt="System overview">
</p>

---

## 🎯 Key Features
- 🧩 **Dynamic Workflow Management** — real-time reconfiguration of analytic pipelines  
- 🧠 **Visual Programming Environment** — node-based design for task abstraction  
- 🌍 **Hybrid Collaboration** — synchronize 2D authoring ↔ XR visualization  
- 🧮 **Scientific Data Support** — handle volumetric, sensor, and streaming data  

---

## 🖥️ System Architecture
<p align="center">
  <img src="assets/architecture.png" width="80%" alt="System architecture">
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
- 🎬 [**Live Demo**]
-  Sample walkthroughs our framework and 4 casestudies.
<p align="center">
  <img src="assets/demo.gif" width="75%" alt="Demo preview">
</p>

- 🌐 [**Platform**] (https://vience.io/xrops)
- 📂 [**DEMO Doc**] (https://sites.google.com/view/xrops)
- For hands-on experience, you can download the `.appx` package from the provided [**DEMO Doc**] link (Tutorial/How to Start) or [**google drive link**] below and explore the demonstrations outlined in our publication, with the access code **demo1**, **demo2**, **demo3**, and **demo4**.

[**appx**] https://drive.usercontent.google.com/download?id=1d0nobBXIAhyOVOxR4uIX8jE-VLxiy2OF&export=download&authuser=0

---

## 📂 Repository Structure
```bash
xrops/
├── backend/ # FastAPI data interface
├── frontend/ # React + Rete.js node editor
├── xr/ # WebXR / Unity integration
├── examples/ # Sample IA workflows
└── docs/ # Paper figures and supplementary materials
```bash

---

## 🛠️ Installation (Coming Soon)
```bash
# Clone the repo
git clone https://github.com/smin0136/xrops.git
cd xrops

# Install dependencies
npm install && pip install -r requirements.txt

# Launch backend
python main.py

# Launch frontend
npm run dev
```bash


## 💬 Citation

If you find this work useful, please cite:

@article{jeon2025xrops,
  title={XROps: A Visual Workflow Management Framework for Dynamic Immersive Analytics},
  author={Jeon, Suemin and Jeong, Won-Ki},
  journal={IEEE Transactions on Visualization and Computer Graphics},
  year={2025}
}

🧑‍💻 Acknowledgements
This research was supported by the Immersive Visualization Lab, Korea University,
and presented at IEEE VIS 2025.

<div align="center"> <sub>© 2025 Suemin Jeon | Korea University | MIT License</sub> </div> ```
