export async function putPrivateFile(sb: any, bucket: string, path: string, bytes: Uint8Array) {
  const { data, error } = await sb.storage.from(bucket).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  })
  if (error) throw error
  return data
}

export async function getSignedUrl(sb: any, bucket: string, path: string, expiresIn = 60 * 15) {
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl as string
}
