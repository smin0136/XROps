# =================================
# Pytorch and cuda
# =================================
FROM pytorch/pytorch:1.12.0-cuda11.3-cudnn8-devel
# =================================
ARG USERNAME=jychoi
ARG UID=1003

RUN echo $USERNAME

RUN useradd -d /home/$USERNAME -m -s /bin/bash -u $UID $USERNAME
RUN echo "${USERNAME}:${USERNAME}" | chpasswd
RUN usermod -aG sudo $USERNAME
# # =================================
RUN apt-get -y update
RUN apt-get -y --allow-unauthenticated upgrade 
RUN apt-get update --fix-missing
RUN apt-get -y install libgl1-mesa-glx 
RUN apt-get install -y libglib2.0-0 libsm6 libxext6 libxrender-dev librsvg2-bin libc6 libvips
RUN apt-get install -y tmux vim htop wget python-setuptools curl git sudo

# # =================================
# # NodeJS
# # =================================
# # RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
# #     apt-get install -y nodejs

WORKDIR /home

# =================================
# Custom Setting
# =================================
COPY . .
RUN pip install --ignore-installed PyYAML
RUN pip install --upgrade pip
RUN pip install --upgrade cython
RUN pip install av
RUN pip install ccxt
RUN pip install thop
RUN pip install -r /home/requirements.txt
RUN pip install cmake
RUN pip install trimesh
# =================================
# JupyterLab Setting
# =================================
#RUN jupyter nbextension enable --py widgetsnbextension && \
#    jupyter labextension install @jupyter-widgets/jupyterlab-manager && \
#    jupyter labextension install jupyter-matplotlib && \
#    jupyter labextension install @jupyterlab/toc

WORKDIR /workspace
RUN chmod -R a+w .

USER $USERNAME
ENV HOME /home/$USERNAME
