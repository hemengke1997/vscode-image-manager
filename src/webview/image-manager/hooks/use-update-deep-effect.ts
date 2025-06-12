import { createUpdateEffect, useDeepCompareEffect } from 'ahooks'

const useUpdateDeepEffect = createUpdateEffect(useDeepCompareEffect)

export default useUpdateDeepEffect
