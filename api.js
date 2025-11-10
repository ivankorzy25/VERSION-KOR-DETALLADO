// ============================================
// API CLIENT PARA BACKEND
// ============================================

// Configuración de la API
const API_CONFIG = {
    // URL del backend - Servidor Ubuntu
    baseURL: 'http://192.168.1.100:3001/api',
    // Para desarrollo local:
    // baseURL: 'http://localhost:3001/api',
    timeout: 30000 // 30 segundos
};

// Gestión de token
const TokenManager = {
    get: () => localStorage.getItem('kor_api_token'),
    set: (token) => localStorage.setItem('kor_api_token', token),
    remove: () => localStorage.removeItem('kor_api_token'),
    isValid: () => !!TokenManager.get()
};

// Cliente HTTP con manejo de errores
class APIClient {
    constructor(config) {
        this.baseURL = config.baseURL;
        this.timeout = config.timeout;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = TokenManager.get();

        const config = {
            ...options,
            headers: {
                ...options.headers,
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        // Si hay body y no es FormData, convertir a JSON
        if (config.body && !(config.body instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(config.body);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    }

    delete(endpoint, body) {
        return this.request(endpoint, { method: 'DELETE', body });
    }
}

// Instancia del cliente
const api = new APIClient(API_CONFIG);

// ============================================
// SERVICIOS DE AUTENTICACIÓN
// ============================================

const AuthAPI = {
    // Login con contraseña de modo interno
    async login(password) {
        const response = await api.post('/auth/login', { password });
        if (response.success && response.token) {
            TokenManager.set(response.token);
        }
        return response;
    },

    // Verificar si el token es válido
    async verify() {
        try {
            const response = await api.get('/auth/verify');
            return response.success;
        } catch (error) {
            TokenManager.remove();
            return false;
        }
    },

    // Logout
    logout() {
        TokenManager.remove();
    },

    // Verificar si está autenticado
    isAuthenticated() {
        return TokenManager.isValid();
    }
};

// ============================================
// SERVICIOS DE IMÁGENES
// ============================================

const ImagesAPI = {
    // Subir nuevas imágenes
    async upload(files, productName, category = 'generadores-nafta') {
        const formData = new FormData();

        // Agregar archivos
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }

        // Agregar metadatos
        formData.append('productName', productName);
        formData.append('category', category);

        return await api.post('/images/upload', formData);
    },

    // Listar imágenes de un producto
    async list(productName, category = 'generadores-nafta') {
        return await api.get(`/images/${category}/${productName}`);
    },

    // Eliminar imágenes
    async delete(imagePaths) {
        return await api.delete('/images/delete', { images: imagePaths });
    },

    // Reordenar imágenes
    async reorder(productName, orderedImages, category = 'generadores-nafta') {
        return await api.post('/images/reorder', {
            productName,
            category,
            orderedImages
        });
    }
};

// ============================================
// SERVICIOS DE PDFs
// ============================================

const PDFsAPI = {
    // Subir PDF
    async upload(file, productName, category = 'generadores-nafta') {
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('productName', productName);
        formData.append('category', category);

        return await api.post('/pdfs/upload', formData);
    }
};

// ============================================
// HEALTH CHECK
// ============================================

const SystemAPI = {
    // Verificar estado del servidor
    async health() {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/health`);
            return await response.json();
        } catch (error) {
            return { status: 'ERROR', error: error.message };
        }
    }
};

// ============================================
// EXPORTAR API
// ============================================

window.KorAPI = {
    auth: AuthAPI,
    images: ImagesAPI,
    pdfs: PDFsAPI,
    system: SystemAPI,
    config: API_CONFIG
};

console.log('✅ KOR API Client cargado correctamente');
console.log(`📡 Backend URL: ${API_CONFIG.baseURL}`);
