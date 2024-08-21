if __name__ == '__main__':
    import uvicorn

#    uvicorn.run("workspace:app", host="0.0.0.0", port=6050, reload=True, workers=10,log_config="log_workspace.ini")
    uvicorn.run("workspace:app", host="0.0.0.0", port=6050, ssl_keyfile="./../.cert/vience_io.key", ssl_certfile="./../.cert/vience_io_cert.crt", reload=True, workers=10,log_config="log_workspace.ini")