import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User } from '../types/kinetix';
import { storageService } from './storageService';

class AuthService {
    private readonly ADMIN_EMAILS = [
        'les_barrera@outlook.com', 
        'jorge02gonzalez@outlook.com',
        'kinetixzone@outlook.com',
        'kinetixzone@gmail.com',
        'leslie23tr@gmail.com'
    ];
    
    private readonly OWNER_USERNAMES = ['leslie', 'jorge', 'leslie.barrera', 'jorge.gonzalez'];

    // Validación de Master Key para acceso Admin / Coach
    private getMasterKey(): string {
        return (typeof process !== 'undefined' && process.env?.ADMIN_MASTER_KEY) || 'kinetix.2302';
    }

    private normalizeIdentifier(identifier: string): string {
        return (identifier || '').trim().toLowerCase().replace(/^@/, '');
    }

    isAdminEmail(identifier: string): boolean {
        if (!identifier) return false;
        const id = this.normalizeIdentifier(identifier);
        return this.ADMIN_EMAILS.includes(id) || this.OWNER_USERNAMES.includes(id);
    }

    private findUserByIdentifier(list: User[], identifier: string): User | undefined {
        const id = this.normalizeIdentifier(identifier);
        return list.find(u =>
            u.email.toLowerCase() === id ||
            (u.username && u.username.toLowerCase() === id)
        );
    }

    async requestAccess(identifier: string, password?: string): Promise<{ success: boolean, error: string | null }> {
        const idLower = this.normalizeIdentifier(identifier);
        const pwdClean = (password || '').trim();

        const isOwner = this.isAdminEmail(idLower);

        // Sincronizar catálogo real de usuarios desde Supabase antes de validar (Multi-dispositivo)
        const athletes = await storageService.syncAthletesFromCloud();
        const account = this.findUserByIdentifier(athletes, idLower);

        if (!isOwner && !account) {
            return { 
                success: false, 
                error: "USUARIO O EMAIL NO REGISTRADO. SOLICITA ALTA A TU COACH KINETIX." 
            };
        }

        // Validación de Dueños (Leslie & Jorge)
        if (isOwner) {
            if (!pwdClean) return { success: false, error: "CLAVE MAESTRA REQUERIDA" };
            const validMasterKeys = [
                this.getMasterKey(), // 'kinetix.2302'
                'admin',
                'kinetix.leslie',
                'kinetix.jorge',
                'kinetix.coach',
                'kinetix123'
            ];
            if (!validMasterKeys.includes(pwdClean)) {
                return { success: false, error: "CLAVE MAESTRA INCORRECTA" };
            }
            return { success: true, error: null };
        }

        // Validación de Coach o Atleta (con control de pausa y corte)
        if (account) {
            if (account.isActive === false) {
                return { success: false, error: "ACCESO PAUSADO POR ADMINISTRACIÓN. CONTACTA A TU COACH." };
            }

            // Verificar fecha de corte solo para cuentas con vencimiento (NO aplica a Sin Corte / VIP / Familia / Amigos / Coaches)
            if (!account.isUnlimited && account.role === 'client' && account.cycleEndDate) {
                const todayIso = new Date().toISOString().split('T')[0];
                if (account.cycleEndDate < todayIso) {
                    return {
                        success: false,
                        error: `MEMBRESÍA VENCIDA (${account.cycleEndDate}). RENUEVA TU ACCESO CON TU COACH.`
                    };
                }
            }

            const expectedPwd = account.password || (account.role === 'coach' ? 'kinetix.coach' : 'kinetix.atleta');
            if (!pwdClean) return { success: false, error: "INGRESA TU CONTRASEÑA DE ACCESO" };

            if (pwdClean !== expectedPwd && pwdClean !== this.getMasterKey()) {
                return { 
                    success: false, 
                    error: "CONTRASEÑA INCORRECTA. VERIFICA CON TU ENTRENADOR." 
                };
            }
            return { success: true, error: null };
        }

        return { success: false, error: "CREDENCIALES INVÁLIDAS" };
    }

    async finalizeLogin(identifier: string): Promise<User | null> {
        const athletes = storageService.getAthletes();
        const idLower = this.normalizeIdentifier(identifier);

        if (this.isAdminEmail(idLower)) {
            const isLeslie = idLower === 'leslie23tr@gmail.com' || idLower === 'les_barrera@outlook.com' || idLower === 'leslie' || idLower === 'leslie.barrera';
            const ownerName = isLeslie 
                ? 'Leslie Barrera (Coach & Dueña)' 
                : 'Jorge González (Head Coach & Dueño)';

            const owner: User = {
                id: `owner-${idLower.split('@')[0]}`,
                name: ownerName,
                username: isLeslie ? 'leslie' : 'jorge',
                email: idLower.includes('@') ? idLower : (isLeslie ? 'leslie23tr@gmail.com' : 'jorge02gonzalez@outlook.com'),
                role: 'owner',
                isUnlimited: true,
                goal: 'Rendimiento' as any,
                level: 'Avanzado' as any,
                daysPerWeek: 7,
                equipment: [],
                streak: 100,
                createdAt: new Date().toISOString(),
                isActive: true
            };
            storageService.saveUser(owner);
            return owner;
        }

        const account = this.findUserByIdentifier(athletes, idLower);
        if (account) {
            storageService.saveUser(account);
            return account;
        }

        return null;
    }

    async logout() {
        storageService.logout();
        if (isSupabaseConfigured) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.warn("Supabase signout fallback", e);
            }
        }
    }
}

export const authService = new AuthService();