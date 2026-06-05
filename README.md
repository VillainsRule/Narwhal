<div align='center'>
    <h1 align='center'>narwhal</h1>
    <h3 align='center'>a cloudflare worker API that returns edpuzzle answers!</h3>
</div>

<br><br>

<h2 align='center'>setup</h2>

1. install [bun](https://bun.sh) (node also supported)
2. `bun install`
3. `bunx wrangler login`
4. login to cloudflare
5. `cp wrangler.example.jsonc wrangler.jsonc`
6. `bunx wrangler kv namespace create narwhal`
7. add the output ID from the above command to `wrangler.jsonc`
8. add an edpuzzle teacher account to both of the vars in `wrangler.jsonc`
9. `bunx wrangler deploy`
10. you can add custom domains from the cloudflare dashboard
11. make sure to add any custom domains to wrangler.jsonc [as documented here](https://developers.cloudflare.com/workers/wrangler/configuration/#custom-domains)

<br><br>
<h5 align='center'>made with ❤️</h5>
