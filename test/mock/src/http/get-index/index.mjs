import arc from '@architect/functions'

export const handler = arc.http.async(async function(request) {
  const file = request.query.filePath
  const filePath = arc.static(file)

  return { filePath }
})
