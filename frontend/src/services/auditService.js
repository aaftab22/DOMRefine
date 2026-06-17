const API_BASE = import.meta.env.VITE_API_URL;

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
