import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Cloudflare Workers 정적 에셋(public/)은 Range 요청(bytes=...)을 지원하지 않아서
 * (Accept-Ranges 헤더 자체가 없고, Range를 보내도 매번 200 전체 응답) <audio>의
 * 구간 이동(seek)이 production에서만 실패한다 - 전체를 한 번 내려받아 끝까지 버퍼링된
 * 뒤에만 겨우 동작. 그래서 이 라우트가 ASSETS 바인딩에서 파일을 한 번 읽어 와 직접
 * Range를 파싱하고 206 Partial Content로 잘라 응답한다. */
export const dynamic = "force-dynamic";

const ASSET_PATH = "/Always.mp3";
const CONTENT_TYPE = "audio/mpeg";

// 같은 Worker 인스턴스가 여러 요청을 처리하는 동안은 재사용 - 매 seek마다
// ASSETS 바인딩에서 4MB 전체를 다시 읽어오지 않도록.
let cachedBuffer: ArrayBuffer | null = null;

async function loadAsset(request: Request): Promise<ArrayBuffer> {
  if (cachedBuffer) return cachedBuffer;

  const { env } = getCloudflareContext();
  if (!env.ASSETS) {
    throw new Error("ASSETS 바인딩을 찾을 수 없습니다");
  }
  const res = await env.ASSETS.fetch(new URL(ASSET_PATH, request.url));
  if (!res.ok) {
    throw new Error(`에셋 조회 실패: ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  cachedBuffer = buffer;
  return buffer;
}

function parseRange(rangeHeader: string | null, size: number): { start: number; end: number } | null {
  if (!rangeHeader) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match) return null;

  const [, startStr, endStr] = match;
  let start: number;
  let end: number;

  if (startStr === "") {
    // 접미사 범위: "bytes=-500" = 마지막 500바이트
    const suffixLength = parseInt(endStr, 10);
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = parseInt(startStr, 10);
    end = endStr === "" ? size - 1 : Math.min(parseInt(endStr, 10), size - 1);
  }

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start < 0) return null;
  return { start, end };
}

export async function GET(request: Request) {
  let buffer: ArrayBuffer;
  try {
    buffer = await loadAsset(request);
  } catch (error) {
    return new Response(String(error), { status: 500 });
  }

  const size = buffer.byteLength;
  const range = parseRange(request.headers.get("range"), size);
  const cacheControl = "public, max-age=31536000, immutable";

  if (!range) {
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPE,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": cacheControl,
      },
    });
  }

  const { start, end } = range;
  const chunk = buffer.slice(start, end + 1);
  return new Response(chunk, {
    status: 206,
    headers: {
      "Content-Type": CONTENT_TYPE,
      "Content-Length": String(chunk.byteLength),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": cacheControl,
    },
  });
}
