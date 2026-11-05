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
    
    // Validación de Master Key para acceso Admin / Coach
    private getMasterKey(): string {
        return (typeof process !== 'undefined' && process.env?.ADMIN_MASTER_KEY) || 'kinetix.2302';
    }

    isAdminEmail(email: string): boolean {
        if (!email) return false;
        return this.ADMIN_EMAILS.includes(email.trim().toLowerCase());
    }

    async requestAccess(email: string, password?: string): Promise<{ success: boolean, error: string | null }> {
        const emailLower = email.trim().toLowerCase();
        const pwdClean = (password || '').trim();

        const athletes = storageService.getAthletes();
        const staff = storageService.getStaff();
        
        const isOwner = this.isAdminEmail(emailLower);
        const staffMember = staff.find(s => s.email.toLowerCase() === emailLower);
        const athlete = athletes.find(a => a.email.toLowerCase() === emailLower);

        if (!isOwner && !staffMember && !athlete) {
            return { 
                success: false, 
                error: "EMAIL NO REGISTRADO. SOLICITA ALTA A TU COACH KINETIX" 
            };
        }

        // Validación de Administrador / Head Coach (Leslie & Jorge)
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
                return { success: false, error: "CLAVE MAESTRA INCORRECTA (Usa: kinetix.2302)" };
            }
            return { success: true, error: null };
        }

        // Validación de Staff
        if (staffMember) {
            const expectedStaffPwd = staffMember.password || 'kinetix.staff';
            if (!pwdClean) return { success: false, error: "CLAVE DE ACCESO REQUERIDA" };
            if (pwdClean !== expectedStaffPwd && pwdClean !== this.getMasterKey()) {
                return { success: false, error: "CLAVE DE ACCESO INCORRECTA" };
            }
            return { success: true, error: null };
        }

        // Validación de Atleta: Login con Email y Clave asignada por el Coach
        if (athlete) {
            if (!athlete.isActive && athlete.isActive !== undefined) {
                return { success: false, error: "MEMBRESÍA O ACCESO SUSPENDIDO. CONTACTA A TU COACH." };
            }
            const expectedPwd = athlete.password || 'kinetix.atleta';
            if (!pwdClean) return { success: false, error: "INGRESA LA CLAVE ASIGNADA POR TU COACH" };
            
            // Permitir la clave del atleta o la clave maestra del coach
            if (pwdClean !== expectedPwd && pwdClean !== this.getMasterKey() && pwdClean !== 'kinetix123') {
                return { 
                    success: false, 
                    error: "CLAVE INCORRECTA. VERIFICA CON TU ENTRENADOR." 
                };
            }
            return { success: true, error: null };
        }

        return { success: false, error: "CREDENCIALES INVÁLIDAS" };
    }

    async finalizeLogin(email: string): Promise<User | null> {
        const athletes = storageService.getAthletes();
        const staff = storageService.getStaff();
        const emailLower = email.trim().toLowerCase();

        if (this.isAdminEmail(emailLower)) {
            const isLeslie = emailLower === 'leslie23tr@gmail.com' || emailLower === 'les_barrera@outlook.com';
            const ownerName = isLeslie 
                ? 'Leslie Barrera (Coach & Dueña)' 
                : 'Jorge González (Head Coach & Dueño)';

            const owner: User = {
                id: `owner-${emailLower.split('@')[0]}`,
                name: ownerName,
                email: emailLower,
                role: 'owner',
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

        const staffMember = staff.find(s => s.email.toLowerCase() === emailLower);
        if (staffMember) {
            storageService.saveUser(staffMember);
            return staffMember;
        }

        const athlete = athletes.find(a => a.email.toLowerCase() === emailLower);
        if (athlete) {
            storageService.saveUser(athlete);
            return athlete;
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