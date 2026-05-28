export default function handler(request, response) {
  response.status(200).json({
    ok: true,
    name: "果冻写作台",
    mode: "vercel-api",
    time: new Date().toISOString()
  });
}

