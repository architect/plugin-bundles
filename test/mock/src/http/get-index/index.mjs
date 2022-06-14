import arc from '@architect/functions'

export async function handler (req) {
  const filePath = arc.static('yolo.mjs')
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: filePath
  }
}