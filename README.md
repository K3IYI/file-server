# Node-File-Server

A simple Node.JS test server for browser file upload.

- Check is file exist in server with `api:/check/file`
- Simple upload as one file `api: /upload/simple` (do not need to call for merge api)
- Upload individual file chunks `api: /upload`
- Merge file chunks into file `api: /merge`
