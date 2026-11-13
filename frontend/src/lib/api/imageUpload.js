import { shouldExpireSession } from "../../authSessionPolicy.mjs";
import { publicConfig } from "../../config/publicConfig.js";

// Upload orchestration is separated from UI and JSON requests.
export function uploadImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("Choose an image to upload."));
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return reject(new Error("Choose a JPEG, PNG or WebP image."));
    if (!file.size || file.size > 5 * 1024 * 1024)
      return reject(new Error("Maximum image size is 5 MB."));
    const token=sessionStorage.getItem("gazu-token");
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      publicConfig.apiBaseUrl + "/admin/uploads",
    );
    xhr.setRequestHeader(
      "Authorization",
      `Bearer ${token}`,
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error("Upload connection failed."));
    xhr.onabort = () => reject(new Error("Upload was cancelled."));
    xhr.onload = () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        return reject(new Error("Upload failed: invalid server response."));
      }
      const result = data && typeof data === "object" ? data : {};
      if (shouldExpireSession({
        status: xhr.status,
        path: "/admin/uploads",
        requestToken: token,
        currentToken: sessionStorage.getItem("gazu-token"),
        code: result.code,
      })) {
        window.dispatchEvent(new Event("gazu-session-expired"));
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(result);
      else reject(new Error(typeof result.message === "string" ? result.message : "Upload failed."));
    };
    const body = new FormData();
    body.append("image", file);
    xhr.send(body);
  });
}
