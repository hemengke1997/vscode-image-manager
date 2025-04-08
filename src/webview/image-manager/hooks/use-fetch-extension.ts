import { useAsyncEffect } from 'ahooks'
import { EXT_ID } from '~/meta'
import logger from '~/utils/logger'
import GlobalStore from '../stores/global-store'

async function getExtensionLatestVersion(extensionName: string) {
  const url = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery'
  const body = {
    filters: [
      {
        criteria: [{ filterType: 7, value: extensionName }],
      },
    ],
    flags: 103,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json;api-version=6.1-preview.1',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch extension info: ${response.statusText}`)
  }

  const data = await response.json()
  const extension = data.results[0]?.extensions[0]
  if (!extension) {
    throw new Error('Extension not found')
  }

  return extension as {
    publisher: {
      publisherName: string
    }
    versions: {
      version: string
    }[]
  }
}

/**
 * 获取插件信息
 */
export default function useFetchExtension() {
  const { setExtLastetInfo } = GlobalStore.useStore(['setExtLastetInfo'])
  useAsyncEffect(async () => {
    try {
      const ext = await getExtensionLatestVersion(EXT_ID)
      logger.debug(
        {
          author: ext.publisher.publisherName,
          version: ext.versions[0].version,
        },
        'ext info',
      )
      setExtLastetInfo({
        author: ext.publisher.publisherName,
        version: ext.versions[0].version,
      })
    } catch {}
  }, [])
}
