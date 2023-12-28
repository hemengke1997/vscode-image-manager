import { AxiosPro, type CreateAxiosOptions } from '@minko-fe/axios-pro'

export * from '@minko-fe/axios-pro'

function createRequest(opt?: Partial<CreateAxiosOptions>) {
  return new AxiosPro(opt || {})
}

export const request = createRequest({
  withCredentials: true,
  requestOptions: {
    urlPrefix: import.meta.env.VITE_API_ORIGIN,
  },
})
