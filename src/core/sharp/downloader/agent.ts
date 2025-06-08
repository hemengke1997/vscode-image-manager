import { isString } from 'es-toolkit'
import url from 'node:url'
import tunnelAgent from 'tunnel-agent'

const proxies = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'npm_config_https_proxy', 'npm_config_proxy']

function env(key: string) {
  return process.env[key]
}

export function agent(log: (message: string) => void) {
  try {
    const proxy = new url.URL(proxies.map(env).find(isString)!)
    const tunnel = proxy.protocol === 'https:' ? tunnelAgent.httpsOverHttps : tunnelAgent.httpsOverHttp
    const proxyAuth =
      proxy.username && proxy.password
        ? `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`
        : null
    log(`Via proxy ${proxy.protocol}//${proxy.hostname}:${proxy.port} ${proxyAuth ? 'with' : 'no'} credentials`)
    return tunnel({
      proxy: {
        port: Number(proxy.port),
        host: proxy.hostname,
        proxyAuth,
      },
    })
  } catch {
    return null
  }
}
