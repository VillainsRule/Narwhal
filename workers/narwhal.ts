import crypto from 'node:crypto';

import type { KVNamespace } from '@cloudflare/workers-types';

interface Env {
    EDPUZZLE_ACCOUNT_EMAIL: string;
    EDPUZZLE_ACCOUNT_PASSWORD: string;
    narwhal: KVNamespace;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname === '/') return new Response('very cool program\n\nhttps://github.com/VillainsRule/Narwhal', { status: 200, headers: { 'Content-Type': 'text/plain' } });
        if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 });
        if (url.pathname === '/robots.txt') return new Response('User-agent: *\nDisallow: /', { status: 200, headers: { 'Content-Type': 'text/plain' } });

        const expiry = await env.narwhal.get('expiry');

        if (!expiry || Number(expiry) < Date.now()) {
            const homeReq = await fetch('https://edpuzzle.com/', {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://edpuzzle.com',
                    'Referer': 'https://edpuzzle.com/',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
                }
            });

            const firstVersionPartReq = await homeReq.text();

            const csrfCookie = homeReq.headers.get('set-cookie')!.split(';')[0] + ';';
            const firstVersionPart = firstVersionPartReq.replaceAll(' ', '').match(/version:"(.*?)",/)![1];

            const csrfReq = await fetch('https://edpuzzle.com/api/v3/csrf', {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://edpuzzle.com',
                    'Referer': 'https://edpuzzle.com/',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
                    'X-Chrome-Version': '144',
                    'X-Edpuzzle-Preferred-Language': 'en',
                    'X-Edpuzzle-Referrer': 'https://edpuzzle.com/',
                    'cookie': csrfCookie
                }
            });

            const csrfRes = await csrfReq.json() as { CSRFToken: string };
            const csrf = csrfRes.CSRFToken;

            const request = {
                username: env.EDPUZZLE_ACCOUNT_EMAIL,
                password: env.EDPUZZLE_ACCOUNT_PASSWORD,
                role: 'teacher'
            };

            const md5Hash = crypto.createHash('md5').update(JSON.stringify(request)).digest('hex').slice(0, 4);
            const multiplyBy = Number(firstVersionPart.split('.')[2]) + 10;
            const goofyAhhAnticheat = Math.floor(Date.now() / 1000) * multiplyBy;

            const loginResponse = await fetch('https://edpuzzle.com/api/v3/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': JSON.stringify(request).length.toString(),
                    'cookie': csrfCookie,
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0 Safari/537.36',
                    'x-chrome-version': '134',
                    'x-csrf-token': csrf,
                    'x-edpuzzle-preferred-language': 'en',
                    'x-edpuzzle-referrer': 'https://edpuzzle.com/discover',
                    'x-edpuzzle-web-version': firstVersionPart + '.' + md5Hash + goofyAhhAnticheat
                },
                body: JSON.stringify(request)
            });

            const Authorization = loginResponse.headers.get('authorization')?.replace('Bearer ', '')!;
            console.log('Logged in! Authorization:', Authorization);
            if (!Authorization.trim().startsWith('ey')) {
                console.error('This authorization token does not appear to be valid.');
                console.error('If it is blank or does not start with "ey", please open an issue on Github:');
                console.error('https://github.com/VillainsRule/Narwhal/issues');
                console.error('The program will try it, but it will not send any answers if it is invalid.');
            }

            await env.narwhal.put('expiry', (Date.now() + 1000 * 60 * 60).toString());
            await env.narwhal.put('authorization', Authorization);
            await env.narwhal.put('csrfCookie', csrfCookie);
        }

        const Authorization = await env.narwhal.get('authorization');
        const csrfCookie = await env.narwhal.get('csrfCookie');

        if (url.pathname.match(/\/api\/v3\/media\/[0-9a-f]{1,30}/)) {
            const mediaID = url.pathname.split('/').pop();
            console.log('got media ID', mediaID);

            const mediaReq = await fetch(`https://edpuzzle.com/api/v3/media/${url.pathname.split('/').pop()}`, {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://edpuzzle.com',
                    'Referer': `https://edpuzzle.com/media/${mediaID}`,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0 Safari/537.36',
                    'X-Chrome-Version': '134',
                    'X-Edpuzzle-Preferred-Language': 'en',
                    'x-edpuzzle-referrer': `https://edpuzzle.com/media/${mediaID}`,
                    cookie: csrfCookie + ` token=${Authorization};`
                }
            });

            const mediaRes = await mediaReq.json();

            return new Response(JSON.stringify(mediaRes), {
                status: mediaReq.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': mediaReq.headers.get('set-cookie') || '',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Private-Network': 'true'
                }
            });
        }

        return new Response('404 Not Found', {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Private-Network': 'true'
            }
        });
    }
}