import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User } from '../types/kinetix';
import { storageService } from './storageService';

class AuthService {
    private readonly ADMIN_EMAILS = [
        'les_barrera@outlook.com', 
        'jorge02gonzalez@outlook.com',
        'kinetixzone@outlook.com',
        'kinetixzone@gmail.com'
    ];
    
    // El parche crítico: Validación de Master Key para acceso Admin
    private getMasterKey(): string {
        // En un entorno real, esto se valida contra una tabla de secretos en Supabase.
        return process.env.ADMIN_MASTER_KEY || 'kinetix.2302';
    }

    isAdminEmail(email: string): boolean {
        if (!email) return false;
        return this.ADMIN_EMAILS.includes(email.toLowerCase());
    }

    async requestAccess(email: string, password?: string): Promise<{ success: boolean, error: string | null }> {
        const emailLower = email.toLowerCase();
        const athletes = storageService.getAthletes();
        const staff = storageService.getStaff();
        
        const isOwner = this.isAdminEmail(emailLower);
        const isStaff = staff.some(s => s.email.toLowerCase() === emailLower);
        const isAthlete = athletes.some(a => a.email.toLowerCase() === emailLower);

        if (!isOwner && !isStaff && !isAthlete) {
            return { success: false, error: "IDENTIDAD NO RECONOCIDA EN EL SISTEMA" };
        }

        if (isOwner) {
            if (!password) return { success: false, error: "AUTORIZACIÓN ALPHA REQUERIDA" };
            if (password !== this.getMasterKey()) return { success: false, error: "CLAVE MAESTRA INCORRECTA" };
        }

        if (!isSupabaseConfigured) return { success: true, error: null };

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: { emailRedirectTo: window.location.origin },
            });
            if (error) return { success: false, error: error.message };
            return { success: true, error: null };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    async finalizeLogin(email: string): Promise<User | null> {
        const athletes = storageService.getAthletes();
        const staff = storageService.getStaff();
        const emailLower = email.toLowerCase();

        if (this.isAdminEmail(emailLower)) {
            const owner: User = {
                id: `owner-${emailLower.split('@')[0]}`,
                name: 'Jorge González',
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
            await supabase.auth.signOut();
        }
    }
}

export const authService = new AuthService();