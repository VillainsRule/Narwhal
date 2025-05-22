import axios from 'axios';
import crypto from 'node:crypto';

const ACCOUNT_EMAIL = 'ADD_EDPUZZLE_TEACHER_EMAIL_HERE';
const ACCOUNT_PASSWORD = 'ADD_EDPUZZLE_TEACHER_PASSWORD_HERE';

export default {
    async fetch(request: Request, env): Promise<Response> {
        const kv = env.narwhal;

        axios.defaults.headers.common['Accept'] = 'application/json, text/plain, */*';
        axios.defaults.headers.common['Accept-Encoding'] = 'gzip, deflate, br, zstd';
        axios.defaults.headers.common['Accept-Language'] = 'en-US,en;q=0.9';
        axios.defaults.headers.common['Origin'] = 'https://edpuzzle.com';
        axios.defaults.headers.common['Referer'] = 'https://edpuzzle.com/';
        axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';
        axios.defaults.headers.common['X-Chrome-Version'] = '134';
        axios.defaults.headers.common['X-Edpuzzle-Preferred-Language'] = 'en';
        axios.defaults.headers.common['X-Edpuzzle-Referrer'] = 'https://edpuzzle.com/';

        const expiry = await kv.get('expiry');

        if (!expiry || Number(expiry) < Date.now()) {
            const { headers: csrfHeaders, data: firstVersionPartReq } = await axios.get('https://edpuzzle.com/');

            const csrfCookieHeader = (typeof csrfHeaders['set-cookie'] === 'object' ? csrfHeaders['set-cookie']![0] : csrfHeaders['set-cookie']) as string;
            const csrfCookie = csrfCookieHeader.split(';')[0] + ';';

            const firstVersionPart = firstVersionPartReq.replaceAll(' ', '').match(/version:"(.*?)",/)[1];

            const { data: { CSRFToken: csrf } } = await axios.get('https://edpuzzle.com/api/v3/csrf', {
                headers: {
                    'cookie': csrfCookie
                }
            });

            const request = {
                username: ACCOUNT_EMAIL,
                password: ACCOUNT_PASSWORD,
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

            await kv.put('expiry', Date.now() + 1000 * 60 * 60);
            await kv.put('authorization', Authorization);
            await kv.put('csrfCookie', csrfCookie);
        }

        const Authorization = await kv.get('authorization');
        const csrfCookie = await kv.get('csrfCookie');

        const url = new URL(request.url);

        if (url.pathname.match(/\/api\/v3\/media\/[0-9a-f]{1,30}/)) {
            const mediaID = url.pathname.split('/').pop();
            console.log('got media ID', mediaID);

            const data = await axios.get(`https://edpuzzle.com/api/v3/media/${url.pathname.split('/').pop()}`, {
                headers: {
                    'x-edpuzzle-referrer': `https://edpuzzle.com/media/${mediaID}`,
                    cookie: csrfCookie + ` token=${Authorization};`
                },
                validateStatus: (status) => !!status
            });

            return new Response(JSON.stringify(data.data), {
                status: data.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': data.headers['set-cookie']?.[0]?.split(';')[0] + ';',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Private-Network': 'true'
                }
            });
        }

        return new Response(':P', {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Private-Network': 'true'
            }
        });
    }
}