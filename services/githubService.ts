
export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

class GitHubService {
  private headers(token: string) {
    return {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  // NUEVO: Probar si el token funciona y quién es el dueño
  async testConnection(token: string): Promise<{ success: boolean; login?: string; scopes?: string[]; error?: string }> {
    try {
      const res = await fetch('https://api.github.com/user', { headers: this.headers(token) });
      
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.message || "Token inválido" };
      }

      const data = await res.json();
      // Leer los permisos desde los headers de GitHub
      const scopes = res.headers.get('X-OAuth-Scopes')?.split(',').map(s => s.trim()) || [];
      
      return { 
        success: true, 
        login: data.login, 
        scopes: scopes 
      };
    } catch (e) {
      return { success: false, error: "Error de conexión con los servidores de GitHub" };
    }
  }

  async ensureRepoExists(config: GitHubConfig): Promise<{ success: boolean; error?: string }> {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}`;
    
    try {
      const res = await fetch(url, { headers: this.headers(config.token) });
      
      if (res.ok) return { success: true };
      
      if (res.status === 404) {
        const createRes = await fetch(`https://api.github.com/user/repos`, {
          method: 'POST',
          headers: this.headers(config.token),
          body: JSON.stringify({
            name: config.repo,
            private: false,
            description: "Kinetix Elite Platform - Auto Replicated",
            auto_init: false
          })
        });

        if (createRes.ok) return { success: true };
        const errData = await createRes.json();
        return { success: false, error: `GitHub dice: ${errData.message}` };
      }

      const errData = await res.json();
      return { success: false, error: errData.message };
    } catch (e) {
      return { success: false, error: "Error de red" };
    }
  }

  async pushFile(config: GitHubConfig, path: string, content: string, message: string) {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
    
    let sha = null;
    try {
      const res = await fetch(url, { headers: { 'Authorization': `token ${config.token}` } });
      if (res.ok) {
        const data = await res.json();
        sha = data.sha;
      }
    } catch (e) {}

    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content))), 
      branch: config.branch,
      sha: sha || undefined
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.headers(config.token),
      body: JSON.stringify(body)
    });

    return response.ok;
  }
}

export const githubService = new GitHubService();
