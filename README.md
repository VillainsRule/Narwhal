<h2 align='center'>narwhal</h2>
<h4 align='center'>a predeployed worker is available at https://n2.villainsrule.xyz!</h4>

<br>

### bun version

1. install [bun](https://bun.sh)
2. copy `.env.example` to `.env`
3. fill out ACCOUNT_EMAIL and ACCOUNT_PASSWORD with an email/passowrd to an edpuzzle teacher account
4. `bun install`
5. `bun narwhal/narwhal.ts`

### workers version

1. install [bun](https://bun.sh)
2. `bun install`
3. `bunx wrangler login`
4. login to cloudflare
5. `cp wrangler.example.jsonc wrangler.jsonc`
6. `bunx wrangler kv namespace create narwhal`
7. add the output ID from the above command to `wrangler.jsonc`
8. add an edpuzzle teacher account username/password to the top of `workers/narwhal.ts`
9. `bunx wrangler deploy`
10. you can add custom domains from the cloudflare dashboard
11. make sure to add any custom domains to wrangler.jsonc [as documented here](https://developers.cloudflare.com/workers/wrangler/configuration/#custom-domains)
