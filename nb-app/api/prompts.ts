export const config = {
  runtime: 'edge',
};

const PROMPT_API_URL = 'https://raw.githubusercontent.com/glidea/banana-prompt-quicker/main/prompts.json';

export default async function handler(request: Request) {
  try {
    const response = await fetch(PROMPT_API_URL);

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // 边缘缓存 1 小时 (3600s), 后台重新验证 24 小时 (86400s)
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch prompts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
