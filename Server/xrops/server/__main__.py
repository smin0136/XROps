if __name__ == '__main__':
    import uvicorn

#    uvicorn.run("main:app", host="0.0.0.0", port=6040, reload=True, workers=100)
    uvicorn.run("main:app", host="0.0.0.0", port=6040, ssl_keyfile="./../.cert/vience_io.key", ssl_certfile="./../.cert/vience_io_cert.crt", reload=True, workers=100)