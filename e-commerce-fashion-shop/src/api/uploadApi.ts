const API_BASE = "http://localhost:3000/api/v1";

export async function uploadFile(token: string, file: File): Promise<{ url: string }> {
	const form = new FormData();
	form.append("file", file);

	const res = await fetch(`${API_BASE}/upload`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: form,
	});
	if (!res.ok) throw new Error(await res.text());
	const data = await res.json();
	// Backend returns { fileUrl }, but some callers expect { url }.
	const url = data.url || data.fileUrl;
	if (!url) throw new Error("Upload failed: missing file URL from server");
	return { url };
}
