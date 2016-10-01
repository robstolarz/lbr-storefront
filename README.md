# Running
```sh
docker build . -t storefront
docker run -d -p 3000:3000 storefront
```
(stop it with `docker stop <id-returned-by-run-command>`)
