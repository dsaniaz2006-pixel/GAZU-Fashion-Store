// Public compatibility facade: imports and Vitest mocks throughout Waves 1–3
// continue to use ../api.js. Implementations live in lib/api and lib/catalogue.
export { api } from "./lib/api/httpClient.js";
export { toProduct, toCart } from "./lib/catalogue/productAdapters.js";
export { uploadImage } from "./lib/api/imageUpload.js";
