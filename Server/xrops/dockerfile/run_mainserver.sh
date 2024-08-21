clear -x
echo Running Mainserver Docker...

# Allocate Physical Devices for Docker
if [ -z "$1" ]
then
    echo GPU \# not allocated
    exit 1
else
    if [ $1 = "all" ]
    then
	devices=all
    else
	devices=\"device=$1\"
    fi
fi

if [ -z "$2" ]
then 
	name=''
else
	name=$2
fi
# Name docker container
# container_name=jyheo_${name}

# Allocate shared memory
memsize=128G

# Docker run
docker run \
	-p 6040:6040 \
	-p 11000:11000 \
	-p 12012:12012 \
	-p 12010:12010 \
	-p 12000:12000 \
	-p 12001:12001 \
	-p 12002:12002 \
	-p 12003:12003 \
	-p 12004:12004 \
	-p 12005:12005 \
	-u jychoi \
	--gpus $devices \
	--rm \
    -v /home/vience:/workspace \
	--name $name \
	--hostname jychoi \
	-ti jychoi/pytorch:1.12.0-gpu \
/bin/bash
