clear -x
echo Running Workspaceserver Docker...

if [ -z "$1" ]
then 
	name=''
else
	name=$1
fi
# Name docker container
# container_name=jyheo_${name}

# Allocate shared memory
memsize=8G

# Docker run
docker run \
	-p 6050:6050 \
	-u jychoi \
	--rm \
    -v /home/vience:/workspace \
	--name $name \
	--hostname jychoi \
	-ti jychoi/pytorch:1.12.0-gpu \
/bin/bash