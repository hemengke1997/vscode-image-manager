export function parseJson(source: string | null | undefined) {
  if (!source) {
    return null
  }

  try {
    return JSON.parse(source)
  } catch (e) {
    return null
  }
}
