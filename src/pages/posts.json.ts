export async function GET({ params, request, url, site }) {
  const posts = import.meta.glob("../data/blog-posts/*.mdx");
  const newPosts = [];
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
  for (const post of Object.values(posts)) {
    const p = await post();
    newPosts.push({
      slug: `${p.file.split("/").pop().split(".").shift()}`,
      ...p.frontmatter,
    });
  }
  return new Response(
    JSON.stringify({
      site,
      posts: newPosts,
    }),
    {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": request.headers.get(
          "Access-Control-Request-Headers"
        ),
        "Content-Type": "application/json",
      },
    }
  );
}
