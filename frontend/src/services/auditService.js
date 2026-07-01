const API_BASE = import.meta.env.VITE_API_URL;

export async function runAudit(url, useAI = true) {

    console.log(url, { use_ai: useAI });

    const response = await fetch(
        `${API_BASE}/audit?url=${encodeURIComponent(url)}&use_ai=${useAI}`
    );

    if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
    }

    return response.json();
}