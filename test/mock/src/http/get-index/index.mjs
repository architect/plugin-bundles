import arc from '@architect/functions'

async function http() {
  return { html: '<h1>Teapot</h1>' }
}

export const handler = arc.http.async(http)
