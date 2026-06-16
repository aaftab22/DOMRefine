const API_BASE = "http://127.0.0.1:8000";

export async function runAudit(url) {
    
    console.log(url);

    const response = await fetch(
        `${API_BASE}/audit?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
    }

    return response.json();
}
